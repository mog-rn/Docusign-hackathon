from rest_framework import serializers
from .models import Organization, Domain, Role
from django.db import transaction

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'created_at', 'updated_at']
        read_only_fields = ['id']

    def validate_domain(self, value):
        # Validate domain format and uniqueness
        if Domain.objects.filter(domain=value).exists():
            raise serializers.ValidationError(f"Domain '{value}' already exists")
        return value

class OrganizationSerializer(serializers.ModelSerializer):
    domains = serializers.ListField(
        child=serializers.CharField(max_length=255), 
        write_only=True
    )

    class Meta:
        model = Organization
        fields = ['id', 'name', 'created_at', 'domains', 'updated_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        # Validate organization name uniqueness
        if Organization.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"Organization with name '{value}' already exists")
        return value

    def validate_domains(self, values):
        # Check for duplicate domains in the input
        if len(values) != len(set(values)):
            raise serializers.ValidationError("Duplicate domains are not allowed")
            
        # Check if any domain already exists in the database
        existing_domains = Domain.objects.filter(domain__in=values)
        if existing_domains.exists():
            domains_list = ", ".join([d.domain for d in existing_domains])
            raise serializers.ValidationError(f"Domain(s) already exist: {domains_list}")
        
        return values

    @transaction.atomic
    def create(self, validated_data):
        try:
            domains = validated_data.pop('domains')
            
            organization = Organization.objects.create(**validated_data)
            
            domain_objects = [
                Domain(domain=domain, organization=organization)
                for domain in domains
            ]
            Domain.objects.bulk_create(domain_objects)
            
            return organization
            
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create organization: {str(e)}")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Include domains in the response
        data['domains'] = list(instance.domains.values_list('domain', flat=True))
        return data

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'permissions']
        read_only_fields = ['id']

    def validate_name(self, value):
        # Validate role name uniqueness within an organization
        organization = self.context.get('organization')
        if organization and Role.objects.filter(
            organization=organization,
            name=value
        ).exists():
            raise serializers.ValidationError(
                f"Role with name '{value}' already exists in this organization"
            )
        return value

    def validate_permissions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Permissions must be a list")
        
        # Add any specific permission validation logic here
        allowed_permissions = {"FULL_ACCESS", "READ", "WRITE", "DELETE"}  # Add your allowed permissions
        invalid_permissions = set(value) - allowed_permissions
        
        if invalid_permissions:
            raise serializers.ValidationError(
                f"Invalid permissions: {', '.join(invalid_permissions)}"
            )
        
        return value

class AssignRoleSerializer(serializers.Serializer):
    roleId = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        error_messages={
            'does_not_exist': 'Role does not exist',
            'invalid': 'Invalid role ID'
        }
    )

    def validate_roleId(self, value):
        # Validate that the role belongs to the correct organization
        organization = self.context.get('organization')
        if organization and value.organization != organization:
            raise serializers.ValidationError(
                "This role does not belong to the specified organization"
            )
        return value

    def create(self, validated_data):
        user = self.context.get('user')
        role = validated_data.get('roleId')
        organization = role.organization

        from .models import UserRole
        user_role = UserRole.objects.create(
            user=user,
            organization=organization,
            role=role
        )
        return user_role