from rest_framework import viewsets, mixins
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserCreateSerializer, UserProfileSerializer
from .permissions import IsSuperAdmin

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agents_list(request):
    agents = User.objects.filter(is_active=True, role='agent')
    serializer = UserProfileSerializer(agents, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not current_password or not new_password or not confirm_password:
        return Response({'detail': 'Please provide current password, new password, and confirmation.'}, status=400)

    if not user.check_password(current_password):
        return Response({'detail': 'Current password does not match.'}, status=400)

    if len(new_password) < 6:
        return Response({'detail': 'New password must be at least 6 characters long.'}, status=400)

    if new_password != confirm_password:
        return Response({'detail': 'New password and confirmation do not match.'}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password changed successfully.'})

