from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import User
from core.permissions import IsMainAdmin, IsOrganizationAdmin
from organizations.serializers import AssignRoleSerializer, RoleSerializer
from organizations.models import Organization, Role, UserRole


class UserRolesView(generics.GenericAPIView):
    """
    Retrieve the roles of a user in an organization.
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, organizationId, userId):
        """
        Retrieve the user's role in the organization.
        """
        # First check if organization exists
        try:
            organization = Organization.objects.get(id=organizationId)
        except Organization.DoesNotExist:
            return Response(
                {"message": "Organization does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Then check if user exists
        try:
            user = User.objects.get(id=userId)
        except User.DoesNotExist:
            return Response(
                {"message": "User does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user has any roles in the organization
        user_roles = UserRole.objects.filter(
            organization=organization,
            user=user
        ).select_related('role')

        if not user_roles.exists():
            return Response(
                {"message": "User does not belong to the organization."},
                status=status.HTTP_404_NOT_FOUND
            )

        roles = [user_role.role for user_role in user_roles]
        serializer = self.get_serializer(roles, many=True)
        return Response({"roles": serializer.data}, status=status.HTTP_200_OK)
 

class AssignRoleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = AssignRoleSerializer

    def post(self, request, organizationId, userId):
        """
        Assign a role to a user in the organization.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            role = serializer.validated_data['roleId']

            # Check if the role belongs to the organization
            if role.organization_id != organizationId:
                return Response(
                    {"message": "Role does not belong to the organization."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the role has been already assigned to the user
            if UserRole.objects.filter(
                user_id=userId,
                organization_id=organizationId,
                role_id=role.id
            ).exists():
                return Response(
                    {"message": "Role already assigned to the user."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if the user belongs to the organization
            if not UserRole.objects.filter(
                user_id=userId,
                organization_id=organizationId
            ).exists():
                return Response(
                    {"message": "User does not belong to the organization."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # check if user exists
            elif not User.objects.filter(id=userId).exists():
                return Response(
                    {"message": "User does not exist."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            UserRole.objects.create(
                user_id=userId,
                organization_id=organizationId, 
                role_id=role.id
            )
            return Response(
                {"message": "Role assigned successfully!"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
class AvailableRolesView(generics.GenericAPIView):
    """
    Retrieve all roles available in an organization.
    """
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = RoleSerializer

    def get(self, request, organizationId):
        try:
            organization = Organization.objects.get(id=organizationId)
        except Organization.DoesNotExist:
                    return Response(
                        {"message": "Organization does not exist."},
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        roles = Role.objects.filter(organization=organization)
        
        if not roles.exists():
            return Response(
                {"message": "No roles found for the organization."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(roles, many=True)
        return Response({"roles": serializer.data}, status=status.HTTP_200_OK)
