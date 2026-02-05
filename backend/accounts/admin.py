from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from allauth.socialaccount.models import SocialAccount

# This allows you to see Google profile details directly inside the User page
class SocialAccountInline(admin.StackedInline):
    model = SocialAccount
    extra = 0
    readonly_fields = ('provider', 'uid', 'extra_data')
    can_delete = False

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin): # Changed to UserAdmin for better security/UI support
    model = CustomUser
    inlines = [SocialAccountInline]
    
    # Updated list_display to include 'is_social' status
    list_display = ('pk', 'email', 'is_staff', 'is_active', 'is_social')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email',)
    ordering = ('email',)

    # Custom method to check if the user is a Google/Social user
    def is_social(self, obj):
        return obj.socialaccount_set.exists()
    
    is_social.boolean = True
    is_social.short_description = 'Google User'