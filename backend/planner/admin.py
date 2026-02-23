from django.contrib import admin
from .models import StudySession


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'study_group', 'host', 'participant', 'start_time', 'status']
    list_filter = ['status', 'study_group', 'start_time']
    search_fields = ['title', 'study_group__group_name', 'host__username', 'participant__username']
    date_hierarchy = 'start_time'
    ordering = ['-start_time']

