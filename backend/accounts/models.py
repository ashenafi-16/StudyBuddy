from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from cloudinary.models import CloudinaryField

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email,username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email,username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email=email,username=username, password=password, **extra_fields)

class CustomUser(AbstractUser):
    class UserROles(models.TextChoices):
        student = 'student', 'Student'
        tutor  = 'tutor', 'Tutor'
        admin = 'admin', 'Admin'
    
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    profile_pic = CloudinaryField('image', folder='profile_pictures/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    role = models.CharField(max_length=10, choices=UserROles.choices, default=UserROles.student)
    created_at = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']    
    objects = CustomUserManager()

    @property
    def profile_pic_url(self):
        if self.profile_pic:
            return self.profile_pic.url
        return None

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return self.email