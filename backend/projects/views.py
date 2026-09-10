from rest_framework import viewsets
from .models import Project
from .serializers import ProjectSerializer
from accounts.permissions import IsManagerOrAbove, IsAgentOrAbove

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAbove()]
        return [IsAgentOrAbove()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
