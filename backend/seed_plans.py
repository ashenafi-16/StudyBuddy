import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studybuddy.settings')
django.setup()

from subscriptions.models import SubscriptionPlan

def seed_plans():
    plans = [
        {
            "name": "Free Plan",
            "slug": "free",
            "description": "Basic study tools for beginners",
            "price": 0.00,
            "currency": "ETB",
            "duration_days": 3650, # Essentially forever
            "features": ["Access to public groups", "Basic study materials", "Limited Pomodoro timer"],
            "is_active": True,
            "is_popular": False
        },
        {
            "name": "Pro Plan",
            "slug": "pro",
            "description": "Advanced tools for serious students",
            "price": 99.00,
            "currency": "ETB",
            "duration_days": 30,
            "features": ["Unlimited groups", "AI recommendations", "Full Pomodoro statistics", "Priority support"],
            "is_active": True,
            "is_popular": True
        },
        {
            "name": "Premium Plan",
            "slug": "premium",
            "description": "Elite resources for top performers",
            "price": 249.00,
            "currency": "ETB",
            "duration_days": 90,
            "features": ["All Pro features", "Exclusive study materials", "1-on-1 AI tutoring", "Certificates of completion"],
            "is_active": True,
            "is_popular": False
        }
    ]

    for plan_data in plans:
        plan, created = SubscriptionPlan.objects.get_or_create(
            slug=plan_data["slug"],
            defaults=plan_data
        )
        if created:
            print(f"Created plan: {plan.name}")
        else:
            print(f"Plan already exists: {plan.name}")

if __name__ == "__main__":
    seed_plans()
