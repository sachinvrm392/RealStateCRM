from django.db import models
from django.conf import settings
from leads.models import Lead
from plots.models import Plot

class Deal(models.Model):
    STATUS_CHOICES = (
        ('booked', 'Booked'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    )

    lead = models.ForeignKey(Lead, on_delete=models.PROTECT, related_name='deals')
    plot = models.ForeignKey(Plot, on_delete=models.PROTECT, related_name='deals')
    booking_date = models.DateField()
    deal_amount = models.DecimalField(max_digits=14, decimal_places=2)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['plot'],
                condition=~models.Q(status='cancelled'),
                name='unique_active_deal_per_plot'
            )
        ]

    def __str__(self):
        return f"Deal {self.id} - {self.lead.full_name} for Plot {self.plot.plot_number}"


class PaymentMilestone(models.Model):
    MILESTONE_CHOICES = (
        ('token', 'Token'),
        ('down_payment', 'Down Payment'),
        ('full_payment', 'Full Payment'),
    )

    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='milestones')
    milestone_type = models.CharField(max_length=30, choices=MILESTONE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_milestone_type_display()} for Deal {self.deal_id}"
