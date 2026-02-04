from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, SubscriptionViewSet, ChapaWebhookView

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plans')
router.register(r'', SubscriptionViewSet, basename='subscriptions')

urlpatterns = [
    path('webhook/', ChapaWebhookView.as_view(), name='chapa-webhook'),
    path('', include(router.urls)),
]
