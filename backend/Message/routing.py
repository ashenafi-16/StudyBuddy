from django.urls import re_path
from . import consumers
from Message.consumers.chat import ChatConsumer
from Message.consumers.mixins.online import OnlineConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', ChatConsumer.as_asgi()),
    re_path(r'^ws/online/$', OnlineConsumer.as_asgi()),
]
