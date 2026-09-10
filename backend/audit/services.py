from .models import AuditLog
from .middleware import get_current_user, get_current_ip

def create_audit_log(action, entity_type, entity_id, description="", old_value=None, new_value=None):
    AuditLog.objects.create(
        user=get_current_user(),
        ip_address=get_current_ip(),
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_value=old_value,
        new_value=new_value,
        description=description
    )
