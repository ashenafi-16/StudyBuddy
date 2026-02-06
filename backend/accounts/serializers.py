from .models import CustomUser
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from .tasks import send_welcome_email_task
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
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
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'profile_pic','profile_pic_url', 'bio', 'full_name', 'groups_joined', 'role']
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
        fields = ('id', 'email', 'username', 'full_name', 'profile_pic', 'profile_pic_url', 'role')

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password do not match."})
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value

    
class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password], write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        try: 
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist): 
            raise serializers.ValidationError({'token': "Invalid user ID."})
        
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'Invalid or expired token.'})
        
        attrs['user'] = user
        return attrs
    
    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user