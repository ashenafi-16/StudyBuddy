from rest_framework import serializers
from .models import Message, Conversation, ConversationMember
from group.models import GroupMember
from accounts.serializers import UserBasicSerializer
from PIL import Image as PILImage
from io import BytesIO
import cloudinary.uploader 
from urllib.parse import unquote



class ConversationListSerializer(serializers.ModelSerializer):
    unread_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    group_name = serializers.CharField(source='group.group_name', read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id', 'type', 'group', 'group_name',
            'unread_count', 'members', 'updated_at'
        ]

    def get_unread_count(self, obj):
        user = self.context['request'].user
        # unread messages in this conversation for the user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_members(self, obj):
        users = [m.user for m in obj.members.select_related('user').all()]
        return UserBasicSerializer(users, many=True).data

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    sender_name = serializers.SerializerMethodField()
    file_info = serializers.SerializerMethodField()
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)
    
    file_attachment = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'conversation_id', 'sender', 'sender_name',
            'message_type', 'content', 'file_attachment',  # Use custom field
            'timestamp', 'is_edited', 'edited_at', 'reply_to', 'file_info', 'is_read'
        ]
        read_only_fields = ('id', 'timestamp', 'sender')

    def get_sender_name(self, obj):
        return getattr(obj.sender, 'full_name', None) or obj.sender.email
    
    def get_file_attachment(self, obj):
        if not obj.file_attachment:
            return None
        
        # Get the file value
        file_value = str(obj.file_attachment)
        
        # Check if it's already a full URL
        if file_value.startswith('http://') or file_value.startswith('https://'):
            return file_value
        
        # It's a public_id, build the full Cloudinary URL
        import cloudinary.utils
        
        try:
            # Use cloudinary_url to build the full URL from public_id
            url, options = cloudinary.utils.cloudinary_url(file_value)
            print(f"✅ Built Cloudinary URL from '{file_value}' -> '{url}'")
            return url
        except Exception as e:
            print(f"❌ Error building Cloudinary URL for '{file_value}': {e}")
            # Fallback: return the raw value
            return file_value

    def get_file_info(self, obj):
        if not obj.file_attachment:
            return None

        # Get the full URL
        file_url = self.get_file_attachment(obj)
        return {
            'name': obj.file_name or 'file',
            'url': file_url,
            'size': obj.file_size or 0
        }



class MessageCreateSerializer(serializers.ModelSerializer):
    sender = serializers.HiddenField(default=serializers.CurrentUserDefault())
    conversation_id = serializers.IntegerField(required=False)
    recipient_id = serializers.IntegerField(required=False)
    file_upload = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Message
        fields = (
            'id', 'conversation_id', 'recipient_id', 'sender',
            'message_type', 'content', 'file_attachment', 'reply_to',
            'timestamp', 'file_upload'
        )
        read_only_fields = ('id', 'timestamp', 'file_attachment')

    def validate(self, data):
        user = self.context['request'].user
        conversation_id = data.get('conversation_id')
        recipient_id = data.get('recipient_id')

        if not conversation_id and not recipient_id:
            raise serializers.ValidationError("Either conversation_id or recipient_id is required.")
        if conversation_id and recipient_id:
            raise serializers.ValidationError("Provide either conversation_id or recipient_id, not both.")

        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                raise serializers.ValidationError("Conversation does not exist.")

            if conversation.type == Conversation.ConversationTypes.GROUP:
                if not GroupMember.objects.filter(user=user, group=conversation.group, is_active=True).exists():
                    raise serializers.ValidationError("You are not a member of this group.")
            else:
                if not conversation.members.filter(user=user).exists():
                    raise serializers.ValidationError("You are not a participant in this conversation.")

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        conversation_id = validated_data.pop('conversation_id', None)
        recipient_id = validated_data.pop('recipient_id', None)
        file_upload = validated_data.pop('file_upload', None)

        if conversation_id:
            conversation = Conversation.objects.get(id=conversation_id)
        else:
            conversation, _ = Conversation.objects.get_or_create_individual(user.id, recipient_id)

        validated_data['conversation'] = conversation

        if file_upload:
            is_image = file_upload.content_type.startswith('image')
            resource_type = "image" if is_image else "auto"

            try:
                upload_result = cloudinary.uploader.upload(
                    file_upload,
                    resource_type="auto",
                    folder="chat_files"
                )

                validated_data['file_attachment'] = upload_result.get('secure_url')
                validated_data['file_name'] = getattr(file_upload, 'name', None)
                validated_data['file_size'] = getattr(file_upload, 'size', None)

                if is_image:
                    image = PILImage.open(file_upload)
                    image.thumbnail((200, 200))
                    thumb_io = BytesIO()
                    image_format = image.format or 'JPEG'
                    image.save(thumb_io, format=image_format)
                    thumb_upload = cloudinary.uploader.upload(
                        thumb_io.getvalue(),
                        resource_type="image",
                        folder="chat_thumbnails"
                    )
                    validated_data['thumbnail'] = thumb_upload.get('secure_url')
            except Exception as e:
                raise serializers.ValidationError(f"File upload failed: {str(e)}")

        return super().create(validated_data)



class MessageBasicSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    reply_to_info = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'sender', 'message_type', 'content',
            'file_attachment', 'reply_to', 'reply_to_info',
            'timestamp', 'is_edited'
        )

    def get_reply_to_info(self, obj):
        reply = obj.reply_to
        if not reply:
            return None
        return {
            'message_id': reply.id,
            'sender': getattr(reply.sender, 'full_name', None) or reply.sender.email,
            'content': (reply.content[:50] + '...') if len(reply.content) > 50 else reply.content
        }


class GroupConversationSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.group_name', read_only=True)
    group_profile_pic = serializers.SerializerMethodField()
    total_members = serializers.SerializerMethodField()
    unread_count = serializers.IntegerField(read_only=True)
    last_message_time = serializers.DateTimeField(read_only=True)  # <--- add this

    class Meta:
        model = Conversation
        fields = (
            'id',
            'group',  # ID of the StudyGroup
            'group_name',
            'group_profile_pic',
            'total_members',
            'unread_count',
            'last_message_time',  # <--- keep it here
        )

    def get_group_profile_pic(self, obj):
        if obj.group and obj.group.profile_pic:
            return obj.group.profile_pic.url
        return None

    def get_total_members(self, obj):
        if obj.group:
            return obj.group.members.filter(is_active=True).count()
        return 0

