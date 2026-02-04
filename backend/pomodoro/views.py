from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import PomodoroSession
from .serializers import PomodoroSessionSerializer, PomodoroSettingsSerializer
from group.models import GroupMember
from subscriptions.permissions import IsPremiumUser


class PomodoroViewSet(viewsets.ModelViewSet):
    """ViewSet for Pomodoro session management (REST API complement to WebSocket)."""
    serializer_class = PomodoroSessionSerializer

    def get_permissions(self):
        if self.action == 'settings':
            permission_classes = [permissions.IsAuthenticated, IsPremiumUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

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

        # Verify membership
        is_member = GroupMember.objects.filter(
            user=request.user,
            group_id=group_id,
            is_active=True
        ).exists()

        if not is_member:
            return Response(
                {'error': 'You are not a member of this group'},
                status=status.HTTP_403_FORBIDDEN
            )

        session, created = PomodoroSession.objects.get_or_create(
            group_id=group_id,
            defaults={'started_by': request.user}
        )
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def settings(self, request, pk=None):
        """Update Pomodoro settings for a session."""
        session = self.get_object()
        
        serializer = PomodoroSettingsSerializer(
            session, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            # Also update remaining_seconds if timer is idle
            if session.state == 'idle':
                session.remaining_seconds = session.work_duration
                session.save()
            
            return Response(PomodoroSessionSerializer(session).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
