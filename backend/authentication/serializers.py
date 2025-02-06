from datetime import timedelta

from authentication.models import Invitation
from django.utils import timezone  # Changed this import
from organizations.models import Organization, Role, UserRole
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the TokenObtainPairSerializer to include organization ID in claims.
    """

    @classmethod
    def get_token(cls, user):
        """
        Generates a JWT that includes the user's organization ID in claims.
        """
        token = super().get_token(user)
        organization = user.organization
        organization_id = None
        if organization:
            organization_id = str(organization.id)
        token["organization_id"] = organization_id
        return token


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["id", "email", "organization", "role", "created_at", "expires_at"]
        read_only_fields = ["id", "created_at", "expires_at"]

    def validate(self, attrs):

        email = attrs.get("email")
        organization = attrs.get("organization")
        role = attrs.get("role")

        if not email:
            raise serializers.ValidationError({"email": "Email is required"})
        if not organization:
            raise serializers.ValidationError(
                {"organization": "Organization is required"}
            )
        if not role:
            raise serializers.ValidationError({"role": "Role is required"})

        existing_invitation = Invitation.objects.filter(
            email=email, organization=organization
        ).first()

        if existing_invitation:
            if (
                not existing_invitation.accepted
                and existing_invitation.expires_at > timezone.now()
            ):
                existing_invitation.role = role
                existing_invitation.expires_at = timezone.now() + timedelta(days=7)
                existing_invitation.save()

                raise serializers.ValidationError(
                    {
                        "detail": "An invitation already exists for this user",
                        "invitation_id": str(existing_invitation.id),
                        "status": "updated",
                    }
                )
            elif existing_invitation.accepted:
                raise serializers.ValidationError(
                    {
                        "detail": "This user has already accepted an invitation to this organization"
                    }
                )
            else:
                existing_invitation.delete()

        try:
            user = User.objects.get(email=email)
            if UserRole.objects.filter(user=user, organization=organization).exists():
                raise serializers.ValidationError(
                    {"detail": "User is already a member of this organization"}
                )
        except User.DoesNotExist:
            pass

        try:
            Organization.objects.get(id=organization.id)
        except Organization.DoesNotExist:
            raise serializers.ValidationError(
                {"organization": "Invalid organization ID"}
            )

        try:
            Role.objects.get(id=role.id, organization=organization)
        except Role.DoesNotExist:
            raise serializers.ValidationError(
                {"role": "Invalid role ID or role does not belong to the organization"}
            )

        return attrs

    def create(self, validated_data):
        Invitation.objects.filter(
            email=validated_data["email"],
            organization=validated_data["organization"],
            expires_at__lte=timezone.now(),
        ).delete()

        validated_data["expires_at"] = timezone.now() + timedelta(days=7)
        validated_data["invited_by"] = self.context["request"].user
        return super().create(validated_data)
