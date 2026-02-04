from django.db import models
from django.contrib.auth import get_user_model
from group.models import StudyGroup

User = get_user_model()


class PomodoroSession(models.Model):
    """Model for tracking shared Pomodoro timer sessions."""
    
    class TimerState(models.TextChoices):
        IDLE = 'idle', 'Idle'
        RUNNING = 'running', 'Running'
        PAUSED = 'paused', 'Paused'
        BREAK = 'break', 'Break'
        COMPLETED = 'completed', 'Completed'

    group = models.ForeignKey(
        StudyGroup, 
        on_delete=models.CASCADE, 
        related_name='pomodoro_sessions'
    )
    
    # Timer settings
    work_duration = models.IntegerField(default=1500)    # 25 minutes in seconds
    break_duration = models.IntegerField(default=300)    # 5 minutes in seconds
    long_break_duration = models.IntegerField(default=900)  # 15 minutes
    sessions_before_long_break = models.IntegerField(default=4)
    
    # Current state
    remaining_seconds = models.IntegerField(default=1500)
    state = models.CharField(
        max_length=20, 
        choices=TimerState.choices, 
        default=TimerState.IDLE
    )
    current_session_number = models.IntegerField(default=1)
    
    # Control info
    started_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='started_pomodoro_sessions'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pomodoro_sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pomodoro for {self.group.group_name} - {self.state}"

    def reset(self):
        """Reset timer to initial state."""
        self.remaining_seconds = self.work_duration
        self.state = self.TimerState.IDLE
        self.current_session_number = 1
        self.started_at = None
        self.save()

    def start_break(self):
        """Start break timer."""
        if self.current_session_number % self.sessions_before_long_break == 0:
            self.remaining_seconds = self.long_break_duration
        else:
            self.remaining_seconds = self.break_duration
        self.state = self.TimerState.BREAK
        self.save()

    def start_work(self):
        """Start work timer."""
        self.remaining_seconds = self.work_duration
        self.state = self.TimerState.RUNNING
        self.save()

    @property
    def formatted_time(self):
        """Return time in MM:SS format."""
        minutes = self.remaining_seconds // 60
        seconds = self.remaining_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"
