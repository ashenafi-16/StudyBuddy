from django.contrib import admin
from .models import StudyFile


@admin.register(StudyFile)
class StudyFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'owner', 'file_type', 'file_size_display', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['filename', 'description', 'owner__username']
    date_hierarchy = 'uploaded_at'
    ordering = ['-uploaded_at']
