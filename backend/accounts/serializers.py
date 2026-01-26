from .models import CustomUser
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from .tasks import send_welcome_email_task
from django.conf import settings
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role', 'username']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        send_welcome_email_task.delay(user.email, user.username, settings.CLIENT_URL)
        return user
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        data['user'] = user
        return data
    
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    groups_joined = serializers.SerializerMethodField()
    profile_pic_url = serializers.ReadOnlyField(source='profile_pic.url')

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_pic','profile_pic_url', 'bio', 'full_name', 'groups_joined', 'role']
    def get_groups_joined(self, obj):
        return obj.group_memberships.filter(is_active=True).count()
    
    def update(self, instance, validated_data):
        profile_pic = validated_data.get('profile_pic')
        
        if 'profile_pic' in validated_data and profile_pic is None:
            if instance.profile_pic:
                instance.profile_pic.delete()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    profile_pic_url = serializers.ReadOnlyField(source='profile_pic.url')  # Add this

    
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile_pic', 'profile_pic_url', 'role')