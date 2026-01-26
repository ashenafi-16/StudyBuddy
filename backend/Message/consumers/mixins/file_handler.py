from cloudinary.uploader import upload
# from Message.utils import generate_thumbnail
from asgiref.sync import sync_to_async
import cloudinary

class FileHandlerMixin:
    async def upload_file_message(self, file_data):

        res = await sync_to_async(upload)(file_data, resource_type="auto")
        return res["secure_url"], res.get("original_filename"), res.get("bytes")

    async def upload_image_message(self, file_data):

        image = await sync_to_async(upload)(file_data, resource_type="image")
        
        public_id = image.get("public_id")
        
        thumb_url = cloudinary.CloudinaryImage(public_id).build_url(
            width=200,
            height=200,
            crop="fill",
            quality="auto",
            fetch_format="auto"
        )
        return (
            image["secure_url"],
            thumb_url,
            image.get("original_filename"),
            image.get("bytes"),
        )
