from rest_framework import viewsets
from rest_framework.decorators import action
from .models import Deal, PaymentMilestone
from .serializers import DealSerializer, DealCreateSerializer, PaymentMilestoneSerializer
from accounts.permissions import IsManagerOrAbove

class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all().order_by('-created_at')
    permission_classes = [IsManagerOrAbove]
    filterset_fields = ['status', 'lead', 'plot']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DealCreateSerializer
        return DealSerializer

    def perform_create(self, serializer):
        deal = serializer.save(created_by=self.request.user)
        plot = deal.plot
        plot.status = 'reserved'
        plot.save()
        
        lead = deal.lead
        lead.status = 'booked'
        lead.save()

    def perform_update(self, serializer):
        old_status = self.get_object().status
        deal = serializer.save()
        if old_status != deal.status:
            plot = deal.plot
            lead = deal.lead
            if deal.status == 'confirmed':
                plot.status = 'sold'
                lead.status = 'deal_confirmed'
            elif deal.status == 'cancelled':
                plot.status = 'available'
            plot.save()
            lead.save()

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export deals as CSV."""
        from django.http import HttpResponse
        import csv
        deals = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="deals_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Deal ID', 'Lead Customer', 'Plot Number', 'Booking Date',
            'Agreed Amount', 'Discount', 'Final Amount', 'Status', 'Notes', 'Created At'
        ])
        for d in deals:
            writer.writerow([
                d.id, d.lead.full_name if d.lead else '', d.plot.plot_number if d.plot else '',
                d.booking_date, d.deal_amount, d.discount, d.final_amount,
                d.get_status_display(), d.notes or '', d.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        return response


class PaymentMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMilestoneSerializer
    permission_classes = [IsManagerOrAbove]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return PaymentMilestone.objects.none()
        return PaymentMilestone.objects.filter(deal_id=self.kwargs.get('deal_pk'))

    def perform_create(self, serializer):
        deal = Deal.objects.get(pk=self.kwargs.get('deal_pk'))
        serializer.save(deal=deal)
