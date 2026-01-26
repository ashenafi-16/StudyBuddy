from django.urls import path
from .views import NotificationListView, NotificationMarkReadView, UnreadNotificationListView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("unread/", UnreadNotificationListView.as_view(), name="notification-unread"),
    path("<int:pk>/mark-read/", NotificationMarkReadView.as_view(), name="notification-mark-read"),
]
