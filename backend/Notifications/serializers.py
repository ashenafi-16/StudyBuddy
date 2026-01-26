from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    related_group_name = serializers.CharField(source='related_group.group_name', read_only=True)

    class Meta:
        model = Notification
        fields = (
        'id', 'user', 'notification_type', 'title',
        'message', 'related_group', 'related_group_name',
        'is_read', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('is_read',)