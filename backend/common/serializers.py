from rest_framework import serializers
from accounts.serializers import UserBasicSerializer
from group.models import StudyGroup
from group.serializers import StudyGroupListSerializer
from Tasks.models import Task
from Tasks.serializers import TaskBasicSerializer
from Notifications.models import Notification
from Notifications.serializers import NotificationSerializer


class UserDashboardSerilizer(serializers.Serializer):
    user_profile = UserBasicSerializer(source='*')
    recent_groups = serializers.SerializerMethodField()
    pending_tasks = serializers.SerializerMethodField()
    unread_notifications = serializers.SerializerMethodField()

    def get_recent_groups(self, obj):
        recent_groups = StudyGroup.objects.filter(
            members__user = obj,
            members__is_active=True
        ).order_by('members__joined_at')[:5]
        return StudyGroupListSerializer(recent_groups, many=True, context=self.context).data
    
    def get_pending_tasks(self, obj):
        pending_tasks = Task.objects.filter(
            assigned_to=obj,
            status__in=['pending', 'in_progress']
        ).order_by('due_date')[:5]
        return TaskBasicSerializer(pending_tasks, many=True).data
    
    def get_unread_notifications(self, obj):
        unread_notifications = Notification.objects.filter(
            user=obj,
            is_read=False
        ).order_by('-created_at')[:5]
        return NotificationSerializer(unread_notifications,many=True).data

# analytics Serilizers
class GroupAnalyticsSerializer(serializers.Serializer):
    group_id = serializers.IntegerField()
    group_name= serializers.CharField()
    total_members = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    active_members_this_week = serializers.IntegerField()

class UserActivitySerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    full_name = serializers.CharField()
    messages_sent = serializers.IntegerField()
    tasks_completed = serializers.IntegerField()
    files_uploaded = serializers.IntegerField()
    last_active = serializers.DateTimeField()