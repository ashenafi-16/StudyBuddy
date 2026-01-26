from channels.generic.websocket import AsyncJsonWebsocketConsumer
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from jwt import decode as jwt_decode, InvalidTokenError
from django.conf import settings
from channels.db import database_sync_to_async
from .mixins.online import OnlineTrackerMixin
from ..models import Conversation

User = get_user_model()


class BaseConsumer(AsyncJsonWebsocketConsumer, OnlineTrackerMixin):
    async def connect(self):
        self.user = None

        token = self._get_token()
        if not token:
            await self.close(code=4001)
            return

        self.user = await self._authenticate(token)
        if not self.user:
            await self.close(code=4003)
            return

        await self.accept()

        await self.mark_online()
        await self.broadcast_presence("online")

    async def disconnect(self, close_code):
        if not self.user:
            return

        await self.mark_offline()
        await self.broadcast_presence("offline")


    async def _authenticate(self, token):
        try:
            UntypedToken(token) 
            decoded = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
            user_id = decoded.get("user_id")
            if not user_id:
                return None
            return await self._get_user(user_id)
        except InvalidTokenError:
            return None

    @database_sync_to_async
    def _get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None


    def _get_token(self):
        qs = parse_qs(self.scope["query_string"].decode())
        return qs.get("token", [None])[0]

    @database_sync_to_async
    def _get_user_conversations(self):
        return list(
            Conversation.objects.filter(members__user=self.user)
            .values_list("id", flat=True)
        )

    async def broadcast_presence(self, status):
        conversation_ids = await self._get_user_conversations()
        for cid in conversation_ids:
            await self.channel_layer.group_send(
                f"chat_{cid}",
                {
                    "type": "presence.event",
                    "user_id": self.user.id,
                    "status": status,
                },
            )
