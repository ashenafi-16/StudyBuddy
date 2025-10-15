from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, TopicViewSet, RoomViewSet, MessageViewSet
from .auth_views import RegisterView,UserDetailView

router = DefaultRouter()
router.register(r'user', UserViewSet, basename='user')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [

    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/me/', UserDetailView.as_view(), name='user-me'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('', include(router.urls)),
]