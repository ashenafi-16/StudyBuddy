from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from .models import StudyFile
from group.models import StudyGroup


class StudyFileSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")
    file_url = serializers.ReadOnlyField()
    filename = serializers.ReadOnlyField()
    group_name = serializers.ReadOnlyField(source="group.group_name")
    file_size_display = serializers.ReadOnlyField()

    class Meta:
        model = StudyFile
        fields = [
            "id",
            "group",
            "group_name",
            "owner",
            "file",
            "file_url",
            "filename",
            "file_type",
            "file_size",
            "file_size_display",
            "description",
            "uploaded_at",
        ]
        read_only_fields = [
            "owner",
            "file_type",
            "file_size",
            "uploaded_at",
        ]

    # Validate file extension
    def validate_file(self, value):
        allowed_extensions = [
            "pdf", "png", "jpg", "jpeg", "gif",
            "webp", "doc", "docx", "txt",
            "ppt", "pptx", "xls", "xlsx", "csv"
        ]

        ext = value.name.split(".")[-1].lower()

        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                "This file type is not allowed."
            )

        return value

    # Validate group membership
    def validate_group(self, value):
        user = self.context["request"].user

        is_member = value.members.filter(
            user=user,
            is_active=True
        ).exists()

        if not is_member: 
            raise serializers.ValidationError("You are not a member of this group.")
    
        return value

    # Auto-assign owner and metadata
    def create(self, validated_data):
        file_obj = validated_data.get('file')
        if file_obj and not validated_data.get('filename'):
            validated_data['filename'] = file_obj.name

        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)