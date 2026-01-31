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
