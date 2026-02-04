import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import PomodoroSession
from group.models import StudyGroup, GroupMember


class PomodoroConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time Pomodoro timer sync."""

    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'pomodoro_{self.group_id}'
        self.user = self.scope.get('user')

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
            elif action == 'tick':
                await self.handle_tick()
            elif action == 'sync':
                await self.handle_sync()
            elif action == 'complete':
                await self.handle_complete()

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))

    async def handle_start(self):
        """Start the timer for all group members."""
        session = await self.get_or_create_session()
        await self.update_session(
            state='running',
            started_at=timezone.now()
        )

        # Broadcast to all members
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer_update',
                'action': 'started',
                'data': await self.get_timer_state(),
                'started_by': self.user.username if self.user else 'Unknown'
            }
        )

    async def handle_pause(self):
        """Pause the timer for all group members."""
        await self.update_session(state='paused')

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer_update',
                'action': 'paused',
                'data': await self.get_timer_state(),
                'paused_by': self.user.username if self.user else 'Unknown'
            }
        )

    async def handle_resume(self):
        """Resume the timer for all group members."""
        await self.update_session(state='running')

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer_update',
                'action': 'resumed',
                'data': await self.get_timer_state(),
                'resumed_by': self.user.username if self.user else 'Unknown'
            }
        )

    async def handle_reset(self):
        """Reset the timer for all group members."""
        session = await self.get_or_create_session()
        await self.reset_session()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer_update',
                'action': 'reset',
                'data': await self.get_timer_state(),
                'reset_by': self.user.username if self.user else 'Unknown'
            }
        )

    async def handle_tick(self):
        """Handle timer tick (decrement remaining time)."""
        remaining = await self.decrement_timer()
        
        if remaining <= 0:
            await self.handle_complete()
        else:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'timer_update',
                    'action': 'tick',
                    'data': await self.get_timer_state()
                }
            )

    async def handle_complete(self):
        """Handle timer completion."""
        session = await self.get_or_create_session()
        state = await self.get_session_state()
        
        if state == 'running':
            # Work session completed, start break
            await self.start_break()
            action = 'work_complete'
        else:
            # Break completed, start next work session
            await self.start_work()
            action = 'break_complete'

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'timer_update',
                'action': action,
                'data': await self.get_timer_state()
            }
        )

    async def handle_sync(self):
        """Sync timer state with requesting client."""
        await self.send(text_data=json.dumps({
            'type': 'timer_state',
            'data': await self.get_timer_state()
        }))

    async def timer_update(self, event):
        """Send timer update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'timer_update',
            'action': event['action'],
            'data': event['data'],
            **{k: v for k, v in event.items() if k not in ['type', 'action', 'data']}
        }))

    # Database operations
    @database_sync_to_async
    def is_group_member(self):
        """Check if user is a member of the group."""
        if not self.user or not self.user.is_authenticated:
            return False
        return GroupMember.objects.filter(
            group_id=self.group_id,
            user=self.user,
            is_active=True
        ).exists()

    @database_sync_to_async
    def get_or_create_session(self):
        """Get or create a Pomodoro session for the group."""
        session, created = PomodoroSession.objects.get_or_create(
            group_id=self.group_id,
            defaults={'started_by': self.user}
        )
        return session

    @database_sync_to_async
    def get_timer_state(self):
        """Get current timer state."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            return {
                'remaining_seconds': session.remaining_seconds,
                'formatted_time': session.formatted_time,
                'state': session.state,
                'current_session': session.current_session_number,
                'work_duration': session.work_duration,
                'break_duration': session.break_duration,
                'started_by': session.started_by.username if session.started_by else None
            }
        except PomodoroSession.DoesNotExist:
            return {
                'remaining_seconds': 1500,
                'formatted_time': '25:00',
                'state': 'idle',
                'current_session': 1,
                'work_duration': 1500,
                'break_duration': 300,
                'started_by': None
            }

    @database_sync_to_async
    def get_session_state(self):
        """Get just the session state."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            return session.state
        except PomodoroSession.DoesNotExist:
            return 'idle'

    @database_sync_to_async
    def update_session(self, **kwargs):
        """Update session with given values."""
        PomodoroSession.objects.filter(group_id=self.group_id).update(**kwargs)

    @database_sync_to_async
    def reset_session(self):
        """Reset the session."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.reset()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def decrement_timer(self):
        """Decrement timer by 1 second and return remaining."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            if session.state == 'running' or session.state == 'break':
                session.remaining_seconds = max(0, session.remaining_seconds - 1)
                session.save()
            return session.remaining_seconds
        except PomodoroSession.DoesNotExist:
            return 0

    @database_sync_to_async
    def start_break(self):
        """Start break timer."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.start_break()
        except PomodoroSession.DoesNotExist:
            pass

    @database_sync_to_async
    def start_work(self):
        """Start work timer."""
        try:
            session = PomodoroSession.objects.get(group_id=self.group_id)
            session.current_session_number += 1
            session.start_work()
        except PomodoroSession.DoesNotExist:
            pass
