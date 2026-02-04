from django.db import models
from django.contrib.auth import get_user_model
from cloudinary.models import CloudinaryField

User = get_user_model()


class StudyFile(models.Model):
    """Model for storing shared study materials."""
    
    class FileType(models.TextChoices):
        PDF = 'pdf', 'PDF Document'
        IMAGE = 'image', 'Image'
        DOCUMENT = 'document', 'Document'
        PRESENTATION = 'presentation', 'Presentation'
        SPREADSHEET = 'spreadsheet', 'Spreadsheet'
        OTHER = 'other', 'Other'

    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='owned_files'
    )
    file = CloudinaryField(
        'file', 
        resource_type='auto',
        folder='study_materials/'
    )
    filename = models.CharField(max_length=255)
    file_type = models.CharField(
        max_length=20, 
        choices=FileType.choices, 
        default=FileType.OTHER
    )
    file_size = models.BigIntegerField(default=0)  # Size in bytes
    description = models.TextField(blank=True)
    
    # Sharing
    shared_with = models.ManyToManyField(
        User, 
        blank=True, 
        related_name='shared_files'
    )
    is_public = models.BooleanField(default=False)
    
    # Metadata
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'study_files'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.filename} by {self.owner.username}"

    @property
    def file_url(self):
        """Get the Cloudinary URL for the file."""
        if self.file:
            return self.file.url
        return None

    @property
    def file_size_display(self):
        """Return human-readable file size."""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    @classmethod
    def detect_file_type(cls, filename):
        """Detect file type from filename extension."""
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        
        type_mapping = {
            'pdf': cls.FileType.PDF,
            'png': cls.FileType.IMAGE,
            'jpg': cls.FileType.IMAGE,
            'jpeg': cls.FileType.IMAGE,
            'gif': cls.FileType.IMAGE,
            'webp': cls.FileType.IMAGE,
            'doc': cls.FileType.DOCUMENT,
            'docx': cls.FileType.DOCUMENT,
            'txt': cls.FileType.DOCUMENT,
            'ppt': cls.FileType.PRESENTATION,
            'pptx': cls.FileType.PRESENTATION,
            'xls': cls.FileType.SPREADSHEET,
            'xlsx': cls.FileType.SPREADSHEET,
            'csv': cls.FileType.SPREADSHEET,
        }
        
        return type_mapping.get(ext, cls.FileType.OTHER)
