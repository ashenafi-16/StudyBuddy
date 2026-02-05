# accounts/urls.py
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, PasswordChangeView, PasswordResetRequestView, PasswordResetConfirmView

router = DefaultRouter()
router.register(f'users', UserViewSet)

urlpatterns = [
    path('api/auth/', include(router.urls)),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/password-change/', PasswordChangeView.as_view(), name='password-change'),
    path('api/auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]

