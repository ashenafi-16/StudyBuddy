from django.urls import path
from . import dashboard
urlpatterns = [
    path('dashboard/', dashboard.user_dashboard, name='user-dashboard'),
    path('dashboard/analytics/', dashboard.user_activity_analytics, name='user-analytics'),
    path('dashboard/live-updates/', dashboard.live_updates, name='live-updates'),
    path('search/', dashboard.global_search, name='global-search'),
]