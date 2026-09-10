from django.contrib.auth import get_user_model
from django.db.models import Count
from .models import Lead

User = get_user_model()

def assign_lead_round_robin(lead):
    agents = User.objects.filter(role='agent', is_active=True).annotate(
        active_leads_count=Count('assigned_leads')
    ).order_by('active_leads_count')
    
    if agents.exists():
        lead.assigned_agent = agents.first()
        lead.save(update_fields=['assigned_agent'])
        return lead.assigned_agent
    return None

def check_duplicate_phone(phone_number):
    return list(Lead.objects.filter(phone_primary=phone_number).values('id', 'full_name', 'status', 'assigned_agent__username'))

def validate_status_transition(current_status, new_status):
    allowed_transitions = {
        'new': ['contacted', 'lost'],
        'contacted': ['interested', 'lost'],
        'interested': ['site_visit_scheduled', 'lost'],
        'site_visit_scheduled': ['site_visit_done', 'lost'],
        'site_visit_done': ['negotiation', 'lost'],
        'negotiation': ['booked', 'lost'],
        'booked': ['deal_confirmed', 'lost'],
        'lost': ['new'],
    }
    if new_status == current_status:
        return True
    return new_status in allowed_transitions.get(current_status, [])
