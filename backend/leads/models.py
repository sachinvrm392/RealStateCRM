from django.db import models
from django.conf import settings
from projects.models import Project

class Lead(models.Model):
    SOURCE_CHOICES = (
        ('facebook', 'Facebook'),
        ('whatsapp', 'WhatsApp'),
        ('referral', 'Referral'),
        ('walkin', 'Walk-in'),
        ('website', 'Website'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('interested', 'Interested'),
        ('site_visit_scheduled', 'Site Visit Scheduled'),
        ('site_visit_done', 'Site Visit Done'),
        ('negotiation', 'Negotiation'),
        ('booked', 'Booked'),
        ('deal_confirmed', 'Deal Confirmed'),
        ('lost', 'Lost'),
    )
    TEMP_CHOICES = (
        ('hot', 'Hot'),
        ('warm', 'Warm'),
        ('cold', 'Cold'),
        ('unqualified', 'Unqualified'),
    )

    full_name = models.CharField(max_length=255)
    phone_primary = models.CharField(max_length=20, db_index=True)
    phone_alternate = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    whatsapp_number = models.CharField(max_length=20, blank=True, null=True)

    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    city = models.CharField(max_length=100, blank=True, null=True)
    interested_project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    budget_range = models.CharField(max_length=100, blank=True, null=True)
    plot_size_preference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True)

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='new')
    temperature = models.CharField(max_length=20, choices=TEMP_CHOICES, default='unqualified')
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'agent'}, related_name='assigned_leads'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    next_callback_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.phone_primary})"


class CallAttempt(models.Model):
    OUTCOME_CHOICES = (
        ('connected', 'Connected'),
        ('no_answer', 'No Answer'),
        ('busy', 'Busy'),
        ('switched_off', 'Switched Off'),
        ('wrong_number', 'Wrong Number'),
        ('callback_scheduled', 'Callback Scheduled'),
        ('not_interested', 'Not Interested'),
    )

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='call_attempts')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    outcome = models.CharField(max_length=50, choices=OUTCOME_CHOICES)
    notes = models.TextField(blank=True)
    callback_scheduled_at = models.DateTimeField(null=True, blank=True)
    recording_file = models.FileField(upload_to='recordings/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Call for {self.lead.full_name} - {self.outcome}"
