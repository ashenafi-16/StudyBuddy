"""
Pomodoro WebSocket Consumer - Real-time Timer Synchronization

This module handles WebSocket connections for shared Pomodoro timer sessions.
Features:
- Leader-based control (start, pause, resume, reset, skip phases)
- Flexible/Forced sync modes
- JWT authentication via query string
- Group-based session management
"""

import json
import logging
from urllib.parse import parse_qs
from typing import Optional, Dict, Any

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from jwt import decode as jwt_decode, InvalidTokenError

from .models import PomodoroSession, UserPomodoroSession
from group.models import StudyGroup, GroupMember
from Notifications.notification_service import NotificationService

User = get_user_model()
logger = logging.getLogger(__name__)


class PomodoroConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time Pomodoro timer synchronization.
    
    Supports:
    - Group-based timer sessions
    - Leader control with optional member pause
    - Forced/Flexible sync modes
    - JWT authentication
    """
    
    # Cache TTL for session state (seconds)
    CACHE_TTL = 60
    
    # WebSocket message types
    MSG_TIMER_STATE = 'timer_state'
    MSG_TIMER_UPDATE = 'timer_update'
    MSG_TIMER_INVITATION = 'timer_invitation'
    MSG_ERROR = 'error'
    
    # Allowed actions
    ACTIONS = frozenset(['start', 'pause', 'resume', 'reset', 'next_phase', 'sync'])
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'pomodoro_{self.group_id}'
        self.user = await self._get_authenticated_user()
        
        # Reject unauthenticated or non-member users
        if not self.user or not await self._is_group_member():
            logger.warning(f"Connection rejected: user={self.user}, group={self.group_id}")
            await self.close()
            return
        
        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        
        # Send current timer state based on sync mode
        session = await self._get_session()
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            # FORCED: Send shared group timer state
            state = await self._get_timer_state()
        else:
            # FLEXIBLE: Send user's personal timer state
            state = await self._get_user_timer_state()
        
        await self._send_message(self.MSG_TIMER_STATE, data=state)
        
        logger.info(f"User {self.user.username} connected to pomodoro_{self.group_id} (mode={sync_mode})")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if hasattr(self, 'user') and self.user:
            logger.info(f"User {self.user.username} disconnected from pomodoro_{self.group_id}")

    # ─────────────────────────────────────────────────────────────────────────
    # Message Handling
    # ─────────────────────────────────────────────────────────────────────────
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action not in self.ACTIONS:
                await self._send_error(f"Unknown action: {action}")
                return
            
            # Route to appropriate handler
            handler = getattr(self, f'_handle_{action}', None)
            if handler:
                await handler()
            else:
                await self._send_error(f"Handler not found for action: {action}")
                
        except json.JSONDecodeError:
            await self._send_error("Invalid JSON format")
        except Exception as e:
            logger.exception(f"Error handling message: {e}")
            await self._send_error("Internal server error")

    # ─────────────────────────────────────────────────────────────────────────
    # Action Handlers
    # ─────────────────────────────────────────────────────────────────────────
    
    async def _handle_start(self):
        """
        Start the timer.
        - FORCED mode: Start shared group timer (leader only)
        - FLEXIBLE mode: Start user's personal timer, broadcast to all members
        """
        session = await self._get_session()
        if not session:
            await self._send_error("No session found for this group")
            return
        
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            # FORCED: Only leader can control shared timer
            if not await self._can_control(session, 'start'):
                await self._send_error("Only the group leader can start the timer in Forced mode")
                return
            
            await self._start_session()
            await self._broadcast_update('started', started_by=self.user.username)
        else:
            # FLEXIBLE: Start user's personal timer and broadcast to ALL members
            await self._start_user_session()
            
            # Broadcast timer state to all group members (so all see the shared timer)
            await self._broadcast_flexible_timer_update('started', started_by=self.user.username)
            
            # Also send notification that someone started
            await self._broadcast_flexible_notification(
                'member_started',
                username=self.user.username,
                message=f"{self.user.username} started a Pomodoro timer"
            )

    async def _handle_pause(self):
        """
        Pause the timer.
        - FORCED mode: Pause shared timer (leader only, or allow_member_pause)
        - FLEXIBLE mode: Pause user's personal timer, broadcast to all members
        """
        session = await self._get_session()
        if not session:
            await self._send_error("No session found")
            return
        
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            if not await self._can_control(session, 'pause'):
                await self._send_error("You do not have permission to pause in Forced mode")
                return
            
            await self._pause_session()
            await self._broadcast_update('paused', paused_by=self.user.username)
        else:
            # FLEXIBLE: Pause user's own timer and broadcast to ALL members
            await self._pause_user_session()
            await self._broadcast_flexible_timer_update('paused', paused_by=self.user.username)

    async def _handle_resume(self):
        """
        Resume the timer.
        - FORCED mode: Resume shared timer (leader only)
        - FLEXIBLE mode: Resume user's personal timer, broadcast to all members
        """
        session = await self._get_session()
        if not session:
            await self._send_error("No session found")
            return
        
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            if not await self._can_control(session, 'resume'):
                await self._send_error("You do not have permission to resume in Forced mode")
                return
            
            await self._resume_session()
            await self._broadcast_update('resumed', resumed_by=self.user.username)
        else:
            # FLEXIBLE: Resume user's own timer and broadcast to ALL members
            await self._resume_user_session()
            await self._broadcast_flexible_timer_update('resumed', resumed_by=self.user.username)

    async def _handle_reset(self):
        """
        Reset the timer.
        - FORCED mode: Reset shared timer (leader only)
        - FLEXIBLE mode: Reset user's personal timer, broadcast to all members
        """
        session = await self._get_session()
        if not session:
            await self._send_error("No session found")
            return
        
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            if not await self._can_control(session, 'reset'):
                await self._send_error("Only the group leader can reset in Forced mode")
                return
            
            await self._reset_session()
            await self._broadcast_update('reset', reset_by=self.user.username)
        else:
            # FLEXIBLE: Reset user's own timer and broadcast to ALL members
            await self._reset_user_session()
            await self._broadcast_flexible_timer_update('reset', reset_by=self.user.username)

    async def _handle_next_phase(self):
        """
        Advance to the next timer phase.
        - FORCED mode: Leader only
        - FLEXIBLE mode: User controls their own phase, broadcast to all members
        """
        session = await self._get_session()
        if not session:
            await self._send_error("No session found")
            return
        
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            if not await self._can_control(session, 'next_phase'):
                await self._send_error("Only the group leader can skip phases in Forced mode")
                return
            
            await self._next_phase_session()
            await self._broadcast_update('next_phase', advanced_by=self.user.username)
        else:
            # FLEXIBLE: Advance user's own timer and broadcast to ALL members
            await self._next_phase_user_session()
            await self._broadcast_flexible_timer_update('next_phase', advanced_by=self.user.username)

    async def _handle_sync(self):
        """Sync current timer state with requesting client."""
        session = await self._get_session()
        sync_mode = session.sync_mode if session else 'flexible'
        
        if sync_mode == 'forced':
            state = await self._get_timer_state()
        else:
            # FLEXIBLE: Return user's personal timer state
            state = await self._get_user_timer_state()
        
        await self._send_message(self.MSG_TIMER_STATE, data=state)

    # ─────────────────────────────────────────────────────────────────────────
    # Channel Layer Event Handlers
    # ─────────────────────────────────────────────────────────────────────────
    
    async def timer_update(self, event):
        """Handle timer_update event from channel layer."""
        await self.send(text_data=json.dumps({
            'type': self.MSG_TIMER_UPDATE,
            'action': event['action'],
            'data': event['data'],
            'sync_mode': event.get('sync_mode', 'forced'),
            **{k: v for k, v in event.items() if k not in ['type', 'action', 'data', 'sync_mode']}
        }))

    async def timer_invitation(self, event):
        """Handle timer_invitation event from channel layer."""
        await self.send(text_data=json.dumps({
            'type': self.MSG_TIMER_INVITATION,
            'action': event['action'],
            'data': event['data'],
            'sync_mode': event.get('sync_mode', 'flexible'),
            **{k: v for k, v in event.items() if k not in ['type', 'action', 'data', 'sync_mode']}
        }))

    # ─────────────────────────────────────────────────────────────────────────
    # Helper Methods
    # ─────────────────────────────────────────────────────────────────────────
    
    async def _send_message(self, msg_type: str, **kwargs):
        """Send a message to the WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': msg_type,
            **kwargs
        }))

    async def _send_error(self, message: str):
        """Send an error message to the client."""
        await self._send_message(self.MSG_ERROR, message=message)

    async def _broadcast_update(self, action: str, **kwargs):
        """Broadcast state update to all group members."""
        session = await self._get_session()
        state = await self._get_timer_state()
        sync_mode = session.sync_mode if session else 'forced'
        
        # Determine message type based on sync mode
        msg_type = self.MSG_TIMER_UPDATE
        if sync_mode == 'flexible' and action in ['started', 'resumed']:
            msg_type = self.MSG_TIMER_INVITATION
        
        # 1. Send WebSocket update to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': msg_type.replace('_', '.') if '.' not in msg_type else msg_type,
                'action': action,
                'data': state,
                'sync_mode': sync_mode,
                **kwargs
            }
        )
        
        # 2. Create persistent notifications for lifecycle events
        notification_type = None
        
        if action == 'started':
            if session.phase == 'work':
                notification_type = 'pomodoro_start'
            else:
                notification_type = 'break_start'
        
        elif action == 'next_phase':
            if session.phase in ['short_break', 'long_break']:
                notification_type = 'focus_end'
            elif session.phase == 'work':
                notification_type = 'break_end'

        if notification_type:
            await self._create_lifecycle_notifications(session, notification_type, **kwargs)
            
            # Check for cycle complete (if we just finished a long break, or if long break started?)
            # 'cycle_complete' typically means we finished 4 pomodoros. 
            # Usually happens when we enter long break.
            if notification_type == 'focus_end' and session.phase == 'long_break':
                 await self._create_lifecycle_notifications(session, 'cycle_complete', **kwargs)
        
        # Invalidate cache after update
        self._invalidate_cache()

    async def _create_lifecycle_notifications(self, session, notification_type, **kwargs):
        """
        Create persistent notifications for group members.
        
        Hybrid system rules:
        - Leader (group creator): Gets ALL notifications
        - Non-leader members: ONLY get START notifications (pomodoro_start, break_start)
          Since pause, complete, restart affects the shared timer, only leader needs those.
        """
        # Notification types that non-leaders should receive (only start events)
        MEMBER_NOTIFICATIONS = {'pomodoro_start', 'break_start'}
        
        # Get group leader ID
        leader_id = await database_sync_to_async(
            lambda: session.group.creator_id
        )()
        
        # Get all active group members
        members = await database_sync_to_async(list)(
            GroupMember.objects.filter(group_id=self.group_id, is_active=True)
            .select_related('user')
        )
        
        for member in members:
            user = member.user
            is_leader = (user.id == leader_id)
            
            # Non-leaders only get START notifications
            if not is_leader and notification_type not in MEMBER_NOTIFICATIONS:
                continue
            
            await database_sync_to_async(NotificationService.notify)(
                user=user,
                notification_type=notification_type, 
                related_group=session.group,
                extra_data={
                    'duration': session.work_duration if notification_type == 'pomodoro_start' else 0,
                    'cycles': session.completed_pomodoros
                }
            )

    def _get_cache_key(self) -> str:
        """Get cache key for the current group's session state."""
        return f"pomodoro_state_{self.group_id}"

    def _invalidate_cache(self):
        """Invalidate cached session state."""
        cache.delete(self._get_cache_key())

    # ─────────────────────────────────────────────────────────────────────────
    # Authentication
    # ─────────────────────────────────────────────────────────────────────────
    
    async def _get_authenticated_user(self) -> Optional[User]:
        """Get authenticated user from scope or JWT token."""
        # Try scope first (for authenticated connections)
        user = self.scope.get('user')
        if user and user.is_authenticated:
            return user
        
        # Fall back to JWT from query string
        token = self._extract_token()
        if token:
            return await self._authenticate_jwt(token)
        
        return None

    def _extract_token(self) -> Optional[str]:
        """Extract JWT token from query string."""
        query_string = self.scope.get("query_string", b"")
        if not query_string:
            return None
        qs = parse_qs(query_string.decode())
        return qs.get("token", [None])[0]

    async def _authenticate_jwt(self, token: str) -> Optional[User]:
        """Authenticate user via JWT token."""
        try:
            UntypedToken(token)
            decoded = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
            user_id = decoded.get("user_id")
            if user_id:
                return await self._get_user_by_id(user_id)
        except (InvalidTokenError, Exception) as e:
            logger.warning(f"JWT authentication failed: {e}")
        return None

    @database_sync_to_async
    def _get_user_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user by ID from database."""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    # ─────────────────────────────────────────────────────────────────────────
    # Database Operations
    # ─────────────────────────────────────────────────────────────────────────
    
    @database_sync_to_async
    def _is_group_member(self) -> bool:
        """Check if current user is an active member of the group."""
        if not self.user or not self.user.is_authenticated:
            return False
        return GroupMember.objects.filter(
            group_id=self.group_id,
            user=self.user,
            is_active=True
        ).exists()

    @database_sync_to_async
    def _get_session(self) -> Optional[PomodoroSession]:
        """Get the Pomodoro session for the current group."""
        try:
            return PomodoroSession.objects.select_related('group', 'started_by').get(
                group_id=self.group_id
            )
        except PomodoroSession.DoesNotExist:
            return None

    @database_sync_to_async
    def _can_control(self, session: Optional[PomodoroSession], action: str) -> bool:
        """Check if current user can perform the given action."""
        if not session:
            return False
        return session.can_control(self.user, action)

    @database_sync_to_async
    def _has_active_session_elsewhere(self) -> bool:
        """Check if user has an active session in another group."""
        if not self.user or not self.user.is_authenticated:
            return False
        
        user_group_ids = GroupMember.objects.filter(
            user=self.user,
            is_active=True
        ).exclude(
            group_id=self.group_id
        ).values_list('group_id', flat=True)
        
        return PomodoroSession.objects.filter(
            group_id__in=user_group_ids,
            state=PomodoroSession.TimerState.RUNNING
        ).exists()

    @database_sync_to_async
    def _get_timer_state(self) -> Optional[Dict[str, Any]]:
        """Get current timer state with computed remaining time."""
        try:
            session = PomodoroSession.objects.select_related(
                'group', 'started_by'
            ).get(group_id=self.group_id)
        except PomodoroSession.DoesNotExist:
            return None
        
        # Calculate remaining seconds based on current state
        remaining = self._calculate_remaining_seconds(session)
        
        return {
            'id': session.id,
            'group': session.group_id,
            'phase': session.phase,
            'state': session.state,
            'phase_start': session.phase_start.isoformat() if session.phase_start else None,
            'phase_duration': session.phase_duration,
            'paused_at': session.paused_at.isoformat() if session.paused_at else None,
            'remaining_seconds_at_pause': session.remaining_seconds_at_pause,
            'remaining_seconds': remaining,
            'work_duration': session.work_duration,
            'break_duration': session.break_duration,
            'long_break_duration': session.long_break_duration,
            'current_session_number': session.current_session_number,
            'started_by': session.started_by.username if session.started_by else None,
            'sync_mode': session.sync_mode,
            'allow_member_pause': session.allow_member_pause,
            'is_leader': self._check_is_leader(session),
            'is_creator': self._check_is_creator(session),
            'current_user_name': self.user.username if self.user else None,
        }

    def _calculate_remaining_seconds(self, session: PomodoroSession) -> int:
        """Calculate remaining seconds based on session state."""
        if session.state == PomodoroSession.TimerState.IDLE:
            # Return duration based on current phase
            phase_durations = {
                PomodoroSession.PhaseType.WORK: session.work_duration,
                PomodoroSession.PhaseType.SHORT_BREAK: session.break_duration,
                PomodoroSession.PhaseType.LONG_BREAK: session.long_break_duration,
            }
            return phase_durations.get(session.phase, session.work_duration)
        
        if session.state == PomodoroSession.TimerState.PAUSED:
            return session.remaining_seconds_at_pause or 0
        
        if session.state == PomodoroSession.TimerState.RUNNING and session.phase_start:
            elapsed = (timezone.now() - session.phase_start).total_seconds()
            return max(0, int(session.phase_duration - elapsed))
        
        return 0

    def _check_is_leader(self, session: PomodoroSession) -> bool:
        """Check if current user is the group leader."""
        return session.group.created_by_id == self.user.id if self.user else False

    def _check_is_creator(self, session: PomodoroSession) -> bool:
        """Check if current user is the group's original creator (for sync mode control)."""
        return session.group.created_by_id == self.user.id if self.user else False

    # ─────────────────────────────────────────────────────────────────────────
    # Session State Mutations
    # ─────────────────────────────────────────────────────────────────────────
    
    @database_sync_to_async
    def _start_session(self):
        """Start or create a Pomodoro session."""
        session, _ = PomodoroSession.objects.get_or_create(group_id=self.group_id)
        session.started_by = self.user
        session.start()

    @database_sync_to_async
    def _pause_session(self):
        """Pause the current session."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.pause()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _resume_session(self):
        """Resume the paused session."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.resume()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _reset_session(self):
        """Reset the session to initial state."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.reset()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _next_phase_session(self):
        """Advance to the next timer phase."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.next_phase()
        except PomodoroSession.DoesNotExist:
            pass

    # ─────────────────────────────────────────────────────────────────────────
    # User Session Mutations (for FLEXIBLE mode)
    # ─────────────────────────────────────────────────────────────────────────
    
    @database_sync_to_async
    def _get_or_create_user_session(self) -> UserPomodoroSession:
        """Get or create user's personal Pomodoro session."""
        user_session, created = UserPomodoroSession.objects.get_or_create(
            user=self.user,
            group_id=self.group_id
        )
        return user_session

    @database_sync_to_async
    def _start_user_session(self):
        """Start user's personal timer."""
        user_session, created = UserPomodoroSession.objects.get_or_create(
            user=self.user,
            group_id=self.group_id
        )
        user_session.start()

    @database_sync_to_async
    def _pause_user_session(self):
        """Pause user's personal timer."""
        try:
            user_session = UserPomodoroSession.objects.get(
                user=self.user,
                group_id=self.group_id
            )
            user_session.pause()
        except UserPomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _resume_user_session(self):
        """Resume user's personal timer."""
        try:
            user_session = UserPomodoroSession.objects.get(
                user=self.user,
                group_id=self.group_id
            )
            user_session.resume()
        except UserPomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _reset_user_session(self):
        """Reset user's personal timer."""
        try:
            user_session = UserPomodoroSession.objects.get(
                user=self.user,
                group_id=self.group_id
            )
            user_session.reset()
        except UserPomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _next_phase_user_session(self):
        """Advance user's timer to next phase."""
        try:
            user_session = UserPomodoroSession.objects.get(
                user=self.user,
                group_id=self.group_id
            )
            user_session.next_phase()
        except UserPomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _get_user_timer_state(self) -> Optional[Dict[str, Any]]:
        """Get user's personal timer state for FLEXIBLE mode."""
        try:
            user_session = UserPomodoroSession.objects.select_related(
                'group', 'user'
            ).get(user=self.user, group_id=self.group_id)
        except UserPomodoroSession.DoesNotExist:
            # Return default idle state for user with GROUP session ID
            # This is critical: we need the group session ID for API calls to work
            try:
                group_session = PomodoroSession.objects.get(group_id=self.group_id)
                return {
                    'id': group_session.id,  # Use group session ID so API calls work
                    'group': self.group_id,
                    'phase': 'work',
                    'state': 'idle',
                    'phase_start': None,
                    'phase_duration': group_session.work_duration,
                    'paused_at': None,
                    'remaining_seconds_at_pause': None,
                    'remaining_seconds': group_session.work_duration,
                    'work_duration': group_session.work_duration,
                    'break_duration': group_session.break_duration,
                    'long_break_duration': group_session.long_break_duration,
                    'current_session_number': 1,
                    'sync_mode': group_session.sync_mode,
                    'is_leader': self._check_is_leader_sync(group_session),
                    'is_creator': self._check_is_creator_sync(group_session),
                    'current_user_name': self.user.username if self.user else None,
                    'is_personal_timer': True,
                }
            except PomodoroSession.DoesNotExist:
                return None
        
        settings = user_session.get_settings()
        remaining = self._calculate_user_remaining_seconds(user_session, settings)
        
        # Get group session for sync_mode and is_creator check
        try:
            group_session = PomodoroSession.objects.get(group_id=self.group_id)
            sync_mode = group_session.sync_mode
            is_creator = self._check_is_creator_sync(group_session)
        except PomodoroSession.DoesNotExist:
            sync_mode = 'flexible'
            is_creator = False
        
        return {
            'id': user_session.id,
            'group': user_session.group_id,
            'phase': user_session.phase,
            'state': user_session.state,
            'phase_start': user_session.phase_start.isoformat() if user_session.phase_start else None,
            'phase_duration': user_session.phase_duration,
            'paused_at': user_session.paused_at.isoformat() if user_session.paused_at else None,
            'remaining_seconds_at_pause': user_session.remaining_seconds_at_pause,
            'remaining_seconds': remaining,
            'work_duration': settings['work_duration'],
            'break_duration': settings['break_duration'],
            'long_break_duration': settings['long_break_duration'],
            'current_session_number': user_session.current_session_number,
            'sync_mode': sync_mode,
            'is_leader': True,  # In FLEXIBLE mode, user controls their own timer
            'is_creator': is_creator,
            'current_user_name': self.user.username if self.user else None,
            'is_personal_timer': True,
        }

    def _calculate_user_remaining_seconds(self, user_session: UserPomodoroSession, settings: dict) -> int:
        """Calculate remaining seconds for user's personal timer."""
        if user_session.state == PomodoroSession.TimerState.IDLE:
            phase_durations = {
                PomodoroSession.PhaseType.WORK: settings['work_duration'],
                PomodoroSession.PhaseType.SHORT_BREAK: settings['break_duration'],
                PomodoroSession.PhaseType.LONG_BREAK: settings['long_break_duration'],
            }
            return phase_durations.get(user_session.phase, settings['work_duration'])
        
        if user_session.state == PomodoroSession.TimerState.PAUSED:
            return user_session.remaining_seconds_at_pause or 0
        
        if user_session.state == PomodoroSession.TimerState.RUNNING and user_session.phase_start:
            elapsed = (timezone.now() - user_session.phase_start).total_seconds()
            return max(0, int(user_session.phase_duration - elapsed))
        
        return 0

    def _check_is_creator_sync(self, session: PomodoroSession) -> bool:
        """Synchronous version of is_creator check."""
        return session.group.created_by_id == self.user.id if self.user else False

    def _check_is_leader_sync(self, session: PomodoroSession) -> bool:
        """Synchronous version of is_leader check (same as creator for group sessions)."""
        return session.group.created_by_id == self.user.id if self.user else False

    async def _broadcast_flexible_timer_update(self, action: str, **kwargs):
        """
        Broadcast the triggering user's timer state to ALL group members in FLEXIBLE mode.
        This ensures all members see the shared timer countdown, not just the triggering user.
        """
        # Get the triggering user's timer state
        user_state = await self._get_user_timer_state()
        
        if not user_state:
            return
        
        # Broadcast to all group members via channel layer
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer.update',
                'action': action,
                'data': user_state,
                'sync_mode': 'flexible',
                **kwargs
            }
        )

    async def _broadcast_flexible_notification(self, action: str, **kwargs):
        """
        Broadcast notification to all group members in FLEXIBLE mode.
        This notifies others that someone started a timer (inspiration to join).
        """
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'flexible.notification',
                'action': action,
                'data': {
                    'username': kwargs.get('username'),
                    'message': kwargs.get('message'),
                    'group_id': self.group_id,
                },
                'sync_mode': 'flexible',
            }
        )

    async def flexible_notification(self, event):
        """Handle flexible.notification event from channel layer."""
        await self.send(text_data=json.dumps({
            'type': 'flexible_notification',
            'action': event['action'],
            'data': event['data'],
            'sync_mode': event.get('sync_mode', 'flexible'),
        }))

