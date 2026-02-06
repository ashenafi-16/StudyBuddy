from django.db import models
from django.contrib.auth import get_user_model
from cloudinary.models import CloudinaryField
import uuid
from django.conf import settings
User = get_user_model()




class StudyGroup(models.Model):
    class GroupType(models.TextChoices):
        academic = 'academic', 'Academic'
        project = 'project', 'Project'
        exam_prep = 'exam_prep', 'Exam Preparation'
        study_buddy = 'study_buddy', 'Study Buddy'

    group_name = models.CharField(max_length=110)
    group_description = models.TextField(
        blank=True,
        help_text="Optional description of the group"
    )
    group_type = models.CharField(max_length=20, choices=GroupType.choices, default=GroupType.academic)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_groups'
    )
    max_members = models.PositiveIntegerField(default=10)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    profile_pic = CloudinaryField('image', blank=True, null=True)  # <-- updated
    
    invitation_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        db_table = 'study_groups'
        ordering = ['-created_at']
        unique_together = ('group_name', 'created_by')

    def __str__(self):
        return self.group_name
     
    @property
    def invitation_link(self):
        return f"{settings.FRONTEND_URL}/groups/join/{self.id}/{self.invitation_token}/"
    
    @property
    def member_count(self):
        return self.members.filter(is_active=True).count()
    
class GroupMember(models.Model):
    class MemberRoles(models.TextChoices):
        admin = 'admin', 'Admin'
        moderator = 'moderator', 'Moderator'
        member = 'member', 'Member'
        
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=10, choices=MemberRoles.choices, default=MemberRoles.member)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'group_members' 
        unique_together = ['user', 'group']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.group.group_name}"

