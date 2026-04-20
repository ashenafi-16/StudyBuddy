from rest_framework import serializers
from .models import StudyActivity, StudyStreak, UserAchievement


class StudyActivitySerializer(serializers.ModelSerializer):
    level = serializers.ReadOnlyField(source='activity_level')
    class Meta:
        model = StudyActivity
        fields = ['id', 'date', 'duration_minutes', 'level']

class StudyStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyStreak
        fields = ['current_streak', 'longest_streak']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement_name = serializers.CharField(source='achievement.name')
    icon_name = serializers.CharField(source='achievement.icon_name')
    required_days = serializers.IntegerField(source='achievement.required_days')
    description = serializers.CharField(source='achievement.description')

    class Meta:
        model = UserAchievement
        fields = ['achievement_name', 'icon_name', 'required_days', 'description', 'awarded_at']
