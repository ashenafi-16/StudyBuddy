from django.db import models
from django.contrib.auth import get_user_model
from cloudinary.models import CloudinaryField
from django.core.exceptions import ValidationError
from group.models import StudyGroup
User = get_user_model()


class StudyFile(models.Model):
    # Model for storing shared study materials.
    
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
    
    group = models.ForeignKey(
        StudyGroup,
        on_delete=models.CASCADE,
        related_name='files',
        null=True,
        blank=True
    )
    
    
    # Metadata
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'study_files'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['group']),
            models.Index(fields=['uploaded_at']),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=['group', 'filename'],
                name='unique_filename_per_group'
            )
        ]

    def __str__(self):
        return f"{self.filename} by {self.group.group_name if self.group else 'Unknown'}"
    
    # auto process on save
    def save(self, *args, **kwargs):
        if self.file:
            # auto filename
            if not self.filename:
                self.filename = self.file.name.split('/')[-1]
            
            # auto file size
            if hasattr(self.file, 'size'):
                self.file_size = self.file.size

            # auto detect type
            self.file_type = self.detect_file_type(self.filename)
        super().save(*args, **kwargs)

    # validation
    def clean(self):
        max_size = 20 * 1024 * 1024  # 20 MB

        if self.file and hasattr(self.file, "size"):
            if self.file.size > max_size:
                raise ValidationError("File size must be under 20MB.")
            
    @property
    def file_url(self):
        # Get the Cloudinary URL for the file.
        if self.file:
            url = self.file.url
            # Fix: non-image files (PDF, docs, etc.) need raw/upload instead of image/upload
            if self.file_type in (self.FileType.PDF, self.FileType.DOCUMENT, 
                                   self.FileType.PRESENTATION, self.FileType.SPREADSHEET,
                                   self.FileType.OTHER):
                url = url.replace('/image/upload/', '/raw/upload/')
            return url
        return None

    @property
    def file_size_display(self):
        # Returns human-readable file size.
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    @classmethod
    def detect_file_type(cls, filename):
        # Detect file type from filename extension.
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
