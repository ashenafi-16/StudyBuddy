from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import PomodoroSession
from .serializers import PomodoroSessionSerializer, PomodoroSettingsSerializer
from group.models import GroupMember
from subscriptions.permissions import IsPremiumUser


class PomodoroViewSet(viewsets.ModelViewSet):
    """ViewSet for Pomodoro session management (REST API complement to WebSocket)."""
    serializer_class = PomodoroSessionSerializer

    def get_permissions(self):
        if self.action == 'timer_settings':
            permission_classes = [permissions.IsAuthenticated, IsPremiumUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def _broadcast_update(self, session, action, **kwargs):
        """Broadcast state update to all group members via WebSocket."""
        channel_layer = get_channel_layer()
        room_group_name = f'pomodoro_{session.group_id}'
        
        # Prepare data exactly like the consumer's get_timer_state
        serializer = PomodoroSessionSerializer(session, context={'request': self.request})
        state = serializer.data
        
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'timer_update',
                'action': action,
                'data': state,
                'sync_mode': session.sync_mode,
                **kwargs
            }
        )

    def _has_active_session_elsewhere(self, user, current_group_id):
        """Check if user is part of a running Pomodoro session in another group."""
        # Find all groups user belongs to
        user_groups = GroupMember.objects.filter(
            user=user, 
            is_active=True
        ).exclude(group_id=current_group_id).values_list('group_id', flat=True)
        
        # Check if any of those groups have a running session
        return PomodoroSession.objects.filter(
            group_id__in=user_groups,
            state=PomodoroSession.TimerState.RUNNING
        ).exists()

    def get_queryset(self):
        """Return sessions for groups where user is a member."""
        user = self.request.user
        user_groups = GroupMember.objects.filter(
            user=user, 
            is_active=True
        ).values_list('group_id', flat=True)
        
        return PomodoroSession.objects.filter(
            group_id__in=user_groups
        ).select_related('group', 'started_by')

    @action(detail=False, methods=['get'])
    def by_group(self, request):
        """Get or create session for a specific group."""
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response(
                {'error': 'group_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from group.models import StudyGroup
            group = StudyGroup.objects.get(id=group_id)
        except StudyGroup.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

        # Verify membership
        is_member = GroupMember.objects.filter(
            user=request.user,
            group_id=group_id,
            is_active=True
        ).exists()

        if not is_member and not group.is_public:
            return Response(
                {'error': 'You are not a member of this private group'},
                status=status.HTTP_403_FORBIDDEN
            )

        session, created = PomodoroSession.objects.get_or_create(
            group_id=group_id,
            defaults={'started_by': request.user if is_member else None}
        )
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start the timer for the current phase."""
        session = self.get_object()
        if not session.can_control(request.user, 'start'):
            return Response({'error': 'Only leaders can start the timer'}, status=status.HTTP_403_FORBIDDEN)
        
        if self._has_active_session_elsewhere(request.user, session.group_id):
            return Response(
                {'error': 'You already have an active Pomodoro session in another group. Please stop it before starting a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.start()
        self._broadcast_update(session, 'started', started_by=request.user.username)
        return Response(self.get_serializer(session).data)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause the timer, freezing the remaining time."""
        session = self.get_object()
        if not session.can_control(request.user, 'pause'):
            return Response({'error': 'You do not have permission to pause'}, status=status.HTTP_403_FORBIDDEN)
        session.pause()
        self._broadcast_update(session, 'paused', paused_by=request.user.username)
        return Response(self.get_serializer(session).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume the timer from where it was paused."""
        session = self.get_object()
        if not session.can_control(request.user, 'resume'):
            return Response({'error': 'You do not have permission to resume'}, status=status.HTTP_403_FORBIDDEN)
        
        if self._has_active_session_elsewhere(request.user, session.group_id):
            return Response(
                {'error': 'You already have an active Pomodoro session in another group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.resume()
        self._broadcast_update(session, 'resumed', resumed_by=request.user.username)
        return Response(self.get_serializer(session).data)

    @action(detail=True, methods=['post'])
    def reset(self, request, pk=None):
        """Reset the current phase to initial state."""
        session = self.get_object()
        if not session.can_control(request.user, 'reset'):
            return Response({'error': 'Only leaders can reset the timer'}, status=status.HTTP_403_FORBIDDEN)
        session.reset()
        self._broadcast_update(session, 'reset', reset_by=request.user.username)
        return Response(self.get_serializer(session).data)

    @action(detail=True, methods=['post'])
    def next_phase(self, request, pk=None):
        """Move to the next phase (Work -> Break -> Work)."""
        session = self.get_object()
        if not session.can_control(request.user, 'next_phase'):
            return Response({'error': 'Only leaders can skip phases'}, status=status.HTTP_403_FORBIDDEN)
        session.next_phase()
        self._broadcast_update(session, 'next_phase')
        return Response(self.get_serializer(session).data)

    @action(detail=True, methods=['patch'], url_path='settings')
    def timer_settings(self, request, pk=None):
        """Update Pomodoro settings for a session."""
        session = self.get_object()
        if not session.can_control(request.user, 'settings'):
            return Response({'error': 'Only leaders can change settings'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PomodoroSettingsSerializer(
            session, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            data = PomodoroSessionSerializer(session, context={'request': request}).data
            self._broadcast_update(session, 'settings_updated')
            return Response(data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
