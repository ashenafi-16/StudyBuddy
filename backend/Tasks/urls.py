from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, StudyResourceViewSet

router = DefaultRouter()

router.register(r'tasks', TaskViewSet)
router.register(r'study-resource', StudyResourceViewSet)


urlpatterns = [
    path('', include(router.urls)),
]