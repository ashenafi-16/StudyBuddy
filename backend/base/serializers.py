from rest_framework import serilizers
from .models import User, Topic, Room , Message

class UserSerializer(serilizers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'bio', 'avatar']

class TopicSerializer(serilizers.ModelSerializer):
    class Meta:
        model = Topic
        fields = '__all__'

class RoomSerializer(serilizers.ModelSerializer):
    host = UserSerializer(read_only=True)
    topic = TopicSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)

    topic_id = serilizers.PrimaryKeyRelatedField(
        queryset = Topic.objects.all(), source='topic', write_only=True
    )
    
    class Meta:
        model = Room
        fields = ['id', 'host', 'topic', 'topic_id', 'name', 'description', 'participants','update', 'created']

class MessageSerializer(serilizers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'user', 'room', 'body', 'update', 'created']
        