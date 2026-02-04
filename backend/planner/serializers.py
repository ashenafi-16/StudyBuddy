from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudySession

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for session participants."""
    profile_pic_url = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_pic_url']


class StudySessionSerializer(serializers.ModelSerializer):
    """Serializer for StudySession CRUD operations."""
    host = UserMinimalSerializer(read_only=True)
    participant = UserMinimalSerializer(read_only=True)
    participant_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='participant',
        write_only=True,
        required=False,
        allow_null=True
    )
    meeting_url = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = StudySession
        fields = [
            'id', 'title', 'subject', 'description',
            'start_time', 'end_time',
            'host', 'participant', 'participant_id',
            'meeting_id', 'meeting_url', 'is_active', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'meeting_id', 'host', 'created_at', 'updated_at']


class StudySessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating study sessions."""
    participant_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='participant',
        required=False,
        allow_null=True
    )

    class Meta:
        model = StudySession
        fields = [
            'title', 'subject', 'description',
            'start_time', 'end_time', 'participant_id'
        ]

    def validate(self, data):
        """Ensure end_time is after start_time."""
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time.'
                })
        return data

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)


class CalendarEventSerializer(serializers.ModelSerializer):
    """Serializer for FullCalendar event format."""
    id = serializers.CharField(source='pk')
    start = serializers.DateTimeField(source='start_time')
    end = serializers.DateTimeField(source='end_time')
    backgroundColor = serializers.SerializerMethodField()
    borderColor = serializers.SerializerMethodField()
    extendedProps = serializers.SerializerMethodField()

    class Meta:
        model = StudySession
        fields = ['id', 'title', 'start', 'end', 'backgroundColor', 'borderColor', 'extendedProps']

    def get_backgroundColor(self, obj):
        status_colors = {
            'scheduled': '#3b82f6',   # blue
            'in_progress': '#22c55e', # green
            'completed': '#6b7280',   # gray
            'cancelled': '#ef4444',   # red
        }
        return status_colors.get(obj.status, '#3b82f6')

    def get_borderColor(self, obj):
        return self.get_backgroundColor(obj)

    def get_extendedProps(self, obj):
        return {
            'subject': obj.subject,
            'description': obj.description,
            'meeting_url': obj.meeting_url,
            'is_active': obj.is_active,
            'status': obj.status,
            'host': {
                'id': obj.host.id,
                'username': obj.host.username
            },
            'participant': {
                'id': obj.participant.id,
                'username': obj.participant.username
            } if obj.participant else None
        }
