"""
URL configuration for studybuddy project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf.urls.static import static


 
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    path('', include('common.urls')),
    path('api/', include('Message.urls')),
    path("api/notifications/", include("Notifications.urls")),
    path('api/', include('group.urls')),
    path('api/', include('Tasks.urls')),
    # New feature routes
    path('api/', include('planner.urls')),
    path('api/', include('resources.urls')),
    path('api/', include('pomodoro.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('api/streak/', include('studytracker.urls')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

] # + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
