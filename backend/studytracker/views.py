from rest_framework.views import APIView
from django.db import models
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import StudyActivity, StudyStreak, UserAchievement
from .serializers import (
    StudyActivitySerializer, 
    StudyStreakSerializer, 
    UserAchievementSerializer
)
from .utils import update_streak, check_and_award

class StudyTodayView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.now().date()

        if StudyActivity.objects.filter(user=request.user, date=today).exists():
            return Response({"message": "Already studied today."}, status=400)
        
        duration = request.data.get("duration_minutes", 30)

        StudyActivity.objects.create(
            user=request.user,
            duration_minutes= duration
        )

        streak = update_streak(request.user)
        check_and_award(request.user, streak.current_streak)

        return Response({
            "message": "Study recorded", 
            "current_streak": streak.current_streak
        })
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        streak, _ = StudyStreak.objects.get_or_create(user=request.user)
        achievements = UserAchievement.objects.filter(user=request.user)
        
        # Calculate total study time
        total_time = StudyActivity.objects.filter(user=request.user).aggregate(
            total=models.Sum('duration_minutes')
        )['total'] or 0

        # Get recent activity (last 365 days)
        last_year = timezone.now().date() - timezone.timedelta(days=365)
        recent_activity = StudyActivity.objects.filter(
            user=request.user,
            date__gte=last_year
        ).order_by('date')

        return Response({
            "streak": StudyStreakSerializer(streak).data,
            "achievements": UserAchievementSerializer(achievements, many=True).data,
            "total_study_minutes": total_time,
            "recent_activity": StudyActivitySerializer(recent_activity, many=True).data
        })