from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.http import HttpResponse
from .models import Lead, CallAttempt
from .serializers import LeadListSerializer, LeadDetailSerializer, LeadCreateSerializer, CallAttemptSerializer, LeadImportSerializer
from accounts.permissions import IsAgentOrAbove, IsManagerOrAbove
from .services import validate_status_transition, check_duplicate_phone, assign_lead_round_robin
from rest_framework.exceptions import ValidationError
import csv
import io

class LeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAgentOrAbove]
    filterset_fields = ['status', 'temperature', 'source', 'assigned_agent', 'interested_project']
    search_fields = ['full_name', 'phone_primary']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['super_admin', 'manager']:
            return Lead.objects.all()
        return Lead.objects.filter(assigned_agent=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return LeadListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LeadCreateSerializer
        return LeadDetailSerializer

    def perform_update(self, serializer):
        new_status = serializer.validated_data.get('status')
        current_status = self.get_object().status
        if new_status:
            if not validate_status_transition(current_status, new_status):
                raise ValidationError({"status": f"Invalid transition from {current_status} to {new_status}"})
        lead = serializer.save()

        # If status changed or comments provided, create communication log record
        status_comments = self.request.data.get('status_comments') or self.request.data.get('comments')
        if (new_status and new_status != current_status) or status_comments:
            comment_text = status_comments or f"Stage updated from {current_status} to {new_status or current_status}"
            CallAttempt.objects.create(
                lead=lead,
                agent=self.request.user if self.request.user.is_authenticated else None,
                outcome='connected',
                notes=f"[STAGE: {(new_status or current_status).upper()}]: {comment_text}",
                callback_scheduled_at=self.request.data.get('next_callback_at') if self.request.data.get('next_callback_at') else None,
                created_at=timezone.now()
            )

        if new_status in ['booked', 'deal_confirmed']:
            from deals.models import Deal, PaymentMilestone
            from plots.models import Plot
            import datetime
            deal = Deal.objects.filter(lead=lead).exclude(status='cancelled').first()
            is_confirmed = (new_status == 'deal_confirmed')
            if not deal:
                plot = None
                if lead.interested_project:
                    plot = Plot.objects.filter(project=lead.interested_project, status='available').first()
                if not plot:
                    plot = Plot.objects.filter(status='available').first()
                
                if plot:
                    deal_amount = plot.total_price
                    deal = Deal.objects.create(
                        lead=lead,
                        plot=plot,
                        booking_date=datetime.date.today(),
                        deal_amount=deal_amount,
                        discount=0,
                        final_amount=deal_amount,
                        status='confirmed' if is_confirmed else 'booked',
                        notes=f"Auto-created from Lead {lead.full_name}",
                        created_by=self.request.user if self.request.user.is_authenticated else None
                    )
                    plot.status = 'sold' if is_confirmed else 'reserved'
                    plot.save()

                    token_amt = round(deal_amount * 0.10)
                    down_amt = round(deal_amount * 0.25)
                    bal_amt = deal_amount - token_amt - down_amt

                    PaymentMilestone.objects.create(
                        deal=deal,
                        milestone_type='token',
                        amount=token_amt,
                        due_date=deal.booking_date,
                        paid_date=deal.booking_date,
                        is_paid=True,
                        notes='Initial Booking Token'
                    )
                    PaymentMilestone.objects.create(
                        deal=deal,
                        milestone_type='down_payment',
                        amount=down_amt,
                        due_date=deal.booking_date + datetime.timedelta(days=15),
                        paid_date=deal.booking_date if is_confirmed else None,
                        is_paid=is_confirmed,
                        notes='Agreement Down Payment'
                    )
                    PaymentMilestone.objects.create(
                        deal=deal,
                        milestone_type='full_payment',
                        amount=bal_amt,
                        due_date=deal.booking_date + datetime.timedelta(days=45),
                        paid_date=deal.booking_date if is_confirmed else None,
                        is_paid=is_confirmed,
                        notes='Registry Balance Clearance'
                    )
            else:
                deal.status = 'confirmed' if is_confirmed else 'booked'
                deal.save()
                if deal.plot:
                    deal.plot.status = 'sold' if is_confirmed else 'reserved'
                    deal.plot.save()

    @action(detail=False, methods=['get'])
    def check_duplicates(self, request):
        phone = request.query_params.get('phone')
        if not phone:
            return Response({"error": "phone parameter required"}, status=400)
        duplicates = check_duplicate_phone(phone)
        return Response(duplicates)

    @action(detail=False, methods=['get'])
    def callbacks_today(self, request):
        today = timezone.now().date()
        qs = self.get_queryset().filter(next_callback_at__date=today)
        serializer = LeadListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def assign(self, request, pk=None):
        """Assign or reassign a lead to a specific agent."""
        lead = self.get_object()
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response({"error": "agent_id required"}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            agent = User.objects.get(pk=agent_id, role='agent', is_active=True)
        except User.DoesNotExist:
            return Response({"error": "Agent not found"}, status=404)

        lead.assigned_agent = agent
        lead.save(update_fields=['assigned_agent'])
        return Response({"message": f"Lead assigned to {agent.username}"})

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser],
            permission_classes=[IsManagerOrAbove])
    def import_csv(self, request):
        """Import leads from a CSV file with duplicate detection."""
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({"error": "No file uploaded"}, status=400)

        decoded = csv_file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(decoded))

        created = []
        duplicates = []
        errors = []

        for i, row in enumerate(reader, start=2):
            phone = row.get('phone_primary', '').strip()
            if not phone:
                errors.append({"row": i, "error": "Missing phone_primary"})
                continue

            existing = check_duplicate_phone(phone)
            if existing:
                duplicates.append({"row": i, "phone": phone, "existing_leads": existing})
                continue

            try:
                lead = Lead.objects.create(
                    full_name=row.get('full_name', '').strip(),
                    phone_primary=phone,
                    phone_alternate=row.get('phone_alternate', '').strip(),
                    email=row.get('email', '').strip(),
                    whatsapp_number=row.get('whatsapp_number', '').strip(),
                    source=row.get('source', 'other').strip().lower(),
                    city=row.get('city', '').strip(),
                    budget_range=row.get('budget_range', '').strip(),
                    plot_size_preference=row.get('plot_size_preference', '').strip(),
                    notes=row.get('notes', '').strip(),
                )
                assign_lead_round_robin(lead)
                created.append(lead.id)
            except Exception as e:
                errors.append({"row": i, "error": str(e)})

        return Response({
            "created_count": len(created),
            "duplicate_count": len(duplicates),
            "error_count": len(errors),
            "duplicates": duplicates,
            "errors": errors,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsManagerOrAbove])
    def export(self, request):
        """Export leads as CSV."""
        leads = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Full Name', 'Phone Primary', 'Phone Alternate', 'Email',
            'WhatsApp', 'Source', 'City', 'Project', 'Budget Range',
            'Plot Size Preference', 'Status', 'Temperature', 'Assigned Agent',
            'Last Contacted', 'Next Callback', 'Created At'
        ])
        for lead in leads:
            writer.writerow([
                lead.id, lead.full_name, lead.phone_primary,
                lead.phone_alternate or '', lead.email or '',
                lead.whatsapp_number or '', lead.get_source_display(),
                lead.city or '',
                lead.interested_project.name if lead.interested_project else '',
                lead.budget_range or '', lead.plot_size_preference or '',
                lead.get_status_display(), lead.get_temperature_display(),
                lead.assigned_agent.username if lead.assigned_agent else '',
                lead.last_contacted_at or '', lead.next_callback_at or '',
                lead.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        return response


class CallAttemptViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAgentOrAbove]
    serializer_class = CallAttemptSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CallAttempt.objects.none()
        return CallAttempt.objects.filter(lead_id=self.kwargs.get('lead_pk'))

    def perform_create(self, serializer):
        lead = Lead.objects.get(pk=self.kwargs.get('lead_pk'))
        call = serializer.save(lead=lead, agent=self.request.user)

        # Update lead timestamps
        lead.last_contacted_at = timezone.now()
        update_fields = ['last_contacted_at']

        if call.outcome == 'callback_scheduled' and call.callback_scheduled_at:
            lead.next_callback_at = call.callback_scheduled_at
            update_fields.append('next_callback_at')

        # Auto-transition from 'new' to 'contacted' on first call
        if lead.status == 'new':
            lead.status = 'contacted'
            update_fields.append('status')

        lead.save(update_fields=update_fields)

