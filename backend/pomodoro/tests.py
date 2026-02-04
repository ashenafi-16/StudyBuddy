from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from group.models import StudyGroup, GroupMember
from .models import PomodoroSession

User = get_user_model()

class PomodoroAccessTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='password123')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='password123')
        
        # Public group
        self.public_group = StudyGroup.objects.create(
            group_name='Public Group',
            created_by=self.user1,
            is_public=True
        )
        GroupMember.objects.create(user=self.user1, group=self.public_group, role='admin')
        
        # Private group
        self.private_group = StudyGroup.objects.create(
            group_name='Private Group',
            created_by=self.user1,
            is_public=False
        )
        GroupMember.objects.create(user=self.user1, group=self.private_group, role='admin')

    def test_public_group_access_non_member(self):
        """Non-members should be able to fetch sessions for public groups."""
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f'/api/pomodoro/by_group/?group_id={self.public_group.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(PomodoroSession.objects.filter(group=self.public_group).exists())

    def test_private_group_access_non_member(self):
        """Non-members should NOT be able to fetch sessions for private groups."""
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f'/api/pomodoro/by_group/?group_id={self.private_group.id}')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Session shouldn't be created if forbidden
        self.assertFalse(PomodoroSession.objects.filter(group=self.private_group).exists())

    def test_private_group_access_member(self):
        """Members should be able to fetch sessions for private groups."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/pomodoro/by_group/?group_id={self.private_group.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(PomodoroSession.objects.filter(group=self.private_group).exists())

    def test_start_timer_restriction_other_group(self):
        """A user should not be able to start a timer if they have an active one elsewhere."""
        # Start timer in public group for user1
        self.client.force_authenticate(user=self.user1)
        session1, _ = PomodoroSession.objects.get_or_create(group=self.public_group)
        self.client.post(f'/api/pomodoro/{session1.id}/start/')
        
        # Try to start timer in private group (user1 is also member/admin there)
        session2, _ = PomodoroSession.objects.get_or_create(group=self.private_group)
        response = self.client.post(f'/api/pomodoro/{session2.id}/start/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('active Pomodoro session in another group', response.data['error'])
