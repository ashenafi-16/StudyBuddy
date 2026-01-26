from django.core.cache import cache
from django.db.models import Count, Max, Q
from django.utils.decorators import method_decorator
from rest_framework import status, permissions
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
from Message.models import Message
from rest_framework.decorators import api_view, permission_classes
from Tasks.models import Task, StudyResource
from accounts.models import CustomUser
from group.models import StudyGroup
from .serializers import UserDashboardSerilizer
from Notifications.models import Notification
from accounts.serializers import UserProfileSerializer
from group.serializers import StudyGroupListSerializer
from Tasks.serializers import StudyResourceSerializer
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@cache_page(60 * 2)  # Cache for 2 minutes
def user_dashboard(request):
    try:
        user = request.user
        
        dashboard_data = UserDashboardSerilizer(user, context={'request': request})
        return Response(dashboard_data.data)
        
    except Exception as e:
        return Response(
            {"error": "Unable to load dashboard data"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_activity_analytics(request):
    try:
        user = request.user
        week_ago = timezone.now() - timedelta(days=7)

        activity_data = {
            'messages_sent': Message.objects.filter(
                sender=user, timestamp__gte=week_ago
            ).count(),
            'tasks_completed': Task.objects.filter(
                assigned_to=user, status='completed', completed_at__gte=week_ago
            ).count(),
            'files_uploaded': StudyResource.objects.filter(
                uploaded_by=user, uploaded_at__gte=week_ago
            ).count(),
            'groups_joined': user.group_memberships.filter(is_active=True).count(),
        }

        last_activities = []
        for model, filters in [
            (Message, {'sender': user}),
            (Task, {'assigned_to': user}),
            (StudyResource, {'uploaded_by': user}),
        ]:
            order_field = (
                '-timestamp' if hasattr(model, 'timestamp')
                else '-uploaded_at' if hasattr(model, 'uploaded_at')
                else None
            )
            if order_field:
                last_obj = model.objects.filter(**filters).order_by(order_field).first()
                if last_obj:
                    last_time = getattr(last_obj, 'timestamp', None) or getattr(last_obj, 'uploaded_at', None)
                    if last_time:
                        last_activities.append(last_time)
        activity_data['last_active'] = max(last_activities) if last_activities else user.last_login
        activity_data['user_id'] = getattr(user, 'user_id', user.id)
        activity_data['full_name'] = user.get_full_name() if hasattr(user, 'get_full_name') else user.full_name

        return Response(activity_data)

    except Exception as e:
        return Response(
            {"error": "Unable to load analytics", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def live_updates(request):
    try:
        user = request.user
        now = timezone.now()

        user_group_ids = user.group_memberships.values_list('group_id', flat=True)
        updates = {
            'unread_messages': Message.objects.filter(
                group_id__in=user_group_ids, is_read=False
            ).exclude(sender=user).count(),

            'pending_tasks': Task.objects.filter(
                assigned_to=user, status__in=['pending', 'in_progress']
            ).count(),

            'recent_notifications': Notification.objects.filter(
                user=user, created_at__gte=now - timedelta(hours=24)
            ).count(),

            # # Friends active in the last 5 minutes
            # # 'online_friends': CustomUser.objects.filter(
            # #     friends=user, last_seen__gte=now - timedelta(minutes=5)
            # # ).count(),
            # 'online_users': CustomUser.objects.filter(
            #     last_seen__gte=now - timedelta(minutes=5)
            # ).exclude(id=user.id).count(),

            # # Current server time
            'timestamp': now.isoformat()
        }

        return Response([updates])

    except Exception as e:
        return Response(
            {"error": "Unable to fetch live updates", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def global_search(request):
    try:
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')
        limit = int(request.query_params.get('limit', 10))
        
        if not query or len(query) < 2:
            return Response(
                {"error": "Query parameter 'q' with at least 2 characters is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = {}
        user = request.user
        
        if search_type in ['all', 'users']:
            users = CustomUser.objects.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(username__icontains=query)
            ).exclude(id=user.id)[:limit] 
            
            results['users'] = {
                'count': users.count(),
                'results': UserProfileSerializer(users, many=True).data
            }
        
        if search_type in ['all', 'groups']:
            groups = StudyGroup.objects.filter(
                Q(group_name__icontains=query) |
                Q(group_description__icontains=query),
                Q(is_public=True) | Q(members__user=user, members__is_active=True)
            ).distinct()[:limit]
            
            results['groups'] = {
                'count': groups.count(),
                'results': StudyGroupListSerializer(groups, many=True, context={'request': request}).data
            }
        
        if search_type in ['all', 'resources']:
            resources = StudyResource.objects.filter(
                Q(title__icontains=query) | 
                Q(description__icontains=query),
                Q(group__members__user=user, group__members__is_active=True) |
                Q(is_public=True)
            ).distinct()[:limit]
            
            results['resources'] = {
                'count': resources.count(),
                'results': StudyResourceSerializer(resources, many=True).data
            }
        
        results['metadata'] = {
            'query': query,
            'total_results': sum(category['count'] for category in results.values()),
            'search_type': search_type,
            'timestamp': timezone.now().isoformat()
        }
        
        return Response(results)
        
    except Exception as e:
        return Response(
            {"error": "Search failed"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )