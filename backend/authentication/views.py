from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from authentication.serializers import InvitationSerializer, RegisterSerializer, CustomTokenObtainPairSerializer
from authentication.utils import login_response_constructor
from organizations.permissions import IsOrganizationAdmin
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail

class RegisterView(generics.CreateAPIView):
    """
    Register a new user and return the access and refresh tokens.
    """
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            response_data = login_response_constructor(user)
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            errors = serializer.errors
            email_errors = errors.get('email', None)

            if email_errors:
                if "user with this email already exists" in email_errors:
                    return Response(serializer.errors, status=status.HTTP_409_CONFLICT)
                elif 'The email provided does not belong to an organization' in email_errors:
                    return Response(serializer.errors, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class InviteUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = InvitationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()

            invitation_url = f"{settings.FRONTEND_URL}/register?token={invitation.id}"
            send_mail(
                'Invitation to join the organization',
                f"You have been invited to join the organization. Click here to accept: {invitation_url}",
                settings.DEFAULT_FROM_EMAIL,
                [invitation.email],
                fail_silently=False,
            )

            return Response({
                "message": "Invitation sent successfully!",
                "invitation": serializer.data
                }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)