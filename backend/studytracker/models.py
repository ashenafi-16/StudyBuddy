from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.conf import settings

class StudyActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="study_activities")
    date = models.DateField(default=timezone.now, db_index=True)
    duration_minutes = models.PositiveIntegerField(help_text="Time spent studying in minutes")

    class Meta:
        verbose_name_plural = "Study Activities"
        unique_together = ('user', 'date')
        ordering = ['-date']
    
    
    def __str__(self):
        return f"{self.user.username} studied {self.duration_minutes}m on {self.date}"
    
class StudyStreak(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="streak_stats")
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    @property
    def is_active(self):
        #  Checks if the streak is still valid (active today or yesterday)
        if not self.last_active_date:
            return False
        today = timezone.now().date()
        return self.last_active_date >= today - timedelta(days=1)
    
    @property
    def effective_streak(self):
        # Returns 0 if the user missed their window, otherwise returns current streak
        return self.current_streak if self.is_active else 0
    

    def __str__(self):
        return f"{self.user}'s Streak: {self.current_streak}"

class Achievement(models.Model):
    name = models.CharField(max_length=100)
    required_days = models.PositiveIntegerField(help_text="Days needed to unlock this badge")
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=100, default="default_badge")

    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="earned_achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('user', 'achievement')
        ordering = ['-awarded_at']

    def __str__(self):
        return f"{self.user.username} earned {self.achievement.name}"
