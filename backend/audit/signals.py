from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from leads.models import Lead
from deals.models import Deal
from plots.models import Plot
from .services import create_audit_log

@receiver(pre_save, sender=Lead)
def capture_lead_old_values(sender, instance, **kwargs):
    if instance.pk:
        old_obj = Lead.objects.filter(pk=instance.pk).first()
        if old_obj:
            instance._old_status = old_obj.status
            instance._old_agent_id = old_obj.assigned_agent_id

@receiver(post_save, sender=Lead)
def audit_lead_changes(sender, instance, created, **kwargs):
    if created:
        create_audit_log('create', 'Lead', instance.id, f"Created Lead {instance.full_name}")
    else:
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            create_audit_log(
                'status_change', 'Lead', instance.id,
                f"Status changed from {old_status} to {instance.status}",
                old_value={'status': old_status},
                new_value={'status': instance.status}
            )
        old_agent = getattr(instance, '_old_agent_id', None)
        if old_agent != instance.assigned_agent_id:
            create_audit_log(
                'assignment', 'Lead', instance.id,
                "Agent assigned/reassigned",
                old_value={'assigned_agent_id': old_agent},
                new_value={'assigned_agent_id': instance.assigned_agent_id}
            )

@receiver(post_save, sender=Deal)
def audit_deal_changes(sender, instance, created, **kwargs):
    if created:
        create_audit_log('create', 'Deal', instance.id, f"Created Deal {instance.id}")
    else:
        create_audit_log('update', 'Deal', instance.id, f"Updated Deal {instance.id}")

@receiver(post_save, sender=Plot)
def audit_plot_changes(sender, instance, created, **kwargs):
    if not created:
        create_audit_log('update', 'Plot', instance.id, f"Updated Plot {instance.plot_number}")
