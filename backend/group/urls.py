from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import StudyGroupViewSet,GroupMemberViewSet

router = DefaultRouter()
router.register(r'groups', StudyGroupViewSet)
router.register(r'group-members', GroupMemberViewSet)
urlpatterns = router.urls
