from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .utils import record_activity_and_update_streak
from .models import StudyStreak, StudyActivity, UserAchievement
from .serializers import StudyActivitySerializer, StudyStreakSerializer, UserAchievementSerializer
from django.utils import timezone
from datetime import timedelta
from common.throttles import HeartbeatRateThrottle
from django.core.cache import cache
from django.conf import settings

class ActivityHeartbeatView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [HeartbeatRateThrottle]

    def post(self, request):
        # Every time this is called, we add 1 minute to the user's daily total
        record_activity_and_update_streak(request.user, duration=1)
        
        # Invalidate cached dashboard/heatmap for this user
        cache.delete(f'heatmap_{request.user.id}')
        cache.delete(f'streak_dashboard_{request.user.id}')

        # Return the updated status so the UI can update the progress bar/color
        streak_stats = StudyStreak.objects.filter(user=request.user).first()
        
        return Response({
            "status": "active",
            "current_streak": streak_stats.current_streak if streak_stats else 0,
            "is_active_today": streak_stats.last_active_date == timezone.now().date() if streak_stats else False
        })
    
class HeatmapDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f'heatmap_{request.user.id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        one_year_ago = timezone.now().date() - timedelta(days=365)
        activities = request.user.study_activities.filter(date__gte=one_year_ago)
        
        # Logic: Backend sends the 'level' directly to frontend
        data = [{
            "date": activity.date,
            "minutes": activity.duration_minutes,
            "level": activity.activity_level  # Uses the @property from your Model
        } for activity in activities]
        
        cache.set(cache_key, data, settings.CACHE_TTL_MEDIUM)
        return Response(data)

class StreakDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        cache_key = f'streak_dashboard_{user.id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        
        # 1. Streak Data
        streak, _ = StudyStreak.objects.get_or_create(user=user)
        streak_serializer = StudyStreakSerializer(streak)
        
        # 2. Achievements (Recent ones)
        achievements = UserAchievement.objects.filter(user=user).select_related('achievement').order_by('-awarded_at')
        achievement_serializer = UserAchievementSerializer(achievements, many=True)
        
        # 3. Recent Activity (Last 365 days for the graph)
        one_year_ago = timezone.now().date() - timedelta(days=365)
        activities = StudyActivity.objects.filter(user=user, date__gte=one_year_ago).order_by('date')
        activity_serializer = StudyActivitySerializer(activities, many=True)
        
        # 4. Total Study Time
        total_minutes = StudyActivity.objects.filter(user=user).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        response_data = {
            "streak": streak_serializer.data,
            "achievements": achievement_serializer.data,
            "recent_activity": activity_serializer.data,
            "total_study_minutes": total_minutes
        }

        cache.set(cache_key, response_data, settings.CACHE_TTL_MEDIUM)
        return Response(response_data)