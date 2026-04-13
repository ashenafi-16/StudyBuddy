from rest_framework import viewsets, permissions, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q

from .models import StudyFile
from .serializers import StudyFileSerializer


class StudyFileViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    serializer_class = StudyFileSerializer

    # Only return files from groups user belongs to
    def get_queryset(self):
        user = self.request.user

        return (
            StudyFile.objects
            .select_related("owner", "group")
            .filter(group__members__user=user)
            .order_by("-uploaded_at")
        )

    # Automatically assign owner (extra safety)
    def perform_create(self, serializer):
        group = serializer.validated_data["group"]
        user = self.request.user

        is_member = group.members.filter(
            user=user,
            is_active=True
        ).exists()

        if not is_member: 
            raise PermissionDenied("You are not a member of this group.")
        
        serializer.save(owner=self.request.user)

    # Only owner can delete
    def destroy(self, request, *args, **kwargs):
        study_file = self.get_object()

        if study_file.owner != request.user:
            return Response(
                {"error": "Only the file owner can delete this file."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

    # Optional: Filter by group via query param
    # Example: /api/study-files/?group=5
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        group_id = request.query_params.get("group")
        mine = request.query_params.get("mine") == "true"

        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        if mine:
            queryset = queryset.filter(owner=request.user)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # Optional: Filter by file type
    # Example: /api/study-files/by_type/?type=pdf
    @action(detail=False, methods=["get"])
    def by_type(self, request):
        file_type = request.query_params.get("type")

        if not file_type:
            return Response(
                {"error": "Please specify file type."},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(file_type=file_type)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # Optional: Return files of specific group
    # Example: /api/study-files/group/5/
    @action(detail=False, methods=["get"], url_path="group/(?P<group_id>[^/.]+)")
    def files_by_group(self, request, group_id=None):
        queryset = self.get_queryset().filter(group_id=group_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)