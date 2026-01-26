from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import (
    Q, Count, Case,F,
    When, IntegerField, 
    Value, BooleanField,
    ExpressionWrapper, DurationField
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
import logging
from django.db.models.functions import Now

from .models import Task, StudyResource,StudySession
from .serializers import (
    TaskBasicSerializer, 
    TaskCreateSerializer, 
    TaskDetailSerializer, 
    TaskUpdateSerializer,
    StudyResourceCreateSerializer,
    StudyResourceSerializer,
    StudyResourceDownloadSerializer,
    StudySessionCreateSerializer,
    StudySessionSerializer,
    StudySessionDetailSerializer
    
)
from Notifications.models import Notification
from group.models import StudyGroup
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


logger = logging.getLogger(__name__)


class StudySessionViewSet(viewsets.ModelViewSet):
    queryset = StudySession.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return StudySession.objects.filter(
            user=user
        ).select_related("group").order_by("-start_time")

    def get_serializer_class(self):
        if self.action == "create":
            return StudySessionCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return StudySessionCreateSerializer
        elif self.action == "retrieve":
            return StudySessionDetailSerializer
        return StudySessionSerializer

    def perform_create(self, serializer):
        start_time = timezone.now()
        serializer.save(user=self.request.user, start_time=start_time)

    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """ Stop session and calculate duration """
        session = self.get_object()

        if session.end_time:
            return Response({"error": "Session already ended"}, status=status.HTTP_400_BAD_REQUEST)

        session.end_time = timezone.now()
        session.save()

        serializer = self.get_serializer(session)
        return Response({
            "message": "Session ended successfully",
            "session": serializer.data
        })

    @action(detail=False, methods=['get'])
    def active(self, request):
        """ Get current active session (if any) """
        session = StudySession.objects.filter(
            user=request.user, end_time__isnull=True
        ).first()

        if not session:
            return Response({"active_session": None})

        serializer = self.get_serializer(session)
        return Response({"active_session": serializer.data})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """ Dashboard analytics: total hours studied, streak, etc. """
        user = request.user
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        sessions = StudySession.objects.filter(user=user)

        stats = {
            "total_sessions": sessions.count(),
            "total_minutes": sessions.aggregate(
                total=Sum("duration")
            )["total"] or 0,
            "weekly_minutes": sessions.filter(start_time__gte=week_ago).aggregate(
                total=Sum("duration")
            )["total"] or 0,
            "active_sessions": sessions.filter(end_time__isnull=True).count(),
        }
        return Response(stats)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    CACHE_TIMEOUT = 300

    def get_serializer_class(self): 
        serializer_map = {
            'create': TaskCreateSerializer,
            'update': TaskUpdateSerializer,
            'partial_update': TaskUpdateSerializer,
            'list': TaskBasicSerializer,
            'retrieve': TaskDetailSerializer,
            'my_tasks': TaskDetailSerializer,
            'overdue': TaskBasicSerializer,
            'upcoming': TaskBasicSerializer,
            'team_tasks': TaskBasicSerializer,
        }
        return serializer_map.get(self.action, TaskDetailSerializer)
    def get_queryset(self):
 
        user = self.request.user
        
        queryset = Task.objects.select_related(
            'assigned_to', 
            'group', 
            'created_by'
        ).filter(
            Q(assigned_to=user) |
            Q(group__members__user=user, group__members__is_active=True) |
            Q(created_by=user) 
        ).distinct()  
        
        

        queryset = queryset.annotate(
            is_overdue_calculated=Case(
            When(
                due_date__lt=timezone.now(), 
                status__in=['pending', 'in_progress'],
                then=Value(True)
            ),
            default=Value(False),
            output_field=BooleanField()
            ),
            days_until_due=Case(
                When(
                    due_date__isnull=False,
                    then=ExpressionWrapper(
                        F('due_date') - Now(),
                        output_field=DurationField()
                    )
                ),
                default=Value(None),
                output_field=DurationField()
    )
        )

        return queryset
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            'request': self.request,
            'user': self.request.user,

        })
        print(context)
        return context
    def perform_create(self, serializer):
        try:
            task = serializer.save(created_by=self.request.user)
            self._create_task_notification(
                user=task.assigned_to,
                task=task,
                notification_type='task_assigned',
                message=f"New task assigned: {task.title}"
            )
            logger.info(f"Task '{task.title}' created by {self.request.user}")
        except Exception as e:
            logger.error(f"Task creation failed: {str(e)}")
            raise

    def perform_update(self, serializer):
        old_task = self.get_object()
        new_task = serializer.save()
        
        if old_task.assigned_to != new_task.assigned_to:
            # Notify NEW assignee
            self._create_task_notification(
                user=new_task.assigned_to,
                notification_type='task_assigned',
                message=f"Task assigned to you: {new_task.title}"
            )
            # Notify OLD assignee (if exists)
            if old_task.assigned_to:
                self._create_task_notification(
                    user=old_task.assigned_to,
                    notification_type='task_unassigned', 
                    message=f"Task unassigned from you: {new_task.title}"
                )

        if old_task.status != 'completed' and new_task.status == 'completed':
            self._create_task_notification(
                user=new_task.created_by,
                task=new_task,
                notification_type='task_completed',
                message=f'Task completed: {new_task.title}'
            )
    def list(self, request, *args, **kwargs):
        cache_key = f"user_tasks_{request.user.id}_{request.query_params.urlencode()}"

        cached_response = cache.get(cache_key)

        if cached_response: 
            return Response(cached_response)
        
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
        
            cache.set(cache_key, response.data, self.CACHE_TIMEOUT)
            return response
        serializer = self.get_serializer(queryset, many=True)
        response = Response(serializer.data)
        
        cache.set(cache_key, serializer.data, self.CACHE_TIMEOUT)
        return response
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        task = self.get_object()
        print(task, " the new task is -----")
        if task.assigned_to != request.user and task.created_by != request.user:
            return Response(
                {
                    "error": "You don't have permission to complete this task."
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
        if task.status == 'completed':
            return Response(
               { "error": "Task is already completed."},
               status=status.HTTP_400_BAD_REQUEST
            )
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()

        if task.created_by and task.created_by != request.user:
            self._create_task_notification(
                user=task.created_by,
                task=task,
                notification_type = 'task_completed',
                message=f"Task completed: {task.title}"
            )
        logger.info(f"Task '{task.title}' marked complete by {request.user}")
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_in_progress(self, request, pk=None):
        task = self.get_object()

        if task.assigned_to != request.user:
            return Response(
                {
                    "error": "You can only update your own tasks."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        task.status = "in_progress"
        task.save()

        serializer = self.get_serializer(task)
        return Response
    
    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        task = self.get_object()

        new_assignee_id = request.data.get('assigned_to')
        if not self._can_reassign_task(task, request.user):
            return Response(
                {
                    "error": "You don't have permission to reassign this task."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            new_assignee = User.objects.get(id=new_assignee_id)
            if not task.group.members.filter(user=new_assignee, is_active=True).exists():
                return Response({
                    "error": "New assignee must be a member of the group."
                },
                status=status.HTTP_400_BAD_REQUEST)
            old_assignee = task.assigned_to
            print("======== ", new_assignee, old_assignee)
            task.assigned_to = new_assignee
            task.save()

            self._create_task_notification(
                user=new_assignee,
                task=task,
                notification_type='task_assigned',
                message=f"Task assigned to you: {task.title}"
            )
            if old_assignee:
                self._create_task_notification(
                    user=old_assignee,
                    task=task,
                    notification_type='task_unassigned',
                    message=f'Task unassigned: {task.title}'
                )
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({
                "error": "User not found"
            },
            status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')
        group_filter = request.query_params.get('group')
        due_date_filter = request.query_params.get('due_date')

        tasks = Task.objects.filter(assigned_to=request.user)

        if status_filter:
            tasks = tasks.filter(status=status_filter)
        if priority_filter:
            tasks = tasks.filter(priority=priority_filter)
        if group_filter:
            tasks = tasks.filter(group_id=group_filter)
        if due_date_filter:
            if due_date_filter == 'today':
                tasks = tasks.filter(due_date__date=timezone.now().date())
            elif due_date_filter == 'week':
                tasks = tasks.filter(
                    due_date__date__range=[
                        timezone.now().date(),
                        timezone.now().date() + timedelta(days=7)
                    ]
                )
            elif due_date_filter == 'overdue':
                tasks = tasks.filter(due_date__lt=timezone.now())
        
        tasks = tasks.order_by('due_date', 'priority')
        serializer = self.get_serializer(tasks, many=True)

        response_data = {
            'tasks': serializer.data,
            'summary': {
                'total': tasks.count(),
                'completed': tasks.filter(status='completed').count(),
                'pending': tasks.filter(status='pending').count(),
                'in_progress': tasks.filter(status='in_progress').count(),
                'overdue': tasks.filter(
                    due_date__lt=timezone.now(), 
                    status__in=['pending', 'in_progress']
                ).count()
            }
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        overdue_tasks = Task.objects.filter(
            assigned_to=request.user,
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).order_by('priority', 'due_date')
        
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        upcoming_tasks = Task.objects.filter(
            assigned_to=request.user,
            due_date__range=[
                timezone.now(),
                timezone.now() + timedelta(days=7)
            ],
            status__in=['pending', 'in_progress']
        ).order_by('due_date', 'priority')
        
        serializer = self.get_serializer(upcoming_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def team_tasks(self, request):
        team_tasks = Task.objects.filter(
            group__members__user=request.user,
            group__members__is_active=True
        ).exclude(assigned_to=request.user).distinct()
        
        serializer = self.get_serializer(team_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        user_tasks = Task.objects.filter(assigned_to=request.user)
        
        stats = {
            'total_tasks': user_tasks.count(),
            'completed_tasks': user_tasks.filter(status='completed').count(),
            'in_progress_tasks': user_tasks.filter(status='in_progress').count(),
            'pending_tasks': user_tasks.filter(status='pending').count(),
            'overdue_tasks': user_tasks.filter(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress']
            ).count(),
            'completion_rate': round(
                (user_tasks.filter(status='completed').count() / 
                 max(user_tasks.count(), 1)) * 100, 2
            ) if user_tasks.exists() else 0
        }
        
        return Response(stats)

    def _create_task_notification(self, user, task, notification_type, message):
        try:
            Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=f"Task Update: {task.title}",
                message=message,
                related_group=task.group,
            )
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")

    def _can_reassign_task(self, task, user):
        return (task.created_by == user or 
                (task.group and task.group.members.filter(user=user, role='admin').exists()))

class StudyResourceViewSet(viewsets.ModelViewSet):
    queryset = StudyResource.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['resource_type', 'group']
    search_fields = ['title', 'description']
    ordering_fields = ['uploaded_at', 'download_count', 'file_size']

    ordering = ['-uploaded_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return StudyResourceCreateSerializer
        elif self.action == 'download':
            return StudyResourceDownloadSerializer
        else:
            return StudyResourceSerializer
        
    def get_queryset(self):
        user = self.request.user
        return StudyResource.objects.filter(
            group__members__user=user,
            group__members__is_active=True
        ).select_related('uploaded_by', 'group').distinct()
    
    def perform_create(self, serializer):
        resource = serializer.save(uploaded_by=self.request.user)
        self._notify_group_members(resource)
        logger.info(f"Study resource '{resource.title}' uploaded by {self.request.user}")

    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        resource = self.get_object()
        resource.download_count += 1
        resource.save()

        logger.info(f"Resource '{resource.title}' downloaded by {request.user}")
        
        serializer = self.get_serializer(resource)
        return Response({
            "message": 'Download recorded', 
            'resource': serializer.data,
            'download_url': request.build_absolute_uri(resource.file.url)
        })
    
    @action(detail=False, methods=['get'])
    def my_uploads(self, request):
        my_resources = StudyResource.objects.filter(
            uploaded_by=request.user
        ).order_by('-uploaded_at')
         
        serializer = self.get_serializer(my_resources, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_resources = StudyResource.objects.filter(
            group__members__user=request.user,
            group__members__is_active=True
        ).order_by('-download_count')[:10]

        serializer = self.get_serializer(popular_resources, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        resource_by_type = StudyResource.objects.filter(
            group__members__user=request.user,
            group__members__is_active=True
        ).values('resource_type').annotate(
            count=Count('id'),
            total_downloads=Coalesce(Sum('download_count'), 0)
        ).order_by('resource_type')
   
        return Response(resource_by_type)
    
    def _notify_group_members(self, resource):
        try:
            group_members = resource.group.members.filter(
                is_active = True
            ).exclude(user=resource.uploaded_by)
            
            notifications = []
            for member in group_members:
                notifications.append(
                    Notification(
                        user = member.user,
                        notification_type='resource_uploaded', 
                        title=f"New Study Resource in {resource.group.group_name}",
                        message=f"{resource.uploaded_by.full_name or resource.uploaded_by.email} uploaded: {resource.title}",
                        related_group = resource.group
                    )
                )
                if notifications:
                    Notification.objects.bulk_create(notifications)
        
        except Exception as e:
            logger.error(f"Failed to create resource notifications: {str(e)}")
        
    
        
