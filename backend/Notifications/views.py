from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status, pagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer, NotificationUpdateSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = pagination.PageNumberPagination

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).select_related('related_group').order_by('-created_at')

class UnreadNotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = pagination.PageNumberPagination

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user, is_read=False
        ).select_related('related_group').order_by('-created_at')

class NotificationMarkReadView(generics.UpdateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationUpdateSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        notification = self.get_object()

        if notification.user != request.user:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        notification.is_read = True
        notification.save()

        return Response({"message": "Notification marked as read."})

