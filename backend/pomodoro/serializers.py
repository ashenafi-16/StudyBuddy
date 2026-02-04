from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PomodoroSession

User = get_user_model()


class PomodoroSessionSerializer(serializers.ModelSerializer):
    """Serializer for PomodoroSession."""
    formatted_time = serializers.ReadOnlyField()
    group_name = serializers.CharField(source='group.group_name', read_only=True)
    started_by_username = serializers.CharField(source='started_by.username', read_only=True)

    class Meta:
        model = PomodoroSession
        fields = [
            'id', 'group', 'group_name',
            'work_duration', 'break_duration', 'long_break_duration',
            'sessions_before_long_break',
            'remaining_seconds', 'formatted_time', 'state',
            'current_session_number',
            'started_by', 'started_by_username', 'started_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'remaining_seconds', 'state', 'started_at', 'created_at', 'updated_at']


class PomodoroSettingsSerializer(serializers.ModelSerializer):
    """Serializer for updating Pomodoro settings."""
    
    class Meta:
        model = PomodoroSession
        fields = [
            'work_duration', 'break_duration', 
            'long_break_duration', 'sessions_before_long_break'
        ]

    def validate_work_duration(self, value):
        if value < 60 or value > 7200:  # 1 min to 2 hours
            raise serializers.ValidationError(
                "Work duration must be between 1 minute and 2 hours."
            )
        return value

    def validate_break_duration(self, value):
        if value < 60 or value > 1800:  # 1 min to 30 min
            raise serializers.ValidationError(
                "Break duration must be between 1 minute and 30 minutes."
            )
        return value
