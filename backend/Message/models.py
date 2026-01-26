import os
from django.db import models
from group.models import StudyGroup
from django.conf import settings
from django.db.models import CheckConstraint, Q
from cloudinary.models import CloudinaryField

class ConversationManager(models.Manager):
    def get_or_create_individual(self, user1_id, user2_id):
        u1, u2 = sorted([user1_id, user2_id])
        key = f"{u1}:{u2}"

        conversation, created = self.get_or_create(
            private_key=key,
            defaults={'type': 'individual'}
        )

        if created:
            ConversationMember.objects.create(conversation=conversation, user_id=u1)
            ConversationMember.objects.create(conversation=conversation, user_id=u2)

        return conversation, created

class Conversation(models.Model):
    class ConversationTypes(models.TextChoices):
        GROUP = 'group', 'Group'
        INDIVIDUAL = 'individual', 'Individual'
    
    type = models.CharField(max_length=20, choices=ConversationTypes.choices)
    group = models.OneToOneField(
        StudyGroup, on_delete=models.CASCADE, null=True, blank=True, related_name='conversation'
    )
    private_key = models.CharField(max_length=100, blank=True, null=True, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ConversationManager()

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(type='group', group__isnull=False) | Q(type='individual', group__isnull=True),
                name='valid_type'
            )
        ]

    def __str__(self):
        if self.type == 'group':
            return f"Group: {self.group.group_name}" if self.group else f"Group: Unknown"
        return f"DM {self.private_key or 'Unknown'}"

    async def is_participant(self, user):
        """Check if user is a participant in this conversation (async for WebSocket consumers)."""
        from channels.db import database_sync_to_async
        from group.models import GroupMember
        
        @database_sync_to_async
        def _check():
            if self.type == 'group':
                # Check if user is a member of the group
                if not self.group:
                    return False
                return GroupMember.objects.filter(
                    group=self.group,
                    user=user,
                    is_active=True
                ).exists()
            else:
                # Check if user is a member of the conversation
                return self.members.filter(user=user).exists()
        
        return await _check()

    
class ConversationMember(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_memberships'
    )

    # for unread messages
    last_read_at = models.DateTimeField(null=True, blank=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('conversation', 'user')


class Message(models.Model):
    class MessageTypes(models.TextChoices):
        text = 'text', 'Text'
        file = 'file', 'File'
        image = 'image', 'Image'
        system = 'system', 'System'
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MessageTypes.choices, default=MessageTypes.text)
    content = models.TextField(blank=True)
    file_attachment = CloudinaryField('file', folder='chat_files', blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.BigIntegerField(blank=True, null=True)  # Size in bytes
    thumbnail = models.URLField(max_length=500, blank=True, null=True)
    is_read = models.BooleanField(default=False)

    timestamp = models.DateTimeField(auto_now_add=True)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='replies')
    
    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['conversation', 'timestamp']),
        ]
    def __str__(self):
        return f"{self.sender.email}: {self.content[:50]}"
    
    def get_file_extension(self):
        if self.file_name:  
            return os.path.splitext(self.file_name)[1].lower()
        elif self.file_attachment:
            return os.path.splitext(str(self.file_attachment))[1].lower()
        return ''

    def is_image_file(self):
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'] 
        return self.get_file_extension() in image_extensions
    

