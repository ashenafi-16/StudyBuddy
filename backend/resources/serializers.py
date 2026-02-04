from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudyFile

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for file owners/shared users."""
    profile_pic_url = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_pic_url']


class StudyFileSerializer(serializers.ModelSerializer):
    """Serializer for StudyFile with all details."""
    owner = UserMinimalSerializer(read_only=True)
    shared_with = UserMinimalSerializer(many=True, read_only=True)
    file_url = serializers.ReadOnlyField()
    file_size_display = serializers.ReadOnlyField()

    class Meta:
        model = StudyFile
        fields = [
            'id', 'owner', 'file', 'file_url', 'filename', 
            'file_type', 'file_size', 'file_size_display',
            'description', 'shared_with', 'is_public',
            'uploaded_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'file_url', 'uploaded_at', 'updated_at']


class StudyFileUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading files."""
    file = serializers.FileField(write_only=True)
    
    class Meta:
        model = StudyFile
        fields = ['file', 'description', 'is_public']

    def create(self, validated_data):
        request = self.context['request']
        uploaded_file = validated_data.pop('file')
        
        # Extract file info
        filename = uploaded_file.name
        file_size = uploaded_file.size
        file_type = StudyFile.detect_file_type(filename)
        
        # Create the StudyFile instance
        study_file = StudyFile.objects.create(
            owner=request.user,
            file=uploaded_file,
            filename=filename,
            file_size=file_size,
            file_type=file_type,
            **validated_data
        )
        
        return study_file


class ShareFileSerializer(serializers.Serializer):
    """Serializer for sharing a file with users."""
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )

    def validate_user_ids(self, value):
        users = User.objects.filter(id__in=value)
        if len(users) != len(value):
            raise serializers.ValidationError("Some user IDs are invalid.")
        return value


class StudyFileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for file listings."""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    file_url = serializers.ReadOnlyField()
    file_size_display = serializers.ReadOnlyField()
    shared_count = serializers.SerializerMethodField()

    class Meta:
        model = StudyFile
        fields = [
            'id', 'filename', 'file_type', 'file_url',
            'file_size_display', 'owner_username', 
            'shared_count', 'is_public', 'uploaded_at'
        ]

    def get_shared_count(self, obj):
        return obj.shared_with.count()
