from rest_framework import serializers
from .models import StudyGroup, GroupMember
from accounts.serializers import UserBasicSerializer
from django.contrib.auth import get_user_model
from Message.serializers import MessageBasicSerializer
from Tasks.serializers import TaskBasicSerializer

User = get_user_model()


class StudyGroupCreateSerializer(serializers.ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    member_count = serializers.ReadOnlyField()

    class Meta:
        model = StudyGroup
        fields = (
            'id', 'group_name', 'group_type', 'group_description', 'profile_pic',
            'created_by', 'max_members', 'is_public', 'created_at', 'member_count'
        )
        read_only_fields = ('id', 'created_at', 'member_count')


class StudyGroupListSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    member_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    profile_pic_url = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = (
            'id', 'group_name', 'group_description', 'group_type',
            'created_by', 'member_count', 'max_members', 'is_public',
            'created_at', 'is_member', 'user_role', 'profile_pic_url'
        )

    def get_is_member(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.members.filter(user=user, is_active=True).exists()
        return False

    def get_user_role(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            membership = obj.members.filter(user=user, is_active=True).first()
            return membership.role if membership else None
        return None

    def get_profile_pic_url(self, obj):
        if obj.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_pic.url)
            return obj.profile_pic.url
        return None


class StudyGroupDetailSerializer(StudyGroupListSerializer):
    recent_messages = serializers.SerializerMethodField()
    active_tasks = serializers.SerializerMethodField()

    class Meta(StudyGroupListSerializer.Meta):
        fields = StudyGroupListSerializer.Meta.fields + ('recent_messages', 'active_tasks')

    def get_recent_messages(self, obj):
        recent_messages = obj.messages.all()[:5]
        return MessageBasicSerializer(recent_messages, many=True).data

    def get_active_tasks(self, obj):
        active_tasks = obj.tasks.filter(status__in=['pending', 'in_progress'])[:5]
        return TaskBasicSerializer(active_tasks, many=True).data


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    group_name = serializers.CharField(source='group.group_name', read_only=True)
    group_profile_pic_url = serializers.SerializerMethodField()

    class Meta:
        model = GroupMember
        fields = ('id', 'user', 'group', 'group_name', 'group_profile_pic_url', 'role', 'joined_at', 'is_active')
        read_only_fields = ('joined_at',)

    def get_group_profile_pic_url(self, obj):
        if obj.group.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.group.profile_pic.url)
            return obj.group.profile_pic.url
        return None


class GroupMemberCreateSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(write_only=True)

    class Meta:
        model = GroupMember
        fields = ('user_email', 'group')
        extra_kwargs = {'group': {'read_only': True}}

    def create(self, validated_data):
        user_email = validated_data.pop('user_email')
        group = validated_data.get('group')

        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_email": "User with this email does not exist."})

        if GroupMember.objects.filter(user=user, group=group, is_active=True).exists():
            raise serializers.ValidationError({"user_email": "User is already a member of this group."})

        return GroupMember.objects.create(user=user, group=group)


class GroupMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMember
        fields = ('role', 'is_active')
