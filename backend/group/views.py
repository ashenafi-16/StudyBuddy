from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from .models import StudyGroup, GroupMember
from .serializers import (
    StudyGroupCreateSerializer, 
    StudyGroupListSerializer, 
    StudyGroupDetailSerializer, 
    GroupMemberSerializer,
    GroupMemberUpdateSerializer,
    GroupMemberCreateSerializer
)
from django.db.models import Q
from Notifications.models import Notification
from rest_framework.decorators import action
from datetime import timezone
from datetime import timedelta, datetime
from django.utils.timezone import now as timezone_now
from rest_framework.exceptions import PermissionDenied
from Message.models import Conversation, ConversationMember
from rest_framework.exceptions import PermissionDenied, ValidationError

class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return StudyGroupCreateSerializer
        elif self.action == 'list':
            return StudyGroupListSerializer
        elif self.action == 'retrieve':
            return StudyGroupDetailSerializer
        return StudyGroupCreateSerializer
    
    def get_queryset(self):
        user = self.request.user
        if self.action == 'list':
            return StudyGroup.objects.filter(
                Q(is_public=True) | Q(members__user=user, members__is_active=True)
            ).distinct().order_by('-created_at')

        return StudyGroup.objects.all()
    
    def perform_create(self, serializer):
        user = self.request.user
        group_name = serializer.validated_data.get('group_name')

        if StudyGroup.objects.filter(group_name=group_name, created_by=user).exists():
            raise ValidationError({"group_name": "You already have a group with this name."})
        group = serializer.save(created_by=user)

        GroupMember.objects.create(
            user=self.request.user,
            group=group,
            role='admin'
        )

        # create conversation for this group
        conversation, created = Conversation.objects.get_or_create(
            group=group,
            defaults={"type": "group"}
        )
        
        if not ConversationMember.objects.filter(conversation=conversation, user=self.request.user).exists():
            ConversationMember.objects.create(
                conversation=conversation,
                user = self.request.user
            )

    @action(detail=True, methods=['post'])
    def join(self,request, pk=None):
        group = self.get_object()

        if not group.is_public:
            return Response(
                {"error": "This group is private. You need an invitation to join."},
                status = status.HTTP_403_FORBIDDEN
            )
        
        member, created = GroupMember.objects.get_or_create(
            user= request.user,
            group = group, 
            defaults={'role': 'member'}
        )
        if not created and member.is_active:
            return Response(
                {"error": "You are already a member of this group."},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif not created and not member.is_active:
            member.is_active=True
            member.role="member"
            member.save()
        
        # Ensure conversation exists
        conversation, _ = Conversation.objects.get_or_create(
            group=group,
            defaults={'type':'group'}
        )

        # Ensure use is in coversation members
        ConversationMember.objects.get_or_create(
            conversation=conversation,
            user=request.user
        )

        Notification.objects.create(
            user=request.user,
            Notification_type='group',
            title=f"Joined {group.group_name}",
            message=f'You have successfully joined {group.group_name}',
            related_group=group
        )

     
        serilizer = GroupMemberSerializer(member)
        return Response(serilizer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', "")
        if not query:
            return Response([])
        group = StudyGroup.objects.filter(
            Q(group_name__icontains=query) , is_public=True
        ).distinct()[:10]
        serializer = StudyGroupListSerializer(group, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()

        member = GroupMember.objects.filter(
            user=request.user,
            group=group,
            is_active = True
        ).first()

        if not member:
            return Response(
                {"error": "You are not a member of this group."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if member.role == 'admin':
            admin_count = GroupMember.objects.filter(
                group=group,
                role='admin',
                is_active=True
            ).count()
            
            if admin_count == 1:
                return Response({
                    "error": "You are the only admin. Assign another admin  before leaving."
                },
                status=status.HTTP_400_BAD_REQUEST
                )
        member.is_active = False
        member.save()

        return Response({"message": "Successfully left the group."})
        
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        group = self.get_object()
        members  = group.members.filter(is_active=True)
        
        serializer = GroupMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        group = self.get_object()

        total_members = group.members.filter(is_active=True).count()
        total_messages = group.messages.count()
        total_tasks = group.tasks.count()
        completed_tasks = group.tasks.filter(status='completed').count()
        
        week_ago = timezone_now() - timedelta(days=7)
        active_members = GroupMember.objects.filter(
            group=group,
            is_active=True,
            user__sent_messages__group=group,
            user__sent_messages__timestamp__gte=week_ago
        ).distinct().count()

        anaylics_data = {
            'group_id': group.id,
            'group_name': group.group_name,
            'total_members': total_members,
            'total_messages': total_messages,
            'total_asks': total_tasks,
            'completed_tasks': completed_tasks,
            'active_members_this_week': active_members,
            'completion_rate': round((completed_tasks/total_tasks * 100) if total_tasks > 0 else 0,2)
        }

        return Response(anaylics_data)
        
class GroupMemberViewSet(viewsets.ModelViewSet):
    queryset = GroupMember.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return GroupMemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return GroupMemberUpdateSerializer
        return GroupMemberSerializer
    
    def get_queryset(self):
        user = self.request.user
        return GroupMember.objects.filter(
            group__members__user=user,
            group__members__is_active=True
        ).distinct()
    
    def perform_create(self, serializer):
        group_id = self.request.data.get('group_id')
        if not group_id:
            raise ValidationError({"group_id": "This field is required."})

        try:
            group = StudyGroup.objects.get(id=group_id)
        except StudyGroup.DoesNotExist:
            raise ValidationError({"group_id": "Group does not exist."})

        # Check if current user (request.user) is admin/moderator in this group
        current_user_membership = GroupMember.objects.filter(
            user=self.request.user,
            group=group,
            role__in=['admin', 'moderator'],
            is_active=True
        ).first()

        if not current_user_membership:
            raise PermissionDenied("You don't have permission to add members to this group.")

        # Pass group to serializer
        serializer.save(group=group)