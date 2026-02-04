from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyFileViewSet

router = DefaultRouter()
router.register(r'files', StudyFileViewSet, basename='file')

urlpatterns = [
    path('', include(router.urls)),
]
