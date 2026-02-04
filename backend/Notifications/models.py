from django.db import models
from django.contrib.auth import get_user_model
from group.models import StudyGroup

User = get_user_model()

class Notification(models.Model):
    class NotificationTypes(models.TextChoices):
        MESSAGE = 'message', 'New Message'
        TASK = 'task', 'Task Assignment'
        GROUP = 'group', 'Group Update'
        SYSTEM = 'system', 'System Notification'
        # Pomodoro lifecycle notifications
        POMODORO_START = 'pomodoro_start', 'Pomodoro Started'
        FOCUS_END = 'focus_end', 'Focus Session Ended'
        BREAK_START = 'break_start', 'Break Started'
        BREAK_END = 'break_end', 'Break Ended'
        CYCLE_COMPLETE = 'cycle_complete', 'Pomodoro Cycle Complete'
    
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NotificationTypes.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_group = models.ForeignKey(
        StudyGroup, 
        on_delete=models.CASCADE, 
        blank=True, 
        null=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"