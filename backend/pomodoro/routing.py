from django.urls import re_path
from .consumers import PomodoroConsumer

websocket_urlpatterns = [
    re_path(r'ws/pomodoro/(?P<group_id>\d+)/$', PomodoroConsumer.as_asgi()),
]
