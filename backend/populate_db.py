import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studybuddy.settings')
django.setup()

from django.contrib.auth import get_user_model
from studytracker.models import StudyActivity, StudyStreak, Achievement, UserAchievement

User = get_user_model()

def populate_data(email="1234@gmail.com"):
    try:
        user = User.objects.get(email=email)
        print(f"Found user: {user.email}")
    except User.DoesNotExist:
        print(f"User with email {email} not found. Creating test user...")
        # Create a user if it doesn't exist (optional, but good for safety)
        # user = User.objects.create_user(email=email, password="password123", first_name="Test", last_name="User")
        print("Please create the user first or provide a valid email.")
        return

    # 1. Create Data for the Last Year (Heatmap)
    print("Generating activity for the last 365 days...")
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=365)
    
    # Clear existing purely for this test? No, let's append/update.
    
    activities_created = 0
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    # Iterate through days needed
    delta = timedelta(days=1)
    d = start_date
    
    while d <= end_date:
        # Randomly decide if they studied today (70% chance)
        if random.random() < 0.7:
            duration = random.randint(5, 120) # Random minutes between 5 and 120
            
            activity, created = StudyActivity.objects.get_or_create(
                user=user, 
                date=d,
                defaults={'duration_minutes': duration}
            )
            if not created:
                activity.duration_minutes = duration
                activity.save()
            
            activities_created += 1
            temp_streak += 1
        else:
            temp_streak = 0
            
        longest_streak = max(longest_streak, temp_streak)
        d += delta

    # Update current streak based on today/yesterday
    # Check if studied today
    today_activity = StudyActivity.objects.filter(user=user, date=end_date).exists()
    yesterday_activity = StudyActivity.objects.filter(user=user, date=end_date - timedelta(days=1)).exists()

    if today_activity:
        # Calculate backwards
        current_streak = 0
        check_date = end_date
        while StudyActivity.objects.filter(user=user, date=check_date).exists():
           current_streak += 1
           check_date -= timedelta(days=1)
    elif yesterday_activity:
         # Calculate backwards from yesterday
        current_streak = 0
        check_date = end_date - timedelta(days=1)
        while StudyActivity.objects.filter(user=user, date=check_date).exists():
           current_streak += 1
           check_date -= timedelta(days=1)
    else:
        current_streak = 0

    print(f"Created/Updated {activities_created} activity records.")
    
    # 2. Update Streak Model
    print(f"Updating Streak Stats: Current={current_streak}, Longest={longest_streak}")
    streak, _ = StudyStreak.objects.get_or_create(user=user)
    streak.current_streak = current_streak
    streak.longest_streak = max(streak.longest_streak, longest_streak)
    if today_activity:
        streak.last_active_date = end_date
    elif yesterday_activity:
         streak.last_active_date = end_date - timedelta(days=1)
    streak.save()
    
    # 3. Create Achievements if missing
    achievements = [
        {"name": "First Step", "required_days": 1, "description": "Studied for 1 day"},
        {"name": "Week Warrior", "required_days": 7, "description": "Studied for 7 days in a row"},
        {"name": "Monthly Master", "required_days": 30, "description": "Studied for 30 days in a row"},
        {"name": "Dedicated Scholar", "required_days": 100, "description": "Studied for 100 days in a row"},
    ]
    
    for ach_data in achievements:
        obj, created = Achievement.objects.get_or_create(
            name=ach_data["name"],
            defaults={
                "required_days": ach_data["required_days"],
                "description": ach_data["description"]
            }
        )
        # Award if eligible
        if streak.longest_streak >= obj.required_days:
            UserAchievement.objects.get_or_create(user=user, achievement=obj)

    print("Done! Data populated successfully.")

if __name__ == "__main__":
    populate_data()
