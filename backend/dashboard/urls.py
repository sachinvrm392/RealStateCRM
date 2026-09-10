from django.urls import path
from .views import (
    funnel_stats, source_breakdown, agent_performance, temperature_distribution,
    recent_activity, plots_summary, revenue_summary, lead_aging, callbacks_today
)

urlpatterns = [
    path('funnel/', funnel_stats, name='funnel-stats'),
    path('callbacks/', callbacks_today, name='dashboard-callbacks'),
    path('source/', source_breakdown, name='source-breakdown'),
    path('sources/', source_breakdown, name='sources-breakdown'),
    path('agent-performance/', agent_performance, name='agent-performance'),
    path('temperature/', temperature_distribution, name='temperature-distribution'),
    path('activity/', recent_activity, name='activity-feed'),
    path('recent-activity/', recent_activity, name='recent-activity'),
    path('plots-summary/', plots_summary, name='plots-summary'),
    path('revenue/', revenue_summary, name='revenue-summary-alias'),
    path('revenue-summary/', revenue_summary, name='revenue-summary'),
    path('aging/', lead_aging, name='lead-aging-alias'),
    path('lead-aging/', lead_aging, name='lead-aging'),
]
