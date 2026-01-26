from django.contrib import admin
from .models import StudyGroup, GroupMember


from django.utils.html import format_html

@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'group_name',
        'get_creator',  # this must match the method name exactly
        'profile_pic_tag',  # optional to show image
        'group_type',
        'max_members',
        'is_public',
        'member_count',
        'created_at',
    )

    # Make sure search_fields is here
    search_fields = ('group_name', 'group_description', 'created_by__email')

    def get_creator(self, obj):
        return obj.created_by.email if obj.created_by else '-'
    get_creator.short_description = 'Created By'

    def profile_pic_tag(self, obj):
        if obj.profile_pic:
            return format_html('<img src="{}" style="height:50px;width:50px;border-radius:50%;" />', obj.profile_pic.url)
        return '-'
    profile_pic_tag.short_description = 'Profile Picture'


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = (
        'get_user_email',
        'get_group_name',
        'role',
        'is_active',
        'joined_at',
    )
    list_filter = ('role', 'is_active', 'joined_at')
    search_fields = ('user__email', 'group__group_name')
    ordering = ('-joined_at',)
    autocomplete_fields = ('user', 'group')

    readonly_fields = ('joined_at',)

    fieldsets = (
        ('Membership Info', {
            'fields': ('user', 'group', 'role', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('joined_at',)
        }),
    )

    # Custom methods for list display
    def get_user_email(self, obj):
        return obj.user.email if obj.user else '-'
    get_user_email.short_description = 'User Email'

    def get_group_name(self, obj):
        return obj.group.group_name if obj.group else '-'
    get_group_name.short_description = 'Group Name'
