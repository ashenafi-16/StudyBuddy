from django.urls import path
from .views import StudyTodayView, DashboardView

urlpatterns = [
    path('study-today/', StudyTodayView.as_view()),
    path("streak_dashboard/", DashboardView.as_view()),
]