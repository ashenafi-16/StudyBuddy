import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StudySession(models.Model):
    """Model for scheduling study sessions with video meeting integration."""
    
    class SessionStatus(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Participants
    host = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='hosted_sessions'
    )
    participant = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='invited_sessions',
        null=True, 
        blank=True
    )
    
    # Meeting details
    meeting_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(
        max_length=20, 
        choices=SessionStatus.choices, 
        default=SessionStatus.SCHEDULED
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'study_sessions'
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"

    @property
    def meeting_url(self):
        """Generate Jitsi meeting URL."""
        return f"https://meet.jit.si/StudyBuddy_{self.meeting_id}"

    @property
    def is_active(self):
        """Check if meeting can be joined (within 5 minutes of start time)."""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        start_window = self.start_time - timedelta(minutes=5)
        return start_window <= now <= self.end_time
