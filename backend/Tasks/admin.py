from django.contrib import admin
from .models import Task,StudyResource


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'assigned_to',
        'created_by',
        'group',
        'priority',
        'status',
        'due_date',
        'is_overdue_display',
        'created_at',
    )

    list_filter = (
        'priority',
        'status',
        'group',
        'assigned_to',
        'due_date',
        'created_at',
    )

    search_fields = (
        'title',
        'description',
        'assigned_to__email',
        'created_by__email',
        'group__group_name',
    )

    ordering = ('-due_date',)

    readonly_fields = ('created_at', 'updated_at', 'completed_at')

    def is_overdue_display(self, obj):
        return obj.is_overdue
    is_overdue_display.boolean = True  
    is_overdue_display.short_description = 'Overdue?'

@admin.register(StudyResource)
class StudyResourceAdmin(admin.ModelAdmin):
    # Columns to show in the admin list page
    list_display = (
        'title',
        'get_group',
        'resource_type',
        'uploaded_by',
        'formatted_file_size',
        'download_count',
        'uploaded_at',
    )

    # Filters on the right side
    list_filter = (
        'resource_type',
        'uploaded_by',
        'group',
        'uploaded_at',
    )

    # Fields that can be searched using the search bar
    search_fields = (
        'title',
        'description',
        'uploaded_by__email',
        'group__group_name',
    )

    # Default ordering for the admin page
    ordering = ('-uploaded_at',)

    # Fields you cannot modify manually in admin
    readonly_fields = ('uploaded_at', 'file_size', 'download_count')

    # --- Custom Display Methods ---

    def get_group(self, obj):
        return obj.group.group_name if obj.group else '-'
    get_group.short_description = 'Group'

    def formatted_file_size(self, obj):
        if not obj.file_size:
            return "-"
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 ** 2:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 ** 3:
            return f"{size / 1024 ** 2:.1f} MB"
        else:
            return f"{size / 1024 ** 3:.1f} GB"
    formatted_file_size.short_description = 'File Size'

    # Allow download count display to update properly
    def get_queryset(self, request):
        """Optimize queries for performance."""
        qs = super().get_queryset(request)
        return qs.select_related('uploaded_by', 'group')
