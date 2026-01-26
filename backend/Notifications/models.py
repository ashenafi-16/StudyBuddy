from django.db import models
from django.contrib.auth import get_user_model
from group.models import StudyGroup

User = get_user_model()

class Notification(models.Model):
    class NotificationTypes(models.TextChoices):
        message = 'message', 'New Message'
        task = 'task', 'Task Assignment'
        group = 'group', 'Group Update'
        system = 'system', 'System Notification'
    
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=10, choices=NotificationTypes.choices)
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