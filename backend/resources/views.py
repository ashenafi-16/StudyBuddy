from rest_framework import viewsets, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import StudyFile
from .serializers import (
    StudyFileListSerializer,
    ShareFileSerializer
)
from subscriptions.permissions import IsPremiumUser

User = get_user_model()


class StudyFileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing study files."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        """Return files owned by or shared with the user."""
        user = self.request.user
        return StudyFile.objects.filter(
            Q(owner=user) | Q(shared_with=user) | Q(is_public=True)
        ).select_related('owner').prefetch_related('shared_with').distinct()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'share']:
            permission_classes = [permissions.IsAuthenticated, IsPremiumUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == 'create':
            return StudyFileUploadSerializer
        if self.action == 'list':
            return StudyFileListSerializer
        return StudyFileSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def my_files(self, request):
        """Return only files owned by the current user."""
        queryset = StudyFile.objects.filter(owner=request.user)
        serializer = StudyFileListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """Return files shared with the current user."""
        queryset = StudyFile.objects.filter(shared_with=request.user)
        serializer = StudyFileListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a file with other users."""
        study_file = self.get_object()
        
        # Only owner can share
        if study_file.owner != request.user:
            return Response(
                {'error': 'Only the file owner can share this file.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ShareFileSerializer(data=request.data)
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            users = User.objects.filter(id__in=user_ids)
            study_file.shared_with.add(*users)
            
            return Response({
                'status': f'File shared with {len(users)} user(s).',
                'shared_with': [u.username for u in users]
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def unshare(self, request, pk=None):
        """Remove sharing for specific users."""
        study_file = self.get_object()
        
        if study_file.owner != request.user:
            return Response(
                {'error': 'Only the file owner can modify sharing.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ShareFileSerializer(data=request.data)
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            users = User.objects.filter(id__in=user_ids)
            study_file.shared_with.remove(*users)
            
            return Response({
                'status': f'File unshared from {len(users)} user(s).'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Filter files by type."""
        file_type = request.query_params.get('type')
        if not file_type:
            return Response(
                {'error': 'Please specify a file type.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(file_type=file_type)
        serializer = StudyFileListSerializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Only owner can delete files."""
        study_file = self.get_object()
        
        if study_file.owner != request.user:
            return Response(
                {'error': 'Only the file owner can delete this file.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
