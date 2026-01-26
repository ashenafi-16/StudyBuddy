# messages/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, ConversationViewSet, chat_room

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('chat/<int:conversation_id>/', chat_room, name='chat_room'),
    path('', include(router.urls)),
]