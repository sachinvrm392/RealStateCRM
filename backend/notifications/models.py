from django.db import models
from django.conf import settings
from leads.models import Lead
from deals.models import Deal

class Notification(models.Model):
    TYPE_CHOICES = (
        ('callback_reminder', 'Callback Reminder'),
        ('lead_assigned', 'Lead Assigned'),
        ('lead_status_change', 'Lead Status Change'),
        ('deal_update', 'Deal Update'),
        ('system', 'System'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True, blank=True)
    related_deal = models.ForeignKey(Deal, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} for {self.recipient.username}"
