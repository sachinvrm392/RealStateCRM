from rest_framework import serializers
from .models import Plot

class PlotSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Plot
        fields = '__all__'
