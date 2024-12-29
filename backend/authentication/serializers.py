from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from datetime import timedelta
from django.utils import timezone  # Changed this import
from authentication.models import Invitation
from authentication.utils import login_response_constructor
from core.models import User
from organizations.models import Domain, Organization, Role, UserRole


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration, including assigning a default role in the organization.
    """
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        """
        Validate the email to ensure it belongs to a valid organization domain.
        """
        email_name, domain_part = value.strip().rsplit('@', 1)
        domain_part = domain_part.lower()

        # Check if domain exists
        if not Domain.objects.filter(domain=domain_part).exists():
            raise serializers.ValidationError('The email provided does not belong to a valid organization.')

        # Normalize the email
        normalized_email = f'{email_name}@{domain_part}'

        # Check if email is already registered
        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError('A user with this email already exists.')

        return normalized_email

    def create(self, validated_data):
        """
        Create the user and assign them to an organization with a default role.
        """
        email_name, domain_part = validated_data['email'].strip().rsplit('@', 1)

        # Fetch the domain and associated organization
        domain = Domain.objects.get(domain=domain_part)
        organization = domain.organization

        # Create the user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            organization=organization
        )

        # Assign a default role to the user
        default_role, created = Role.objects.get_or_create(
            name="user", 
            organization=organization
        )

        # Create the user-role association
        UserRole.objects.create(
            user=user,
            organization=organization,
            role=default_role
        )

        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        response_data = login_response_constructor(user)
        return response_data
    
class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['id', 'email', 'organization', 'role', 'created_at', 'expires_at']
        read_only_fields = ['id', 'created_at', 'expires_at']

    def validate(self, attrs):
        print("Received data for validation:", attrs)  # Debug print
        
        email = attrs.get('email')
        organization = attrs.get('organization')
        role = attrs.get('role')

        if not email:
            raise serializers.ValidationError({"email": "Email is required"})
        if not organization:
            raise serializers.ValidationError({"organization": "Organization is required"})
        if not role:
            raise serializers.ValidationError({"role": "Role is required"})

        # Validate organization exists
        try:
            Organization.objects.get(id=organization.id)
        except Organization.DoesNotExist:
            raise serializers.ValidationError({"organization": "Invalid organization ID"})

        # Validate role exists and belongs to organization
        try:
            role = Role.objects.get(id=role.id, organization=organization)
        except Role.DoesNotExist:
            raise serializers.ValidationError({"role": "Invalid role ID or role does not belong to the organization"})

        return attrs

    def create(self, validated_data):
        validated_data['expires_at'] = timezone.now() + timedelta(days=7)
        validated_data['invited_by'] = self.context['request'].user
        return super().create(validated_data)