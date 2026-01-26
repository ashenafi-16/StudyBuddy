from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'notification_type',
        'title',
        'is_read',
        'created_at',
    )
    list_filter = (
        'notification_type',
        'is_read',
        'created_at',
    )
    search_fields = (
        'title',
        'message',
        'user__email',
    )
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    fieldsets = (
        ("Notification Details", {
            'fields': (
                'notification_type',
                'title',
                'message',
            )
        }),
        ("User & Related Group", {
            'fields': (
                'user',
                'related_group',
            )
        }),
        ("Status & Metadata", {
            'fields': (
                'is_read',
                'created_at',
            )
        }),
    )
