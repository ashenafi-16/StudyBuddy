from django.db import models
from django.contrib.auth import get_user_model
from group.models import StudyGroup

User = get_user_model()


class PomodoroSession(models.Model):
    # Model for tracking shared Pomodoro timer sessions
    
    class TimerState(models.TextChoices):
        IDLE = 'idle', 'Idle'
        RUNNING = 'running', 'Running'
        PAUSED = 'paused', 'Paused'
        COMPLETED = 'completed', 'Completed'

    class PhaseType(models.TextChoices):
        WORK = 'work', 'Work'
        SHORT_BREAK = 'short_break', 'Short Break'
        LONG_BREAK = 'long_break', 'Long Break'

    class SyncMode(models.TextChoices):
        FORCED = 'forced', 'Forced (All Members)'
        FLEXIBLE = 'flexible', 'Flexible (Invite Only)'

    group = models.ForeignKey(
        StudyGroup, 
        on_delete=models.CASCADE, 
        related_name='pomodoro_sessions'
    )
    
    # Timer settings
    work_duration = models.IntegerField(default=1500)    # 25 minutes
    break_duration = models.IntegerField(default=300)    
    long_break_duration = models.IntegerField(default=900)  # 15 minutes
    sessions_before_long_break = models.IntegerField(default=4)
    allow_member_pause = models.BooleanField(default=False)
    sync_mode = models.CharField(
        max_length=20,
        choices=SyncMode.choices,
        default=SyncMode.FLEXIBLE  # Default to FLEXIBLE so all members can control
    )
    
    # The Moment (Source of Truth)
    phase = models.CharField(
        max_length=20,
        choices=PhaseType.choices,
        default=PhaseType.WORK
    )
    state = models.CharField(
        max_length=20, 
        choices=TimerState.choices, 
        default=TimerState.IDLE
    )
    
    # Store the moment the current phase started
    # client calc: remaining = duration - (now - phase_start)
    phase_start = models.DateTimeField(null=True, blank=True)
    phase_duration = models.IntegerField(default=1500) # Duration of current phase in seconds
    
    # Handling Pauses
    # When paused, we record WHEN it was paused and how much time was left
    paused_at = models.DateTimeField(null=True, blank=True)
    remaining_seconds_at_pause = models.IntegerField(null=True, blank=True)

    current_session_number = models.IntegerField(default=1)
    
    # Control info
    started_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='started_pomodoro_sessions'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pomodoro_sessions'
        ordering = ['-created_at']

    def can_control(self, user, action):
        """
        Determine if a user can perform a specific action on this session.
        
        Sync Mode Rules:
        - FORCED mode: Only leader/admin can control timer
        - FLEXIBLE mode: All members can start/pause/resume (join the session)
        
        Settings changes are always leader-only regardless of mode.
        """
        if not user or not user.is_authenticated:
            return False
        
        # Check if user is the group creator (always has full control)
        is_creator = (self.group.created_by == user)
        if is_creator:
            return True
        
        # Check roles via GroupMember
        from group.models import GroupMember
        try:
            member = self.group.members.get(user=user, is_active=True)
        except GroupMember.DoesNotExist:
            return False
        
        # Admins and moderators have full control
        if member.role in [GroupMember.MemberRoles.admin, GroupMember.MemberRoles.moderator]:
            return True
        
        # Settings changes are ALWAYS leader-only
        if action in ['settings', 'toggle_sync_mode']:
            return False
        
        # FLEXIBLE mode: All members can control the timer
        if self.sync_mode == self.SyncMode.FLEXIBLE:
            if action in ['start', 'pause', 'resume', 'reset', 'next_phase']:
                return True
        
        # FORCED mode: Only allow pause/resume if allow_member_pause is enabled
        if self.sync_mode == self.SyncMode.FORCED:
            if action in ['pause', 'resume']:
                return self.allow_member_pause
        
        return False

    def __str__(self):
        return f"Pomodoro for {self.group.group_name} - {self.state}"

    # Business Logic Methods
    def start(self):
        """Start the timer for the current phase."""
        from django.utils import timezone
        
        # Determine duration based on phase
        duration = self.work_duration
        if self.phase == self.PhaseType.SHORT_BREAK:
            duration = self.break_duration
        elif self.phase == self.PhaseType.LONG_BREAK:
            duration = self.long_break_duration
            
        self.phase_start = timezone.now()
        self.phase_duration = duration
        self.state = self.TimerState.RUNNING
        self.paused_at = None
        self.remaining_seconds_at_pause = None
        self.save()

    def pause(self):
        """Pause the timer, freezing the remaining time."""
        from django.utils import timezone
        
        if self.state != self.TimerState.RUNNING:
            return
            
        now = timezone.now()
        elapsed = (now - self.phase_start).total_seconds()
        remaining = max(0, int(self.phase_duration - elapsed))
        
        self.state = self.TimerState.PAUSED
        self.paused_at = now
        self.remaining_seconds_at_pause = remaining
        self.save()

    def resume(self):
        """Resume the timer from where it was paused."""
        from django.utils import timezone
        
        if self.state != self.TimerState.PAUSED:
            return
            
        remaining = self.remaining_seconds_at_pause or 0
        now = timezone.now()
        new_start = now - timezone.timedelta(seconds=(self.phase_duration - remaining))
        
        self.phase_start = new_start
        self.state = self.TimerState.RUNNING
        self.paused_at = None
        self.remaining_seconds_at_pause = None
        self.save()

    def reset(self):
        """Reset the current phase to initial state."""
        self.state = self.TimerState.IDLE
        self.phase_start = None
        self.paused_at = None
        self.remaining_seconds_at_pause = None
        self.save()

    def next_phase(self):
        """Move to the next phase."""
        # Simple finite state machine
        if self.phase == self.PhaseType.WORK:
            # Check if long break needed
            if self.current_session_number % self.sessions_before_long_break == 0:
                self.phase = self.PhaseType.LONG_BREAK
            else:
                self.phase = self.PhaseType.SHORT_BREAK
        else:
            # Break is over, back to work
            self.phase = self.PhaseType.WORK
            self.current_session_number += 1
            
        # Reset for new phase
        self.reset()


