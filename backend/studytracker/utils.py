from datetime import timedelta
from django.utils import timezone
from .models import StudyStreak, Achievement, UserAchievement
from Notifications.models import Notification

def update_streak(user):
    today = timezone.now().date()

    streak, created =  StudyStreak.objects.get_or_create(user=user)

    if streak.last_active_date == today:
        return streak
    
    if streak.last_active_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1
    
    streak.last_active_date = today
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)

def check_and_award(user, streak_days):
    achievements = Achievement.objects.all()

    for achievement in achievements:
        user_achievement, created = UserAchievement.objects.get_or_create(
            user=user, 
            achievement=achievement
        )

        if created and streak_days >= achievement.required_days:
            Notification.objects.create(
                user = user, 
                notification_type = Notification.NotificationTypes.system, 
                title = "🎉 New Achievement Unlocked!",
                message=(
                    f"Congratulations! You earned the "
                    f"'{achievement.name}' badge by maintaining "
                    f"a {achievement.required_days}-day study streak. 🔥"
                )
            )

  