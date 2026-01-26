from channels.db import database_sync_to_async

from .base import BaseConsumer
from .mixins.auth import ConversationAuthMixin
from .mixins.typing import TypingMixin
from .mixins.file_handler import FileHandlerMixin
from .mixins.notifications import NotificationMixin
from ..models import Message


class ChatConsumer(
    BaseConsumer,
    ConversationAuthMixin,
    TypingMixin,
    FileHandlerMixin,
    NotificationMixin,
):
    async def connect(self):
        await super().connect()

        if not self.user:
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]

        try:

            self.conversation = await self.validate_conversation_access(
                self.conversation_id,
                self.user
            )
        except Exception as e: 
            await self.close(code=4003)
            return 

        self.group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

        if getattr(self, "user", None):
            await self.broadcast_presence("offline")

        await super().disconnect(close_code)


    async def receive_json(self, data):
        action = data.get("action")

        if action == "typing":
            await self.handle_typing(self.conversation_id, self.user)
            return

        if action == "send_message":
            await self._handle_message(data)

    async def _handle_message(self, data):
        msg_type = data.get("message_type", "text")

        if msg_type != "text":
            # Files/images should be sent via HTTP POST, not WebSocket
            return

        text_content = data.get("text") or data.get("content", "")
        if not text_content.strip():
            return

        message = await self._create_text_message(text_content)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message": await self._serialize_message(message),
            }
        )

    # -------------------------
    # Group event handlers
    # -------------------------

    async def chat_message(self, event):
        await self.send_json(event["message"])

    async def presence_event(self, event):
        await self.send_json({
            "type": "presence",
            "user_id": event["user_id"],
            "status": event["status"],
        })


    @database_sync_to_async
    def _create_text_message(self, text):
        return Message.objects.create(
            conversation=self.conversation,
            sender=self.user,
            content=text,  
            message_type="text",
        )

    @database_sync_to_async
    def _serialize_message(self, msg):
        file_url = None
        if msg.file_attachment:
            if hasattr(msg.file_attachment, 'url'):
                file_url = msg.file_attachment.url
            else:
                file_url = str(msg.file_attachment)
        
        return {
            "id": msg.id,
            "conversation_id": msg.conversation.id,
            "sender": {
                "id": msg.sender.id,
                "email": msg.sender.email,
                "full_name": msg.sender.full_name,
            },
            "sender_name": msg.sender.full_name or msg.sender.email,
            "message_type": msg.message_type,
            "content": msg.content,
            "file_attachment": file_url,
            "timestamp": msg.timestamp.isoformat(),
            "is_edited": msg.is_edited,
            "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
            "reply_to": msg.reply_to_id,
            "file_info": {
                "name": msg.file_name or "file",
                "url": file_url,
                "size": msg.file_size or 0,
            } if file_url else None,
        }
