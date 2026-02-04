from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PomodoroViewSet

router = DefaultRouter()
router.register(r'pomodoro', PomodoroViewSet, basename='pomodoro')

urlpatterns = [
    path('', include(router.urls)),
]
