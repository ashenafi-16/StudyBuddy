from django.contrib import admin
from .models import StudySession


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'host', 'participant', 'start_time', 'status']
    list_filter = ['status', 'subject', 'start_time']
    search_fields = ['title', 'subject', 'host__username', 'participant__username']
    date_hierarchy = 'start_time'
    ordering = ['-start_time']
