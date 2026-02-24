from channels.db import database_sync_to_async
from ...models import Conversation, ConversationMember

class ConversationAuthMixin:
    @database_sync_to_async
    def validate_conversation_access(self, conversation_id, user):
        from group.models import GroupMember

        conversation = Conversation.objects.select_related('group').get(id=conversation_id)

        if conversation.type == 'group':
            # Check if user is an active member of the group
            if not GroupMember.objects.filter(
                group=conversation.group,
                user=user,
                is_active=True
            ).exists():
                raise PermissionError(f"User {user.id} is not an active member of group {conversation.group_id}")
            
            # Auto-ensure ConversationMember exists for group members for consistency
            ConversationMember.objects.get_or_create(
                conversation=conversation,
                user=user
            )
        else:
            # For individual chats, check the members table directly
            if not ConversationMember.objects.filter(
                conversation=conversation,
                user=user
            ).exists():
                raise PermissionError(f"User {user.id} is not a member of conversation {conversation_id}")

        return conversation
