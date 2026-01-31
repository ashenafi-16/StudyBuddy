import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import PomodoroSession
from group.models import StudyGroup, GroupMember

from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from jwt import decode as jwt_decode, InvalidTokenError
from django.conf import settings

User = get_user_model()


class PomodoroConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time Pomodoro timer sync."""

    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'pomodoro_{self.group_id}'
        self.user = self.scope.get('user')

        # If user is not authenticated (AnonymousUser), try JWT from query string
        if not self.user or not self.user.is_authenticated:
            token = self._get_token()
            if token:
                self.user = await self._authenticate(token)

        # Verify user is member of the group
        if not await self.is_group_member():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send current timer state
        state = await self.get_timer_state()
        await self.send(text_data=json.dumps({
            'type': 'timer_state',
            'data': state
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'start':
                await self.handle_start()
            elif action == 'pause':
                await self.handle_pause()
            elif action == 'resume':
                await self.handle_resume()
            elif action == 'reset':
                await self.handle_reset()
            elif action == 'next_phase':  # Added check for explicit next phase
                await self.handle_next_phase()
            elif action == 'sync':
                await self.handle_sync()
            
            # 'tick' action is removed as server no longer ticks

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))

    async def handle_start(self):
        """Start the timer for all group members."""
        await self.start_session()
        
        # Broadcast to all members
        await self.broadcast_update('started', started_by=self.user.username)

    async def handle_pause(self):
        """Pause the timer for all group members."""
        await self.pause_session()
        await self.broadcast_update('paused', paused_by=self.user.username)

    async def handle_resume(self):
        """Resume the timer for all group members."""
        await self.resume_session()
        await self.broadcast_update('resumed', resumed_by=self.user.username)

    async def handle_reset(self):
        """Reset the timer for all group members."""
        await self.reset_session()
        await self.broadcast_update('reset', reset_by=self.user.username)

    async def handle_next_phase(self):
        """Move to next phase."""
        await self.next_phase_session()
        await self.broadcast_update('next_phase')

    async def handle_sync(self):
        """Sync timer state with requesting client."""
        await self.send(text_data=json.dumps({
            'type': 'timer_state',
            'data': await self.get_timer_state()
        }))

    async def timer_update(self, event):
        """Send timer update to WebSocket."""
        # Forward the message to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'timer_update',
            'action': event['action'],
            'data': event['data'], # This contains the full updated state
            **{k: v for k, v in event.items() if k not in ['type', 'action', 'data']}
        }))

    async def broadcast_update(self, action, **kwargs):
        """Helper to broadcast state updates."""
        state = await self.get_timer_state()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer_update',
                'action': action,
                'data': state,
                **kwargs
            }
        )

    # Authentication Helpers
    def _get_token(self):
        if "query_string" not in self.scope:
            return None
        qs = parse_qs(self.scope["query_string"].decode())
        return qs.get("token", [None])[0]

    async def _authenticate(self, token):
        try:
            UntypedToken(token)
            decoded = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
            user_id = decoded.get("user_id")
            if not user_id:
                return None
            return await self._get_user(user_id)
        except (InvalidTokenError, Exception):
            return None

    @database_sync_to_async
    def _get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    # Database operations (Sync to Async)
    @database_sync_to_async
    def is_group_member(self):
        if not self.user or not self.user.is_authenticated:
            return False
        return GroupMember.objects.filter(
            group_id=self.group_id,
            user=self.user,
            is_active=True
        ).exists()

    @database_sync_to_async
    def get_timer_state(self):
        """Get current timer state (Moments Architecture)."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            # Re-use the serializer logic or manual dict creation matching the model
            # For simplicity and perf, we can manually construct it here or import serializer
            # Let's manual to avoid serializer overhead in consumer loop if possible, 
            # but using serializer ensures consistency. 
            # Let's stick to manual extraction similar to what serializer does
            
            from mod_serializers import PomodoroSessionSerializer # Avoid circular import if any
            # Actually, let's just use the fields directly
            
            phase_start_iso = session.phase_start.isoformat() if session.phase_start else None
            paused_at_iso = session.paused_at.isoformat() if session.paused_at else None
            
            # Calculate remaining seconds for display convenience (not source of truth for ticking)
            remaining = 0
            if session.state == PomodoroSession.TimerState.IDLE:
                 remaining = session.work_duration # Default
                 if session.phase == PomodoroSession.PhaseType.SHORT_BREAK: remaining = session.break_duration
                 elif session.phase == PomodoroSession.PhaseType.LONG_BREAK: remaining = session.long_break_duration
            elif session.state == PomodoroSession.TimerState.PAUSED:
                remaining = session.remaining_seconds_at_pause or 0
            elif session.state == PomodoroSession.TimerState.RUNNING and session.phase_start:
                now = timezone.now()
                elapsed = (now - session.phase_start).total_seconds()
                remaining = max(0, int(session.phase_duration - elapsed))
            
            return {
                'id': session.id,
                'group': session.group_id,
                'phase': session.phase,
                'state': session.state,
                'phase_start': phase_start_iso,
                'phase_duration': session.phase_duration,
                'paused_at': paused_at_iso,
                'remaining_seconds_at_pause': session.remaining_seconds_at_pause,
                'remaining_seconds': remaining, # Computed
                'work_duration': session.work_duration,
                'break_duration': session.break_duration,
                'long_break_duration': session.long_break_duration,
                'current_session_number': session.current_session_number,
                'started_by': session.started_by.username if session.started_by else None
            }
            
        except PomodoroSession.DoesNotExist:
            return None # Or default structure

    @database_sync_to_async
    def start_session(self):
        session, _ = PomodoroSession.objects.get_or_create(group_id=self.group_id)
        session.started_by = self.user
        session.start()

    @database_sync_to_async
    def pause_session(self):
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.pause()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def resume_session(self):
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.resume()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def reset_session(self):
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.reset()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def next_phase_session(self):
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.next_phase()
        except PomodoroSession.DoesNotExist:
            pass
