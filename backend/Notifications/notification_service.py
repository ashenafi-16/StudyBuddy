"""
Notification Service for Pomodoro Timer

This service handles:
- Creating and storing notifications in the database
- Pushing notifications via WebSocket to connected users
- Fallback storage for offline users
"""

import logging
from typing import Optional, Dict, Any
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.core.cache import cache

from .models import Notification
from group.models import StudyGroup

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for creating, storing, and delivering notifications.
    Supports both real-time WebSocket delivery and database persistence.
    """
    
    # Notification messages for Pomodoro events
    POMODORO_MESSAGES = {
        'pomodoro_start': {
            'title': '🎯 Focus Session Started',
            'message': 'Your Pomodoro focus session has begun. Stay focused for {duration} minutes!'
        },
        'focus_end': {
            'title': '✅ Focus Session Complete',
            'message': 'Great work! You completed a {duration} minute focus session. Time for a break!'
        },
        'break_start': {
            'title': '☕ Break Time',
            'message': 'Take a {duration} minute break. Stretch, hydrate, and relax!'
        },
        'break_end': {
            'title': '⏰ Break Over',
            'message': 'Break time is up! Ready to start your next focus session?'
        },
        'cycle_complete': {
            'title': '🏆 Pomodoro Cycle Complete!',
            'message': 'Amazing! You completed a full cycle of {cycles} pomodoros. Take a longer break!'
        }
    }

    @classmethod
    def create_notification(
        cls,
        user: User,
        notification_type: str,
        title: Optional[str] = None,
        message: Optional[str] = None,
        related_group: Optional[StudyGroup] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a notification and store it in the database.
        
        Args:
            user: The user to notify
            notification_type: Type of notification (e.g., 'pomodoro_start')
            title: Custom title (uses default if not provided)
            message: Custom message (uses default if not provided)
            related_group: Optional related study group
            extra_data: Extra data for message formatting
        
        Returns:
            The created Notification object
        """
        extra_data = extra_data or {}
        
        # Get default messages if not provided
        defaults = cls.POMODORO_MESSAGES.get(notification_type, {})
        title = title or defaults.get('title', 'Notification')
        message = message or defaults.get('message', '')
        
        # Format message with extra data
        try:
            message = message.format(**extra_data)
        except (KeyError, IndexError):
            pass  # Keep original message if formatting fails
        
        # Create and save notification
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_group=related_group,
            is_read=False
        )
        
        logger.info(f"Created notification: {notification_type} for user {user.username}")
        return notification

    @classmethod
    def send_realtime_notification(
        cls,
        user: User,
        notification: Notification
    ) -> bool:
        """
        Send a notification via WebSocket to the user.
        
        Args:
            user: The user to notify
            notification: The notification to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not available")
            return False
        
        # User's personal notification channel
        user_channel = f"notifications_{user.id}"
        
        try:
            async_to_sync(channel_layer.group_send)(
                user_channel,
                {
                    'type': 'notification.push',
                    'notification': {
                        'id': notification.id,
                        'type': notification.notification_type,
                        'title': notification.title,
                        'message': notification.message,
                        'is_read': notification.is_read,
                        'created_at': notification.created_at.isoformat(),
                        'group_id': notification.related_group_id,
                    }
                }
            )
            logger.info(f"Sent realtime notification to user {user.username}")
            return True
        except Exception as e:
            logger.error(f"Failed to send realtime notification: {e}")
            return False

    @classmethod
    def notify(
        cls,
        user: User,
        notification_type: str,
        title: Optional[str] = None,
        message: Optional[str] = None,
        related_group: Optional[StudyGroup] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a notification and attempt to deliver it in real-time.
        Falls back to database-only storage if WebSocket delivery fails.
        
        This is the main method to use for sending notifications.
        """
        # Create and persist the notification
        notification = cls.create_notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_group=related_group,
            extra_data=extra_data
        )
        
        # Attempt real-time delivery
        cls.send_realtime_notification(user, notification)
        
        # Update unread count in cache
        cache_key = f"unread_notifications_{user.id}"
        try:
            current_count = cache.get(cache_key, 0)
            cache.set(cache_key, current_count + 1, timeout=3600)
        except Exception:
            pass  # Cache update is non-critical
        
        return notification

    @classmethod
    def get_unread_count(cls, user: User) -> int:
        """Get the count of unread notifications for a user."""
        cache_key = f"unread_notifications_{user.id}"
        count = cache.get(cache_key)
        
        if count is None:
            count = Notification.objects.filter(user=user, is_read=False).count()
            cache.set(cache_key, count, timeout=3600)
        
        return count

    @classmethod
    def mark_as_read(cls, notification_id: int, user: User) -> bool:
        """Mark a notification as read."""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            if not notification.is_read:
                notification.is_read = True
                notification.save(update_fields=['is_read'])
                
                # Update cache
                cache_key = f"unread_notifications_{user.id}"
                current_count = cache.get(cache_key, 1)
                cache.set(cache_key, max(0, current_count - 1), timeout=3600)
            
            return True
        except Notification.DoesNotExist:
            return False

    @classmethod
    def mark_all_as_read(cls, user: User) -> int:
        """Mark all notifications as read for a user."""
        count = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        
        # Clear cache
        cache_key = f"unread_notifications_{user.id}"
        cache.set(cache_key, 0, timeout=3600)
        
        return count