class UserPomodoroSession(models.Model):
    """
    Per-user Pomodoro timer for FLEXIBLE mode.
    Each user has their own independent timer that runs separately.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_pomodoro_sessions'
    )
    group = models.ForeignKey(
        StudyGroup,
        on_delete=models.CASCADE,
        related_name='user_pomodoro_sessions'
    )
    
    # Timer state (same choices as PomodoroSession)
    phase = models.CharField(
        max_length=20,
        choices=PomodoroSession.PhaseType.choices,
        default=PomodoroSession.PhaseType.WORK
    )
    state = models.CharField(
        max_length=20,
        choices=PomodoroSession.TimerState.choices,
        default=PomodoroSession.TimerState.IDLE
    )
    
    # Timing info
    phase_start = models.DateTimeField(null=True, blank=True)
    phase_duration = models.IntegerField(default=1500)
    paused_at = models.DateTimeField(null=True, blank=True)
    remaining_seconds_at_pause = models.IntegerField(null=True, blank=True)
    
    current_session_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_pomodoro_sessions'
        unique_together = ('user', 'group')
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username}'s Pomodoro in {self.group.group_name} - {self.state}"
    
    def get_settings(self):
        """Get timer settings from the group's PomodoroSession."""
        try:
            group_session = self.group.pomodoro_sessions.first()
            if group_session:
                return {
                    'work_duration': group_session.work_duration,
                    'break_duration': group_session.break_duration,
                    'long_break_duration': group_session.long_break_duration,
                    'sessions_before_long_break': group_session.sessions_before_long_break,
                }
        except:
            pass
        return {
            'work_duration': 1500,
            'break_duration': 300,
            'long_break_duration': 900,
            'sessions_before_long_break': 4,
        }
    
    def start(self):
        """Start the user's timer for the current phase."""
        from django.utils import timezone
        
        settings = self.get_settings()
        duration = settings['work_duration']
        if self.phase == PomodoroSession.PhaseType.SHORT_BREAK:
            duration = settings['break_duration']
        elif self.phase == PomodoroSession.PhaseType.LONG_BREAK:
            duration = settings['long_break_duration']
            
        self.phase_start = timezone.now()
        self.phase_duration = duration
        self.state = PomodoroSession.TimerState.RUNNING
        self.paused_at = None
        self.remaining_seconds_at_pause = None
        self.save()
    
    def pause(self):
        """Pause the user's timer."""
        from django.utils import timezone
        
        if self.state != PomodoroSession.TimerState.RUNNING:
            return
            
        now = timezone.now()
        elapsed = (now - self.phase_start).total_seconds()
        remaining = max(0, int(self.phase_duration - elapsed))
        
        self.state = PomodoroSession.TimerState.PAUSED
        self.paused_at = now
        self.remaining_seconds_at_pause = remaining
        self.save()
    
    def resume(self):
        """Resume the user's timer from where it was paused."""
        from django.utils import timezone
        
        if self.state != PomodoroSession.TimerState.PAUSED:
            return
            
        remaining = self.remaining_seconds_at_pause or 0
        now = timezone.now()
        new_start = now - timezone.timedelta(seconds=(self.phase_duration - remaining))
        
        self.phase_start = new_start
        self.state = PomodoroSession.TimerState.RUNNING
        self.paused_at = None
        self.remaining_seconds_at_pause = None
        self.save()
    
    def reset(self):
        """Reset the user's timer to initial state."""
        self.state = PomodoroSession.TimerState.IDLE
        self.phase_start = None
        self.paused_at = None
        self.remaining_seconds_at_pause = None
        self.save()
    
    def next_phase(self):
        """Move to the next phase."""
        settings = self.get_settings()
        
        if self.phase == PomodoroSession.PhaseType.WORK:
            if self.current_session_number % settings['sessions_before_long_break'] == 0:
                self.phase = PomodoroSession.PhaseType.LONG_BREAK
            else:
                self.phase = PomodoroSession.PhaseType.SHORT_BREAK
        else:
            self.phase = PomodoroSession.PhaseType.WORK
            self.current_session_number += 1
            
        self.reset()

