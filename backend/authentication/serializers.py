from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from authentication.utils import login_response_constructor
from core.models import User
from organizations.models import Domain

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        email_name, domain_part = value.strip().rsplit('@', 1)
        domain_part = domain_part.lower()

        if not Domain.objects.filter(domain=domain_part).exists():
            raise serializers.ValidationError('The email provided does not belong to an organization')
        
        normalized_email = f'{email_name}@{domain_part}'

        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError('user with this email already exists')
        
        return normalized_email

    def create(self, validated_data):
        domain_part = validated_data['email'].split('@')[1]
        domain = Domain.objects.get(domain=domain_part)
        organization = domain.organization
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            organization=organization
        )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        response_data = login_response_constructor(user)
        return response_data