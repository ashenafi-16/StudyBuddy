from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudySessionViewSet

router = DefaultRouter()
router.register(r'sessions', StudySessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
]
