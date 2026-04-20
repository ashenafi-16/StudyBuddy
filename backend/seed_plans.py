import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studybuddy.settings')
django.setup()

from subscriptions.models import SubscriptionPlan

def seed_plans():
    plans = [
        {
            "name": "1 Month Plan",
            "slug": "1-month",
            "description": "Full access to all premium features for 30 days",
            "price": 100.00,
            "currency": "ETB",
            "duration_days": 30,
            "features": ["Unlimited groups", "AI recommendations", "Full Pomodoro statistics", "Priority support"],
            "is_active": True,
            "is_popular": False
        },
        {
            "name": "3 Month Plan",
            "slug": "3-month",
            "description": "Full access to all premium features for 90 days",
            "price": 250.00,
            "currency": "ETB",
            "duration_days": 90,
            "features": ["Unlimited groups", "AI recommendations", "Full Pomodoro statistics", "Priority support", "Exclusive study materials"],
            "is_active": True,
            "is_popular": True
        },
        {
            "name": "6 Month Plan",
            "slug": "6-month",
            "description": "Full access to all premium features for 180 days",
            "price": 450.00,
            "currency": "ETB",
            "duration_days": 180,
            "features": ["Unlimited groups", "AI recommendations", "Full Pomodoro statistics", "Priority support", "Exclusive study materials", "1-on-1 AI tutoring"],
            "is_active": True,
            "is_popular": False
        },
        {
            "name": "1 Year Plan",
            "slug": "1-year",
            "description": "Full access to all premium features for 365 days",
            "price": 800.00,
            "currency": "ETB",
            "duration_days": 365,
            "features": ["Unlimited groups", "AI recommendations", "Full Pomodoro statistics", "Priority support", "Exclusive study materials", "1-on-1 AI tutoring", "Certificates of completion"],
            "is_active": True,
            "is_popular": False
        }
    ]

    # Deactivate or delete old plans that are not in the new list
    new_slugs = [p["slug"] for p in plans]
    SubscriptionPlan.objects.exclude(slug__in=new_slugs).delete()

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
