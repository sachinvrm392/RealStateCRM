from rest_framework import viewsets
from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.permissions import IsSuperAdmin

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ['entity_type', 'entity_id', 'user', 'action']
