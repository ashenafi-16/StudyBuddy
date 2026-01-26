# accounts/urls.py
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView

router = DefaultRouter()
router.register(f'users', UserViewSet)

urlpatterns = [
    path('api/auth/', include(router.urls)),
    path('api/auth/login/', LoginView.as_view(), name='login'),
]

