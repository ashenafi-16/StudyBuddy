from datetime import timedelta
from django.utils import timezone
from .models import StudyStreak, Achievement, UserAchievement
from Notifications.models import Notification
from django.db import transaction

def update_streak(user):
    today = timezone.now().date()
    yesteday = today - timedelta(days=1)

    with transaction.atomic():
        # select_for_update prevents multiple processes from editing the same streak at once
        streak, created = StudyStreak.objects.select_for_update().get_or_create(user=user)
        
        # check if they already studied today
        if streak.last_active_date == today:
            return streak
        
        # check if they studied yesterday
        if streak.last_active_date == yesteday:
            streak.current_streak += 1
        else:
            # if they missed a day, reset the streak
            streak.current_streak = 1
        
        streak.last_active_date = today
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
        streak.save()

        check_and_award(user, streak.current_streak)

    return streak

def check_and_award(user, streak_days):
    awarded_ids = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)

    eligible_achievements = Achievement.objects.filter(
        required_days__lte=streak_days
    ).exclude(id__in=awarded_ids)   

    if not eligible_achievements.exists():
        return
    
    new_user_achievements = []
    new_notifications = []

    for achievement in eligible_achievements:
        new_user_achievements.append(UserAchievement(user=user, achievement=achievement))
        new_notifications.append(Notification(
            user=user, 
            notification_type=Notification.NotificationTypes.system, 
            title="🎉 New Achievement Unlocked!",
            message=f"You've earned the '{achievement.name}' badge! 🔥"
        ))

    # Single DB hits for multiple records
    UserAchievement.objects.bulk_create(new_user_achievements)
    Notification.objects.bulk_create(new_notifications)


