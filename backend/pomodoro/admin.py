from django.contrib import admin
from .models import PomodoroSession


@admin.register(PomodoroSession)
class PomodoroSessionAdmin(admin.ModelAdmin):
    list_display = ['group', 'state', 'current_session_number', 'started_by', 'created_at']
    list_filter = ['state', 'created_at']
    search_fields = ['group__group_name', 'started_by__username']
    ordering = ['-created_at']
