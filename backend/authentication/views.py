from authentication.models import Invitation
from authentication.serializers import InvitationSerializer
from authentication.utils import login_response_constructor, send_invitation_email
from core.permissions import IsOrganizationAdmin
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import UserSerializer


class RegisterView(generics.CreateAPIView):
    """
    Register a new user and return the access and refresh tokens.
    """

    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # logging in new user and return tokens as success response
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            token_pair = {"access": access_token, "refresh": refresh_token}

            return Response(token_pair, status=status.HTTP_201_CREATED)
        else:
            errors = serializer.errors
            email_errors = errors.get("email", None)

            if email_errors:
                if "user with this email already exists." in email_errors:
                    return Response(serializer.errors, status=status.HTTP_409_CONFLICT)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InviteUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = InvitationSerializer

    def create(self, request, *args, **kwargs):
        # Add organization ID from URL to request data
        mutable_data = request.data.copy()
        mutable_data["organization"] = kwargs.get("organizationId")

        serializer = self.get_serializer(data=mutable_data)
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)  # Debug print
            return Response(
                {"message": "Invalid data provided", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invitation = serializer.save()
            invitation_url = f"{settings.FRONTEND_URL}/register?token={invitation.id}"

            try:
                send_invitation_email(invitation, invitation_url)
                invitation.email_sent = True
                invitation.save(update_fields=["email_sent"])

                return Response(
                    {
                        "message": "Invitation sent successfully!",
                        "email_sent": True,
                        "invitation": {
                            "id": str(invitation.id),
                            "email": invitation.email,
                            "organization": str(invitation.organization.id),
                            "role": str(invitation.role.id),
                            "expires_at": invitation.expires_at,
                            "invitation_url": invitation_url,
                        },
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                print(f"Email sending failed: {str(e)}")
                invitation.email_sent = False
                invitation.save(update_fields=["email_sent"])

                return Response(
                    {
                        "message": "Invitation created but email failed to send",
                        "email_sent": False,
                        "error": str(e),
                        "invitation": serializer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except serializers.ValidationError as e:
            if (
                isinstance(e.detail, dict)
                and "status" in e.detail
                and e.detail["status"] == "updated"
            ):
                return Response(
                    {
                        "message": e.detail["detail"],
                        "invitation_id": e.detail["invitation_id"],
                    },
                    status=status.HTTP_200_OK,
                )
            raise

        except Exception as e:
            return Response(
                {"message": "Failed to create invitation", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AcceptInvitationView(generics.GenericAPIView):
    """
    Accept an invitation to join an organization.
    """

    serializer_class = UserSerializer

    def post(self, request, token):
        try:
            invitation = Invitation.objects.get(
                id=token, accepted=False, expires_at__gte=timezone.now()
            )
        except Invitation.DoesNotExist:
            return Response(
                {"message": "Invitation does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            UserRole.objects.create(
                user=user, organization=invitation.organization, role=invitation.role
            )

            invitation.accepted = True
            invitation.save()

            response_data = login_response_constructor(user)
            return Response(response_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



