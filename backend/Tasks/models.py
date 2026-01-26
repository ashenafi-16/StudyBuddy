from django.db import models
from django.contrib.auth import get_user_model
from group.models import StudyGroup
from django.utils import timezone
User = get_user_model()

class Task(models.Model):
    class PriorityLevels(models.TextChoices):
        low = 'low', 'Low'
        medium = 'medium', 'Medium'
        high = 'high', 'High'
        urgent = 'urgent', 'Urgent'

    class TaskStatus(models.TextChoices):
        pending = 'pending', 'Pending'
        in_progress = 'in_progress', 'In Progress'
        completed = 'completed', 'Completed'
        overdue = 'overdue', 'Overdue'
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='tasks')
    priority = models.CharField(max_length=10, choices=PriorityLevels.choices, default=PriorityLevels.medium)
    status = models.CharField(max_length=15, choices=TaskStatus.choices, default=TaskStatus.pending)
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-due_date', 'priority']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['group', 'due_date'])

        ]
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        return self.due_date < timezone.now() and self.status != 'completed'

class StudyResource(models.Model):
    class ResourceTypes(models.TextChoices):
        document = 'document', 'Document'
        video = 'video', 'Video'
        link = 'link', 'Link'
        image = 'image', 'Image'
        other = 'other', 'Other'
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='study_resources/')
    resource_type = models.CharField(max_length=10, choices=ResourceTypes.choices, default='document')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_resources')
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='resources')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)
    download_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'study_resources'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
        super().save(*args, **kwargs)
        

class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='study_sessions', null=True, blank=True)
    subject = models.CharField(max_length=200)
    topic = models.CharField(max_length=255, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    duration = models.PositiveIntegerField(blank=True, null=True)  # in minutes

    class Meta:
        ordering = ['-start_time']
