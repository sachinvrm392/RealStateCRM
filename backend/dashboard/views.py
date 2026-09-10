from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead, CallAttempt
from deals.models import Deal
from plots.models import Plot
from audit.models import AuditLog
from accounts.permissions import IsManagerOrAbove

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def callbacks_today(request):
    user = request.user
    today = timezone.now().date()
    leads = Lead.objects.all() if user.role in ['super_admin', 'manager'] else Lead.objects.filter(assigned_agent=user)
    qs = leads.filter(next_callback_at__date=today).values(
        'id', 'full_name', 'phone_primary', 'next_callback_at', 'status', 'temperature'
    )
    return Response(list(qs))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def funnel_stats(request):
    user = request.user
    leads = Lead.objects.all() if user.role in ['super_admin', 'manager'] else Lead.objects.filter(assigned_agent=user)
    stats = leads.values('status').annotate(count=Count('id'))
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def source_breakdown(request):
    user = request.user
    leads = Lead.objects.all() if user.role in ['super_admin', 'manager'] else Lead.objects.filter(assigned_agent=user)
    stats = leads.values('source').annotate(count=Count('id'))
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def agent_performance(request):
    """Per-agent metrics: total leads, calls made, leads converted, deals closed."""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    agents = User.objects.filter(role='agent', is_active=True)
    stats = []
    for agent in agents:
        agent_leads = Lead.objects.filter(assigned_agent=agent)
        stats.append({
            'agent_id': agent.id,
            'agent_name': agent.get_full_name() or agent.username,
            'total_leads': agent_leads.count(),
            'calls_made': CallAttempt.objects.filter(agent=agent).count(),
            'conversions': agent_leads.filter(
                status__in=['booked', 'deal_confirmed']
            ).count(),
            'deals_closed': Deal.objects.filter(
                lead__assigned_agent=agent,
                status='confirmed'
            ).count(),
        })
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def temperature_distribution(request):
    user = request.user
    leads = Lead.objects.all() if user.role in ['super_admin', 'manager'] else Lead.objects.filter(assigned_agent=user)
    stats = leads.values('temperature').annotate(count=Count('id'))
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity(request):
    logs = AuditLog.objects.all().order_by('-created_at')[:20]
    data = [{'action': l.action, 'entity_type': l.entity_type, 'description': l.description, 'created_at': l.created_at} for l in logs]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def plots_summary(request):
    stats = Plot.objects.values('project__name', 'status').annotate(count=Count('id'))
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def revenue_summary(request):
    stats = Deal.objects.values('status').annotate(total_revenue=Sum('final_amount'))
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def lead_aging(request):
    now = timezone.now()
    leads = Lead.objects.exclude(status__in=['deal_confirmed', 'lost'])
    over_30 = leads.filter(updated_at__lt=now - timedelta(days=30)).count()
    over_14 = leads.filter(updated_at__lt=now - timedelta(days=14)).count()
    over_7 = leads.filter(updated_at__lt=now - timedelta(days=7)).count()
    
    return Response({
        '>30 days': over_30,
        '>14 days': over_14,
        '>7 days': over_7
    })
