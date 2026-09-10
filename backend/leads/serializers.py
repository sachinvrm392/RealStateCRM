from rest_framework import serializers
from .models import Lead, CallAttempt
from accounts.serializers import UserProfileSerializer
from projects.serializers import ProjectSerializer

class CallAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallAttempt
        fields = '__all__'
        read_only_fields = ['agent', 'created_at']

class LeadListSerializer(serializers.ModelSerializer):
    assigned_agent = UserProfileSerializer(read_only=True)
    interested_project = ProjectSerializer(read_only=True)
    
    class Meta:
        model = Lead
        fields = ['id', 'full_name', 'phone_primary', 'source', 'status', 'temperature', 'assigned_agent', 'interested_project', 'created_at']

class LeadDetailSerializer(serializers.ModelSerializer):
    assigned_agent = UserProfileSerializer(read_only=True)
    interested_project = ProjectSerializer(read_only=True)
    call_attempts = CallAttemptSerializer(many=True, read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'

class LeadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class LeadImportSerializer(serializers.Serializer):
    file = serializers.FileField()
