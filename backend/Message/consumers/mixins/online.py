from redis import Redis
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

redis = Redis(host="127.0.0.1", port=6379, db=0)

ONLINE_USERS_KEY = "online_users"


class OnlineTrackerMixin:
    @sync_to_async
    def mark_online(self):
        if not getattr(self, "user", None):
            return
        redis.sadd(ONLINE_USERS_KEY, int(self.user.id))

    @sync_to_async
    def mark_offline(self):
        if not getattr(self, "user", None):
            return
        redis.srem(ONLINE_USERS_KEY, int(self.user.id))

    @staticmethod
    @sync_to_async
    def get_online_users():
        users = redis.smembers(ONLINE_USERS_KEY)
        return [int(uid) for uid in users]


class OnlineConsumer(AsyncJsonWebsocketConsumer):    
    async def connect(self):
        from ..base import BaseConsumer
        
        # Authenticate the user
        self.user = None
        token = self._get_token()
        if token:
            base = BaseConsumer()
            base.scope = self.scope
            self.user = await base._authenticate(token)
        
        if not self.user:
            await self.close(code=4003)
            return
        
        await self.accept()
        await self.mark_online()
        
        # Send current online users
        online_users = await self.get_online_users()
        await self.send_json({
            "type": "online_users",
            "users": online_users
        })
    
    async def disconnect(self, close_code):
        if getattr(self, "user", None):
            await self.mark_offline()
    
    def _get_token(self):
        from urllib.parse import parse_qs
        qs = parse_qs(self.scope["query_string"].decode())
        return qs.get("token", [None])[0]
    
    @sync_to_async
    def mark_online(self):
        if self.user:
            redis.sadd(ONLINE_USERS_KEY, int(self.user.id))
    
    @sync_to_async
    def mark_offline(self):
        if self.user:
            redis.srem(ONLINE_USERS_KEY, int(self.user.id))
    
    @staticmethod
    @sync_to_async
    def get_online_users():
        users = redis.smembers(ONLINE_USERS_KEY)
        return [int(uid) for uid in users]
