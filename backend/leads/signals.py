from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lead, CallAttempt
from .services import assign_lead_round_robin

@receiver(post_save, sender=Lead)
def auto_assign_lead(sender, instance, created, **kwargs):
    if created and not instance.assigned_agent:
        assign_lead_round_robin(instance)

@receiver(post_save, sender=CallAttempt)
def update_lead_on_call(sender, instance, created, **kwargs):
    if created:
        lead = instance.lead
        lead.last_contacted_at = instance.created_at
        if instance.callback_scheduled_at:
            lead.next_callback_at = instance.callback_scheduled_at
        lead.save(update_fields=['last_contacted_at', 'next_callback_at'])
