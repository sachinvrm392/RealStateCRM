from rest_framework import serializers
from .models import Deal, PaymentMilestone
from plots.models import Plot
from leads.models import Lead

class PaymentMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMilestone
        fields = '__all__'

class DealSerializer(serializers.ModelSerializer):
    milestones = PaymentMilestoneSerializer(many=True, read_only=True)
    lead_name = serializers.CharField(source='lead.full_name', read_only=True)
    plot_number = serializers.CharField(source='plot.plot_number', read_only=True)

    class Meta:
        model = Deal
        fields = '__all__'

class DealCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deal
        fields = '__all__'

    def validate(self, data):
        plot = data.get('plot')
        if plot and plot.status != 'available':
            raise serializers.ValidationError("Plot is not available for booking.")
        return data
