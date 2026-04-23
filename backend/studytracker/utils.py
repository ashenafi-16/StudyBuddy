from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import StudyStreak, Achievement, UserAchievement, StudyActivity
from Notifications.models import Notification

def record_activity_and_update_streak(user, duration=1):
    # Called by the server whenever user activity is detected.
   
    today = timezone.now().date()
    
    with transaction.atomic():
        # 1. Update or Create the Daily Activity record
        # select_for_update() prevents double-counting minutes
        activity, _ = StudyActivity.objects.select_for_update().get_or_create(
            user=user, 
            date=today,
            defaults={'duration_minutes': 0}
        )
        activity.duration_minutes += duration
        activity.save()

        # We only proceed if they are EXACTLY at 10 (to avoid re-running logic at 11, 12, etc.)
        # OR if they have > 10 but their streak last_active_date is still yesterday.
        streak, _ = StudyStreak.objects.select_for_update().get_or_create(user=user)
        
        if activity.duration_minutes >= 15 and streak.last_active_date != today:
            _process_streak_increment(user, streak, today)

def _process_streak_increment(user, streak, today):
    """Internal helper to handle the math of incrementing days."""
    yesterday = today - timedelta(days=1)

    if streak.last_active_date == yesterday:
        streak.current_streak += 1
    else:
        # Missed a day or brand new user
        streak.current_streak = 1

    streak.last_active_date = today
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.save()

    # Badge Logic
    _check_badges(user, streak.current_streak)

def _check_badges(user, streak_days):
    earned_ids = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    eligible = Achievement.objects.filter(required_days__lte=streak_days).exclude(id__in=earned_ids)

    new_achievements = [UserAchievement(user=user, achievement=a) for a in eligible]
    new_notifications = [
        Notification(
            user=user,
            notification_type='system',
            title="🔥 Streak Milestone!",
            message=f"You've reached a {streak_days} day streak! '{a.name}' unlocked."
        ) for a in eligible
    ]

    UserAchievement.objects.bulk_create(new_achievements)
    Notification.objects.bulk_create(new_notifications)