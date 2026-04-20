# messages/views.py

from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import Message, Conversation, ConversationMember
from group.models import StudyGroup, GroupMember
from .serializers import (
    MessageCreateSerializer,
    MessageBasicSerializer,
    ChatMessageSerializer,
    ConversationListSerializer,
    GroupConversationSerializer
)

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()


class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles:
    - Listing individual conversations
    - Listing group conversations
    - Creating/fetching individual conversation
    - Creating/fetching group conversation
    """
    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Default queryset: return all conversations (group + individual) for current user
        """
        user = self.request.user
        return (
            Conversation.objects.filter(
                Q(members__user=user) | Q(group__members__user=user)
            )
            .distinct()
            .annotate(
                unread_count=Count(
                    'messages',
                    filter=Q(messages__is_read=False) & ~Q(messages__sender=user)
                ),
                last_message_time=Max('messages__timestamp')
            )
            .order_by('-last_message_time')
        )

    # List only individual conversations
    @action(detail=False, methods=['get'])
    def individual_list(self, request):
        user = request.user
        individual_conversations = (
            Conversation.objects.filter(
                type='individual',
                members__user=user
            )
            .distinct()
            .annotate(
                unread_count=Count(
                    'messages',
                    filter=Q(messages__is_read=False) & ~Q(messages__sender=user)
                ),
                last_message_time=Max('messages__timestamp')
            )
            .order_by('-last_message_time')
        )

        serializer = self.get_serializer(individual_conversations, many=True)
        return Response(serializer.data)

    # List only group conversations
    @action(detail=False, methods=['get'])
    def group_list(self, request):
        user = request.user
        group_conversations = (
            Conversation.objects.filter(
                type='group',
                group__members__user=user
            )
            .distinct()
            .annotate(
                unread_count=Count(
                    'messages',
                    filter=Q(messages__is_read=False) & ~Q(messages__sender=user)
                ),
                last_message_time=Max('messages__timestamp')
            )
            .order_by('-last_message_time')
        )

        serializer = GroupConversationSerializer(
            group_conversations, many=True, context={'request': request}
        )
        return Response(serializer.data)

    # Start or fetch individual conversation
    @action(detail=False, methods=['post'])
    def start_individual(self, request):
        recipient_id = request.data.get("recipient_id")

        if not recipient_id:
            return Response({"error": "recipient_id is required"}, status=400)

        if not User.objects.filter(id=recipient_id).exists():
            return Response({"error": "Recipient does not exist"}, status=404)

        conversation, created = Conversation.objects.get_or_create_individual(
            request.user.id, recipient_id
        )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=201 if created else 200)

    @action(detail=False, methods=['post'])
    def create_group_conversation(self, request):
        group_id = request.data.get("group_id")

        if not group_id:
            return Response({"error": "group_id is required"}, status=400)

        group = get_object_or_404(StudyGroup, id=group_id)

        # If conversation already exists → return it
        if hasattr(group, "conversation"):
            serializer = self.get_serializer(group.conversation)
            return Response(serializer.data, status=200)

        # Create new conversation
        conversation = Conversation.objects.create(
            type=Conversation.ConversationTypes.GROUP,
            group=group
        )

        # Add group members as conversation members
        members = GroupMember.objects.filter(group=group, is_active=True)
        for member in members:
            ConversationMember.objects.get_or_create(
                conversation=conversation,
                user=member.user
            )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=201)


class MessageViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
    - GET  /api/messages/?conversation_id=ID   → list messages
    - POST /api/messages/                      → send message
    """
    queryset = Message.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return MessageCreateSerializer if self.action == "create" else ChatMessageSerializer

    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get("conversation_id")

        qs = Message.objects.filter(conversation__members__user=user)

        if conversation_id:
            qs = qs.filter(conversation_id=conversation_id)

        return qs.order_by("timestamp")

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)

        channel_layer = get_channel_layer()
        room_name = f"chat_{message.conversation.id}"  

        payload = ChatMessageSerializer(message, context={'request': self.request}).data
        print("authenticated user: ", self.request.user , self.request.user.is_authenticated)
        
        async_to_sync(channel_layer.group_send)(
            room_name,
            {
                "type": "chat.message",  # This calls chat_message() in consumer
                "message": payload,
            }
        )

        return message

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark all messages in a conversation as read for the current user."""
        conversation_id = request.data.get('conversation_id')
        if not conversation_id:
            return Response({"error": "conversation_id is required"}, status=400)

        updated = Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False,
        ).exclude(sender=request.user).update(is_read=True)

        return Response({"marked": updated})


# Optional Template-Based HTML Chat View (if needed)
def chat_room(request, conversation_id):
    from django.shortcuts import render

    conversation = get_object_or_404(Conversation, id=conversation_id)

    if not conversation.members.filter(user=request.user).exists():
        return render(request, "chat/access_denied.html", status=403)

    # Display name
    if conversation.type == Conversation.ConversationTypes.GROUP:
        display_name = conversation.group.group_name
        participants = list(
            conversation.members.values("user__id", "user__username", "user__full_name")
        )
    else:
        other = conversation.members.exclude(user=request.user).first()
        display_name = other.user.full_name or other.user.email
        participants = [{
            "id": other.user.id,
            "username": other.user.username,
            "full_name": other.user.full_name
        }]

    context = {
        "conversation_id": conversation.id,
        "conversation_type": conversation.type,
        "display_name": display_name,
        "participants": participants,
        "user_id": request.user.id,
        "username": request.user.get_full_name() or request.user.username,
    }

    return render(request, "chat/room.html", context)

