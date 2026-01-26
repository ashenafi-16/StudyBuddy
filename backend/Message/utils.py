from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from .models import Conversation, Message
import cloudinary

User = get_user_model()


def decode_jwt(token: str):
    """Extract user from JWT token using access token."""
    try:
        access = AccessToken(token)
        return User.objects.get(id=access["user_id"])
    except Exception:
        return None


def is_user_in_conversation(user, conversation_id):
    """Check if the user is a member of the conversation."""
    return Conversation.objects.filter(
        id=conversation_id,
        members__user=user
    ).exists()


def create_message(conversation, sender, data: dict):
    """
    Create a message safely, storing file metadata only for file/image messages.
    """
    message_type = data.get("message_type", "text")

    # Initialize file fields
    file_attachment = None
    file_name = None
    file_size = None
    thumbnail = None

    if message_type in ["file", "image"]:
        file_attachment = data.get("file_attachment")
        file_name = data.get("file_name")
        file_size = data.get("file_size")
        thumbnail = data.get("thumbnail")

    return Message.objects.create(
        conversation=conversation,
        sender=sender,
        message_type=message_type,
        content=data.get("content", ""),
        file_attachment=file_attachment,
        file_name=file_name,
        file_size=file_size,
        thumbnail=thumbnail,
        reply_to_id=data.get("reply_to"),
    )


# def generate_thumbnail(image_url: str, size=(200, 200)) -> str:

#     # generate cloudinary thumbnail URL
#     return cloudinary.CloudinaryImage(public_id).build_url(
#         width=size[0],
#         height=size[1], 
#         crop="fill",
#         gravity="face",
#         quality="auto",
#         fetch_format="auto"
#     )
#     # """
#     # Generate a Cloudinary thumbnail URL using transformations.
#     # Returns a URL string with width/height applied.
#     # """
#     # # Example using Cloudinary URL transformation
#     # return f"{image_url}?w={size[0]}&h={size[1]}&c=fill"
