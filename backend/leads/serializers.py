from rest_framework import serializers
from .models import Lead, CallAttempt
from accounts.serializers import UserProfileSerializer
from projects.serializers import ProjectSerializer

class CallAttemptSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()

    class Meta:
        model = CallAttempt
        fields = '__all__'
        read_only_fields = ['agent', 'created_at']

    def get_agent_name(self, obj):
        if obj.agent:
            return obj.agent.get_full_name() or obj.agent.username
        return None

class LeadListSerializer(serializers.ModelSerializer):
    assigned_agent = UserProfileSerializer(read_only=True)
    interested_project = ProjectSerializer(read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'

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
