import os
import django
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studybuddy.settings')
django.setup()

from studytracker.models import StudyActivity, StudyStreak, Achievement, UserAchievement

User = get_user_model()

def seed_data():
    print("Finding target user...")
    # Target the user from the screenshot/db
    try:
        user = User.objects.get(email="1234@gmail.com")
        print(f"Found user: {user.username} (1234@gmail.com)")
    except User.DoesNotExist:
        print("User 1234@gmail.com not found. Creating fallback...")
        user, created = User.objects.get_or_create(username="visual_test_user", email="visual@test.com")
        if created:
            user.set_password("password123")
            user.save()
    
    print(f"Seeding data for: {user.username}")
    
    print("Generating study activity for the last year...")
    # Clear existing data for this user
    StudyActivity.objects.filter(user=user).delete()
    StudyStreak.objects.filter(user=user).delete()
    UserAchievement.objects.filter(user=user).delete()
    
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=365)
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    # Iterate through days
    date = start_date
    while date <= end_date:
        # 60% chance to study on any given day
        if random.random() > 0.4:
            duration = random.randint(15, 180) # 15 to 180 minutes
            StudyActivity.objects.create(
                user=user,
                date=date,
                duration_minutes=duration
            )
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 0
            
        date += timedelta(days=1)
        
    # Set final streak
    if temp_streak > 0:
        current_streak = temp_streak
        longest_streak = max(longest_streak, current_streak)
        
    print(f"Calculated Streak: Current {current_streak}, Longest {longest_streak}")
    
    StudyStreak.objects.create(
        user=user,
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_active_date=end_date if current_streak > 0 else end_date - timedelta(days=1) # Approximate
    )
    
    print("Creating Achievements...")
    # Create some default achievements if they don't exist
    defaults = [
        ("3 Day Streak", 3),
        ("7 Day Streak", 7),
        ("Month Master", 30),
        ("100 Day Warrior", 100)
    ]
    
    for name, days in defaults:
        ach, _ = Achievement.objects.get_or_create(name=name, defaults={'required_days': days})
        if longest_streak >= days:
            UserAchievement.objects.get_or_create(user=user, achievement=ach)
            print(f"Awarded: {name}")
            
    print("Seeding Complete!")

if __name__ == '__main__':
    seed_data()
