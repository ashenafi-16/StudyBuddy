import os
import django
from django.utils import timezone
from datetime import timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studybuddy.settings')
django.setup()

from subscriptions.models import SubscriptionPlan, UserSubscription, Payment
from accounts.models import CustomUser

def verify_stacking():
    # Get or create test user
    user, _ = CustomUser.objects.get_or_create(email='stacktest@example.com', defaults={'username': 'stacktester'})
    
    # Delete existing subs for clean test
    UserSubscription.objects.filter(user=user).delete()
    
    # Get a plan
    plan = SubscriptionPlan.objects.get(slug='1-month-pro')
    
    print(f"--- Starting Stacking Verification for {user.email} ---")
    
    # 1. First purchase
    sub1 = UserSubscription.objects.create(user=user, plan=plan, tx_ref='TEST-REF-1')
    sub1.activate()
    print(f"Sub 1: Start {sub1.start_date}, End {sub1.end_date}")
    
    # 2. Second purchase (should stack)
    sub2 = UserSubscription.objects.create(user=user, plan=plan, tx_ref='TEST-REF-2')
    sub2.activate()
    print(f"Sub 2: Start {sub2.start_date}, End {sub2.end_date}")
    
    # Assertions
    if sub2.start_date == sub1.end_date:
        print("✅ SUCCESS: Sub 2 starts exactly when Sub 1 ends.")
    else:
        print(f"❌ FAILURE: Sub 2 starts at {sub2.start_date} but Sub 1 ends at {sub1.end_date}")

    # 3. Third purchase (should stack after Sub 2)
    sub3 = UserSubscription.objects.create(user=user, plan=plan, tx_ref='TEST-REF-3')
    sub3.activate()
    print(f"Sub 3: Start {sub3.start_date}, End {sub3.end_date}")
    
    if sub3.start_date == sub2.end_date:
        print("✅ SUCCESS: Sub 3 starts exactly when Sub 2 ends.")
    else:
        print(f"❌ FAILURE: Sub 3 starts at {sub3.start_date} but Sub 2 ends at {sub2.end_date}")

if __name__ == "__main__":
    verify_stacking()
