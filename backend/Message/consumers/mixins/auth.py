from channels.db import database_sync_to_async
from ...models import Conversation, ConversationMember

class ConversationAuthMixin:
    @database_sync_to_async
    def validate_conversation_access(self, conversation_id, user):
        conversation = Conversation.objects.get(id=conversation_id)

        if not ConversationMember.objects.filter(
            conversation=conversation,
            user=user
        ).exists():
            raise PermissionError("User is not in this conversation")

        return conversation
