from django.db import models
from django.utils import timezone
from django.conf import settings

class StudyActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    duration_minutes = models.PositiveIntegerField()

    class Meta:
        unique_together = ('user', 'date')
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
    
class StudyStreak(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.user.username

class Achievement(models.Model):
    name = models.CharField(max_length=100)
    required_days = models.PositiveIntegerField()

    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')

    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"
