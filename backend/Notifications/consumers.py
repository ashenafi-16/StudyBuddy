"""
Notification WebSocket Consumer

Handles real-time notification delivery to connected users.
Each user has a personal notification channel for receiving updates.
"""

import json
import logging
from urllib.parse import parse_qs
from typing import Optional

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework_simplejwt.tokens import UntypedToken
from jwt import decode as jwt_decode, InvalidTokenError
from django.conf import settings

from .models import Notification

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notification delivery.
    
    Features:
    - JWT authentication
    - Personal notification channel per user
    - Delivers unread notifications on connect
    - Handles mark as read actions
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = await self._get_authenticated_user()
        
        if not self.user:
            logger.warning("Notification connection rejected: unauthenticated")
            await self.close()
            return
        
        # Personal notification channel for this user
        self.notification_group = f"notifications_{self.user.id}"
        
        # Join the user's notification group
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )
        await self.accept()
        
        # Send unread notifications on connect
        unread = await self._get_unread_notifications()
        await self.send(text_data=json.dumps({
            'type': 'initial_load',
            'notifications': unread,
            'unread_count': len(unread)
        }))
        
        logger.info(f"User {self.user.username} connected to notifications")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )
        if hasattr(self, 'user') and self.user:
            logger.info(f"User {self.user.username} disconnected from notifications")

    async def receive(self, text_data):
        """Handle incoming messages from client."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'mark_read':
                notification_id = data.get('notification_id')
                if notification_id:
                    success = await self._mark_as_read(notification_id)
                    await self.send(text_data=json.dumps({
                        'type': 'mark_read_response',
                        'notification_id': notification_id,
                        'success': success
                    }))
            
            elif action == 'mark_all_read':
                count = await self._mark_all_as_read()
                await self.send(text_data=json.dumps({
                    'type': 'mark_all_read_response',
                    'count': count
                }))
            
            elif action == 'get_unread_count':
                count = await self._get_unread_count()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': count
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))

    async def notification_push(self, event):
        """Handle notification.push event from channel layer."""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))

    # ─────────────────────────────────────────────────────────────────────────
    # Authentication
    # ─────────────────────────────────────────────────────────────────────────
    
    async def _get_authenticated_user(self) -> Optional[User]:
        """Get authenticated user from scope or JWT token."""
        user = self.scope.get('user')
        if user and user.is_authenticated:
            return user
        
        # Extract token from query string
        token = self._extract_token()
        if token:
            return await self._authenticate_jwt(token)
        
        return None

    def _extract_token(self) -> Optional[str]:
        """Extract JWT token from query string."""
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        tokens = params.get('token', [])
        return tokens[0] if tokens else None

    @database_sync_to_async
    def _authenticate_jwt(self, token: str) -> Optional[User]:
        """Authenticate user from JWT token."""
        try:
            UntypedToken(token)
            decoded = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"]
            )
            user_id = decoded.get('user_id')
            return User.objects.get(id=user_id)
        except (InvalidTokenError, User.DoesNotExist) as e:
            logger.warning(f"JWT authentication failed: {e}")
            return None

    # ─────────────────────────────────────────────────────────────────────────
    # Database Operations
    # ─────────────────────────────────────────────────────────────────────────
    
    @database_sync_to_async
    def _get_unread_notifications(self) -> list:
        """Get unread notifications for the user."""
        notifications = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).order_by('-created_at')[:20]
        
        return [
            {
                'id': n.id,
                'type': n.notification_type,
                'title': n.title,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
                'group_id': n.related_group_id,
            }
            for n in notifications
        ]

    @database_sync_to_async
    def _mark_as_read(self, notification_id: int) -> bool:
        """Mark a notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.is_read = True
            notification.save(update_fields=['is_read'])
            
            # Update cache
            cache_key = f"unread_notifications_{self.user.id}"
            current = cache.get(cache_key, 1)
            cache.set(cache_key, max(0, current - 1), timeout=3600)
            
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def _mark_all_as_read(self) -> int:
        """Mark all notifications as read."""
        count = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).update(is_read=True)
        
        cache_key = f"unread_notifications_{self.user.id}"
        cache.set(cache_key, 0, timeout=3600)
        
        return count

    @database_sync_to_async
    def _get_unread_count(self) -> int:
        """Get unread notification count."""
        cache_key = f"unread_notifications_{self.user.id}"
        count = cache.get(cache_key)
        
        if count is None:
            count = Notification.objects.filter(
                user=self.user,
                is_read=False
            ).count()
            cache.set(cache_key, count, timeout=3600)
        
        return count
