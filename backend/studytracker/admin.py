from django.contrib import admin

# Register your models here.
from .models import StudyStreak, StudyActivity, Achievement, UserAchievement

@admin.register(StudyStreak)
class StudyStreakAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_streak', 'longest_streak', 'last_active_date')
    search_fields = ('user__username',) 

@admin.register(StudyActivity)
class StudyActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'duration_minutes')
    search_fields = ('user__username',) 
    list_filter = ('date',)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'required_days')
    search_fields = ('name',)   

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'awarded_at')
    search_fields = ('user__username', 'achievement__name') 
    list_filter = ('awarded_at',)   