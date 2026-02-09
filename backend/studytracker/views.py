from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StudyActivity
from .serializers import StudyActivitySerializer

class LogStudySessionView(APIView):
    def post(self, request):
        serializer = StudyActivitySerializer(data=request.data)
        if serializer.is_valid():
            # Saving this automatically triggers the signal!
            serializer.save(user=request.user)
            return Response({
                "message": "Activity logged. Streak updated automatically!"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)