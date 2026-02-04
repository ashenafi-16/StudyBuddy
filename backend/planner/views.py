from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import StudySession
from .serializers import (
    StudySessionSerializer, 
    StudySessionCreateSerializer,
    CalendarEventSerializer
)


class StudySessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing study sessions."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return sessions where user is host or participant."""
        user = self.request.user
        return StudySession.objects.filter(
            Q(host=user) | Q(participant=user)
        ).select_related('host', 'participant')

    def get_serializer_class(self):
        if self.action == 'create':
            return StudySessionCreateSerializer
        return StudySessionSerializer

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Return sessions in FullCalendar event format."""
        # Get date range from query params
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        
        queryset = self.get_queryset()
        
        if start:
            queryset = queryset.filter(start_time__gte=start)
        if end:
            queryset = queryset.filter(end_time__lte=end)
        
        serializer = CalendarEventSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Return upcoming sessions within the next 7 days."""
        now = timezone.now()
        week_later = now + timedelta(days=7)
        
        queryset = self.get_queryset().filter(
            start_time__gte=now,
            start_time__lte=week_later,
            status='scheduled'
        )[:5]
        
        serializer = StudySessionSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a study session."""
        session = self.get_object()
        
        if session.host != request.user:
            return Response(
                {'error': 'Only the host can cancel the session.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        session.status = 'cancelled'
        session.save()
        
        return Response({'status': 'Session cancelled.'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a study session as completed."""
        session = self.get_object()
        session.status = 'completed'
        session.save()
        
        return Response({'status': 'Session marked as completed.'})
