from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'agent'),
            phone=validated_data.get('phone', '')
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone']

class AgentSerializer(serializers.ModelSerializer):
    leads_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'leads_count', 'date_joined']
        read_only_fields = ['role', 'date_joined']

    def get_leads_count(self, obj):
        return obj.assigned_leads.count()

class AgentLeadItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    phone_primary = serializers.CharField()
    city = serializers.CharField(allow_blank=True, required=False)
    budget_range = serializers.CharField(allow_blank=True, required=False)
    status = serializers.CharField()
    temperature = serializers.CharField()
    created_at = serializers.DateTimeField()

class AgentDetailSerializer(serializers.ModelSerializer):
    leads_count = serializers.SerializerMethodField()
    assigned_leads = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'leads_count', 'assigned_leads', 'date_joined']
        read_only_fields = ['role', 'date_joined']

    def get_leads_count(self, obj):
        return obj.assigned_leads.count()

    def get_assigned_leads(self, obj):
        from leads.models import Lead
        leads = obj.assigned_leads.all()
        return [
            {
                'id': l.id,
                'full_name': l.full_name,
                'phone_primary': l.phone_primary,
                'city': l.city or '',
                'budget_range': l.budget_range or '',
                'status': l.status,
                'temperature': l.temperature,
                'created_at': l.created_at
            }
            for l in leads
        ]
