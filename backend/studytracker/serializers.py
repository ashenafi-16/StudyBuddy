from rest_framework import serializers
from .models import StudyActivity, StudyStreak, UserAchievement


class StudyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyActivity
        fields = ['id', 'date', 'duration_minutes']


class StudyStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyStreak
        fields = ['current_streak', 'longest_streak']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement_name = serializers.CharField(source='achievement.name')

    class Meta:
        model = UserAchievement
        fields = ['achievement_name', 'awarded_at']
