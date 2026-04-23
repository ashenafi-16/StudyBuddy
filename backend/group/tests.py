from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import StudyGroup, GroupMember

from django.test import override_settings

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class GroupAnalyticsTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@test.com',
            username='owner',
            password='password123'
        )
        self.member = User.objects.create_user(
            email='member@test.com',
            username='member',
            password='password123'
        )
        self.non_member = User.objects.create_user(
            email='nonmember@test.com',
            username='nonmember',
            password='password123'
        )
        
        self.group = StudyGroup.objects.create(
            group_name='Test Group',
            created_by=self.owner
        )
        
        # Owner is automatically a member in perform_create, but here we create manually
        GroupMember.objects.create(user=self.owner, group=self.group)
        GroupMember.objects.create(user=self.member, group=self.group)
        
        self.analytics_url = reverse('studygroup-analytics', kwargs={'pk': self.group.pk})

    def test_owner_can_access_analytics(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['group_id'], self.group.id)

    def test_member_cannot_access_analytics(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "Only the group creator can access analytics.")

    def test_non_member_cannot_access_analytics(self):
        self.client.force_authenticate(user=self.non_member)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Note: Depending on retrieve logic, it might be "You are not a member of this private group." if the group is private
    def test_owner_leaves_with_other_members_transfers_ownership(self):
        self.client.force_authenticate(user=self.owner)
        leave_url = reverse('studygroup-leave', kwargs={'pk': self.group.pk})
        response = self.client.post(leave_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh group from DB
        self.group.refresh_from_db()
        
        # Ownership should have transferred to the member
        self.assertEqual(self.group.created_by, self.member)
        
        # Original owner should no longer be an active member
        self.assertFalse(GroupMember.objects.filter(user=self.owner, group=self.group, is_active=True).exists())

    def test_owner_leaves_as_only_member_deletes_group(self):
        # Create a group with only one member (the owner)
        solo_owner = User.objects.create_user(
            email='solo@test.com',
            username='solo',
            password='password123'
        )
        solo_group = StudyGroup.objects.create(
            group_name='Solo Group',
            created_by=solo_owner
        )
        GroupMember.objects.create(user=solo_owner, group=solo_group)
        
        self.client.force_authenticate(user=solo_owner)
        leave_url = reverse('studygroup-leave', kwargs={'pk': solo_group.pk})
        response = self.client.post(leave_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Group deleted as you were the last member.")
        
        # Group should be deleted
        self.assertFalse(StudyGroup.objects.filter(id=solo_group.id).exists())

    def test_normal_member_leaves_does_not_transfer_ownership(self):
        self.client.force_authenticate(user=self.member)
        leave_url = reverse('studygroup-leave', kwargs={'pk': self.group.pk})
        response = self.client.post(leave_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh group from DB
        self.group.refresh_from_db()
        
        # Owner should still be the same
        self.assertEqual(self.group.created_by, self.owner)
        
        # Member should no longer be an active member
        self.assertFalse(GroupMember.objects.filter(user=self.member, group=self.group, is_active=True).exists())
