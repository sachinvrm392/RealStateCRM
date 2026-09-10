from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead
from notifications.models import Notification

class Command(BaseCommand):
    help = 'Generates callback reminder notifications for leads'

    def handle(self, *args, **options):
        now = timezone.now()
        in_15_mins = now + timedelta(minutes=15)
        leads = Lead.objects.filter(next_callback_at__range=(now, in_15_mins), assigned_agent__isnull=False)
        
        count = 0
        for lead in leads:
            notif, created = Notification.objects.get_or_create(
                recipient=lead.assigned_agent,
                notification_type='callback_reminder',
                related_lead=lead,
                title='Callback Reminder',
                message=f'Reminder to call {lead.full_name} at {lead.next_callback_at.strftime("%H:%M")}',
                defaults={'is_read': False}
            )
            if created:
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully generated {count} notifications'))
