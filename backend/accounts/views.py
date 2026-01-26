from rest_framework import viewsets, status, permissions, generics
from .models import CustomUser
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import RegisterSerializer, UserProfileSerializer
from django.db.models import Q
from .serializers import UserBasicSerializer, LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken


def get_token_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),

    }

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        elif self.action in ['update', 'partial_update']:
            return UserProfileSerializer
        return UserProfileSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
        
    def get_queryset(self):
        if self.action == 'list':
            return CustomUser.objects.all()
        return CustomUser.objects.all()
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Default update is disabled. Use /api/auth/update_profile/"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    # not write update because by default viewset update field you can override it
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        data = request.data.copy()
        if 'profile_pic' in request.FILES:
            if request.user.profile_pic:
                from cloudinary.uploader import destroy
                public_id = request.user.profile_pic.public_id
                if public_id:
                    destroy(public_id)

            data['profile_pic'] = request.FILES['profile_pic']

        elif 'profile_pic' in data and data['profile_pic'] in ['', 'null', None]:
            if request.user.profile_pic:
                from cloudinary.uploader import destroy
                public_id = request.user.profile_pic.public_id
                if public_id:
                    destroy(public_id)
            data['profile_pic'] = None
        
        serializer = UserProfileSerializer(
            request.user, 
            data = data,
            partial = True, 
            context = {'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', "")
        if not query:
            return Response([])
        users = CustomUser.objects.filter(
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query) | 
            Q(email__icontains=query)
        )[:10]
        serializer = UserBasicSerializer(users, many=True)
        return Response(serializer.data)
    
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        serilizer = self.get_serializer(data=request.data)
        serilizer.is_valid(raise_exception=True)
        user = serilizer.validated_data['user']
        tokens = get_token_for_user(user)

        return Response({
            "user": UserProfileSerializer(user).data,
            "tokens": tokens
        })

        