from rest_framework import permissions
from .models import UserSubscription

class IsPremiumUser(permissions.BasePermission):
    """
    Allows access only to premium users with active subscriptions.
    """
    message = "Premium subscription required to access this feature."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has an active subscription
        return UserSubscription.objects.filter(
            user=request.user,
            status='active'
        ).exists()
