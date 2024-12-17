from rest_framework import serializers
from .models import Organization, Domain, Role

class OrganizationSerializer(serializers.ModelSerializer):
    domains = serializers.ListField(
        child=serializers.CharField(max_length=255), write_only=True
    )

    class Meta:
        model = Organization
        fields = ['id', 'name', 'created_at', 'domains']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        domains = validated_data.pop('domains')
        organization = Organization.objects.create(**validated_data)
        for domain in domains:
            Domain.objects.create(domain=domain, organization=organization)
        return organization
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['domains'] = instance.domains.values_list('domain', flat=True)
        return data
    
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'permissions']
        read_only_fields = ['id']

class AssignRoleSerializer(serializers.Serializer):
    roleId = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())