from rest_framework import viewsets
from rest_framework.decorators import action
from django.http import HttpResponse
from .models import Plot
from .serializers import PlotSerializer
from accounts.permissions import IsManagerOrAbove, IsAgentOrAbove
import csv

class PlotViewSet(viewsets.ModelViewSet):
    queryset = Plot.objects.all().order_by('id')
    serializer_class = PlotSerializer
    filterset_fields = ['project', 'status', 'plot_type', 'facing']
    search_fields = ['plot_number', 'block_sector']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'export']:
            return [IsManagerOrAbove()]
        return [IsAgentOrAbove()]

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export plots as CSV."""
        plots = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="plots_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Project', 'Plot Number', 'Block/Phase', 'Area (Sqft)',
            'Plot Type', 'Facing', 'Price Per Sqft', 'Total Price', 'Status',
            'Dimensions', 'Floor Level', 'Amenities'
        ])
        for p in plots:
            writer.writerow([
                p.id, p.project.name if p.project else '', p.plot_number,
                p.block_sector or '', p.area_sqft, p.get_plot_type_display(),
                p.get_facing_display() if p.facing else '', p.price_per_sqft or '',
                p.total_price, p.get_status_display(), p.dimensions or '',
                p.floor_level or '', p.amenities or ''
            ])
        return response

