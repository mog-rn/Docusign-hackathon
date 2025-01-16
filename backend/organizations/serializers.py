from rest_framework import serializers

from core.models import User
from .models import Organization, Role
from django.db import transaction


class OrganizationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Organization
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at']


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
    
class UpdatePermissionsSerializer(serializers.ModelSerializer):
    permissions = serializers.ListField(
        child=serializers.CharField(max_length=100)
    )

    class Meta:
        model = Role
        fields = ['permissions']
        read_only_fields = ['id', 'name']


class OrganizationMemberSerializer(serializers.ModelSerializer):
    role = serializers.CharField()
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_organization_admin', 'created_at']