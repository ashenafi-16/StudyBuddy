from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PomodoroSession

User = get_user_model()


class PomodoroSessionSerializer(serializers.ModelSerializer):
    """Serializer for PomodoroSession."""
    remaining_seconds = serializers.SerializerMethodField()
    group_name = serializers.CharField(source='group.group_name', read_only=True)
    started_by_username = serializers.CharField(source='started_by.username', read_only=True)

    class Meta:
        model = PomodoroSession
        fields = [
            'id', 'group', 'group_name',
            'work_duration', 'break_duration', 'long_break_duration',
            'sessions_before_long_break',
            'phase', 'state',
            'phase_start', 'phase_duration',
            'paused_at', 'remaining_seconds_at_pause',
            'remaining_seconds', # Calculated field
            'current_session_number',
            'started_by', 'started_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'phase', 'state', 'phase_start', 'phase_duration', 'created_at', 'updated_at']

    def get_remaining_seconds(self, obj):
        from django.utils import timezone
        
        # If idle or completed, return default duration for current phase type? 
        # Or just 0? Let's return duration to show "Ready to start".
        if obj.state == PomodoroSession.TimerState.IDLE:
             return obj.work_duration # Default to start work
             
        if obj.state == PomodoroSession.TimerState.COMPLETED:
            return 0

        # If paused, return the frozen remaining time
        if obj.state == PomodoroSession.TimerState.PAUSED:
            return obj.remaining_seconds_at_pause or 0

        # If running, calculate difference
        if obj.state == PomodoroSession.TimerState.RUNNING and obj.phase_start:
            now = timezone.now()
            elapsed = (now - obj.phase_start).total_seconds()
            remaining = obj.phase_duration - elapsed
            return max(0, int(remaining))
            
        return 0


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
