from rest_framework import serializers
from .models import Task, StudyResource,StudySession
from group.models import GroupMember
from django.utils import timezone
from accounts.serializers import UserBasicSerializer

class TaskCreateSerializer(serializers.ModelSerializer):
    created_by = serializers.HiddenField(default = serializers.CurrentUserDefault())

    class Meta:
        model = Task
        fields = (
        'id', 'title', 'description', 'assigned_to', 'created_by',
        'group', 'priority', 'status', 'due_date', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def validate_due_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value
    
    def validate(self, attrs):
        # verify assigned_to the group member
        group = attrs.get('group')
        assigned_to = attrs.get('assigned_to')
        if group and assigned_to:
            if not GroupMember.objects.filter(user=assigned_to, group=group, is_active=True).exists():
                raise serializers.ValidationError({
                    'assigned_to': "User must be a member of the group to be assigned tasks."
                })
        return attrs

class TaskBasicSerializer(serializers.ModelSerializer):
    assigned_to = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    group_name = serializers.CharField(source='group.group_name', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    is_overdue_calculated = serializers.BooleanField(read_only=True)
    days_until_due = serializers.DurationField(read_only=True)

    
    class Meta:
        model = Task
        fields = (
        'id', 'title', 'description', 'assigned_to', 'created_by',
        'group', 'group_name', 'priority', 'status', 'due_date',
        'is_overdue_calculated', 'days_until_due','is_overdue','completed_at', 'created_at'
        )
    
class TaskDetailSerializer(TaskBasicSerializer):
    assigned_to_details = UserBasicSerializer(source='assigned_to', read_only=True)

    class Meta(TaskBasicSerializer.Meta):
        fields = TaskBasicSerializer.Meta.fields + ('assigned_to_details',)

class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('title', 'description', 'priority', 'status', 'due_date')
    
    def update(self, instance, validated_data):
        if validated_data.get('status') =='completed' and instance.status != 'completed':
            validated_data['completed_at'] = timezone.now()
        elif validated_data.get('status') != 'completed':
            validated_data['completed_at'] = None

        return super().update(instance, validated_data)

class StudyResourceCreateSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.HiddenField(default = serializers.CurrentUserDefault())

    class Meta:
        model = StudyResource
        fields = (
        'id', 'title', 'description', 'file', 'resource_type',
        'uploaded_by', 'group', 'uploaded_at', 'file_size'
        )
        read_only_fields = ('id', 'uploaded_at', 'file_size')
    
    def validate_file(self, value):
        max_size = 50 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 50MB.")
        return value

class StudyResourceSerializer(serializers.ModelSerializer):
    uploaded_by = UserBasicSerializer(read_only=True)
    group_name = serializers.CharField(source='group.group_name', read_only=True)

    class Meta:
        model = StudyResource
        fields = (
        'id', 'title', 'description', 'file', 'resource_type',
        'uploaded_by', 'group', 'group_name', 'uploaded_at',
        'file_size', 'download_count'
        )
        read_only_fields = ('id', 'uploaded_at', 'file_size', 'download_count')

class StudyResourceDownloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyResource
        fields = ('id', 'title', 'file')
        read_only_fields = ('id', 'title', 'file')

class StudySessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = ['id', 'subject', 'topic', 'group', 'start_time', 'end_time']

class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = ['id', 'subject', 'topic', 'duration', 'start_time', 'end_time']

class StudySessionDetailSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.group_name', read_only=True)

    class Meta:
        model = StudySession
        fields = ['id', 'subject', 'topic', 'group_name', 'duration', 'start_time', 'end_time']


