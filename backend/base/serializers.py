from rest_framework import serializers
from .models import User, Topic, Room , Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'name', 'email', 'password']

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    topic = TopicSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)

    topic_id = serializers.PrimaryKeyRelatedField(
        queryset = Topic.objects.all(), source='topic', write_only=True
    )
    
    class Meta:
        model = Room
        fields = ['id', 'host', 'topic', 'topic_id', 'name', 'description', 'participants','updated', 'created']

class MessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'user', 'room', 'body', 'updated', 'created']
    

class UserProfile(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar', 'bio', 'username']