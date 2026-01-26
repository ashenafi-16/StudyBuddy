from django.contrib import admin
from .models import Conversation, ConversationMember, Message


# -------------------------
#  ConversationMember Inline
# -------------------------

class ConversationMemberInline(admin.TabularInline):
    model = ConversationMember
    extra = 0
    readonly_fields = ('joined_at', 'last_read_at')
    ordering = ('user__email',)


# -------------------------
#  Message Inline
# -------------------------

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = (
        'sender',
        'content',
        'message_type',
        'timestamp',
        'file_attachment',
        'file_name',
        'file_size',
        'is_read',
        'is_edited',
        'edited_at',
        'reply_to',
    )
    ordering = ('timestamp',)


# -------------------------
#  Conversation Admin
# -------------------------

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'group', 'private_key', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('private_key', 'group__group_name')
    inlines = [ConversationMemberInline, MessageInline]
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ("Conversation Information", {
            "fields": ("type", "group", "private_key")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        })
    )


# -------------------------
#  ConversationMember Admin
# -------------------------

@admin.register(ConversationMember)
class ConversationMemberAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'user', 'joined_at', 'last_read_at')
    search_fields = ('user__email', 'conversation__private_key', 'conversation__group__group_name')
    list_filter = ('joined_at',)
    readonly_fields = ('joined_at',)


# -------------------------
#  Message Admin
# -------------------------

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'conversation',
        'sender',
        'message_type',
        'short_content',
        'timestamp',
        'is_read',
        'is_edited',
    )
    list_filter = ('message_type', 'is_read', 'is_edited')
    search_fields = ('content', 'sender__email')
    ordering = ('-timestamp',)
    readonly_fields = (
        'timestamp',
        'edited_at',
    )

    fieldsets = (
        ("Message Info", {
            "fields": ("conversation", "sender", "message_type", "content")
        }),
        ("Attachments", {
            "fields": ("file_attachment", "file_name", "file_size", "thumbnail")
        }),
        ("Reply & Status", {
            "fields": ("reply_to", "is_read", "is_edited", "edited_at")
        }),
        ("Timestamps", {
            "fields": ("timestamp",)
        }),
    )

    def short_content(self, obj):
        return (obj.content[:40] + "...") if len(obj.content) > 40 else obj.content

    short_content.short_description = "Content"


