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



# from django.shortcuts import get_object_or_404
# from django.db.models import Q, Count, Max
# from rest_framework import viewsets, permissions, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.contrib.auth import get_user_model

# from .models import Message, Conversation
# from group.models import StudyGroup, GroupMember
# from .serializers import (
#     MessageCreateSerializer, MessageBasicSerializer, 
#     ChatMessageSerializer, ConversationListSerializer
# )

# User = get_user_model()

# class ConversationViewSet(viewsets.ModelViewSet):
#     queryset = Conversation.objects.all()
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = ConversationListSerializer

#     def get_queryset(self):
#         """
#         Return all conversations (group + individual) of the user,
#         annotated with unread message count and last message timestamp.
#         """
#         user = self.request.user
#         return Conversation.objects.filter(
#             # Q(conversation_type='individual', participants=user) 
#             | Q(conversation_type='group', group__members__user=user)
#         ).distinct().annotate(
#             unread_count=Count(
#                 'messages', filter=Q(messages__is_read=False) & ~Q(messages__sender=user)
#             ),
#             last_message_time=Max('messages__timestamp')
#         ).order_by('-last_message_time')

#     @action(detail=False, methods=['post'])
#     def start_individual(self, request):
#         """
#         Start or get an existing individual conversation between the current user and recipient.
#         """
#         recipient_id = request.data.get('recipient_id')
#         if not recipient_id:
#             return Response({"error": "recipient_id is required"}, status=400)

#         if not User.objects.filter(id=recipient_id).exists():
#             return Response({"error": "Recipient does not exist"}, status=404)

#         conversation, created = Conversation.objects.get_or_create_individual(
#             request.user.id, recipient_id
#         )
#         serializer = self.get_serializer(conversation)
#         return Response(serializer.data, status=201 if created else 200)

#     @action(detail=False, methods=['post'])
#     def create_group_conversation(self, request):
#         """
#         Optionally, create a conversation for an existing group.
#         """
#         group_id = request.data.get('group_id')
#         if not group_id:
#             return Response({"error": "group_id is required"}, status=400)

#         group = get_object_or_404(StudyGroup, id=group_id)
#         if hasattr(group, 'conversation'):
#             # Conversation already exists
#             serializer = self.get_serializer(group.conversation)
#             return Response(serializer.data, status=200)

#         conversation = Conversation.objects.create(
#             conversation_type='group',
#             group=group
#         )
#         # Add all active members of the group to the conversation
#         participants = User.objects.filter(group_memberships__group=group, group_memberships__is_active=True)
#         conversation.participants.add(*participants)
#         serializer = self.get_serializer(conversation)
#         return Response(serializer.data, status=201)


# class MessageViewSet(viewsets.ModelViewSet):
#     queryset = Message.objects.all()
#     permission_classes = [permissions.IsAuthenticated]

#     def get_serializer_class(self):
#         if self.action == 'create':
#             return MessageCreateSerializer
#         return MessageBasicSerializer

#     def get_queryset(self):
#         """
#         Return messages of a conversation if user is a participant.
#         """
#         user = self.request.user
#         conversation_id = self.request.query_params.get('conversation_id')
#         queryset = Message.objects.filter(conversation__participants=user)
#         if conversation_id:
#             queryset = queryset.filter(conversation_id=conversation_id)
#         return queryset.order_by('timestamp')

#     def perform_create(self, serializer):
#         """
#         Save message and broadcast to WebSocket channel.
#         """
#         message = serializer.save(sender=self.request.user)

#         # Broadcast to channel layer
#         from channels.layers import get_channel_layer
#         from asgiref.sync import async_to_sync

#         channel_layer = get_channel_layer()
#         room_group_name = f'chat_{message.conversation.id}'

#         ws_serializer = ChatMessageSerializer(message)
#         async_to_sync(channel_layer.group_send)(
#             room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': ws_serializer.data
#             }
#         )

#     @action(detail=False, methods=['get'])
#     def conversation_messages(self, request):
#         """
#         Get all messages of a conversation for the logged-in user.
#         """
#         conversation_id = request.query_params.get('conversation_id')
#         if not conversation_id:
#             return Response({"error": "conversation_id is required"}, status=400)

#         conversation = get_object_or_404(Conversation, id=conversation_id)
#         if not conversation.participants.filter(id=request.user.id).exists():
#             return Response({"error": "Access denied"}, status=403)

#         messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
#         serializer = ChatMessageSerializer(messages, many=True)
#         return Response(serializer.data)

# # -------------------------------
# # Optional Template View for Web
# # -------------------------------
# def chat_room(request, conversation_id):
#     conversation = get_object_or_404(Conversation, id=conversation_id)

#     if not conversation.participants.filter(id=request.user.id).exists():
#         return render(request, 'chat/access_denied.html', status=403)

#     if conversation.conversation_type == 'group':
#         display_name = conversation.group.group_name
#         participants = list(conversation.participants.values('id', 'username', 'full_name'))
#     else:
#         other_user = conversation.participants.exclude(id=request.user.id).first()
#         display_name = getattr(other_user, 'full_name', None) or getattr(other_user, 'email', 'Unknown')
#         participants = [{'id': other_user.id, 'username': other_user.username, 'full_name': other_user.get_full_name()}]

#     context = {
#         'conversation_id': conversation.id,
#         'conversation_type': conversation.conversation_type,
#         'display_name': display_name,
#         'participants': participants,
#         'user_id': request.user.id,
#         'username': request.user.get_full_name() or request.user.username,
#     }
#     return render(request, 'chat/room.html', context)
