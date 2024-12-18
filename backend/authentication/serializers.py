from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from authentication.utils import login_response_constructor
from core.models import User
from organizations.models import Domain

from rest_framework import serializers
from core.models import User
from organizations.models import Domain, Role, UserRole


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
        default_role, _ = Role.objects.get_or_create(
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