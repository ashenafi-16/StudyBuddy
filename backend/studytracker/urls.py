from django.urls import path
from .views import ActivityHeartbeatView, HeatmapDataView, StreakDashboardView

urlpatterns = [
    path("activity/heartbeat/", ActivityHeartbeatView.as_view(), name="activity-heartbeat"),
    path("activity/heatmap/", HeatmapDataView.as_view(), name="activity-heatmap"),
    path("streak_dashboard/", StreakDashboardView.as_view(), name="streak-dashboard"),
]
