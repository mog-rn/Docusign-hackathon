from rest_framework import generics, status
from rest_framework.response import Response
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated

from core.models import User
from .models import Organization, UserRole, Role, Domain

from core.permissions import IsMainAdmin
from organizations.permissions import IsOrganizationAdmin
from organizations.serializer import OrganizationSerializer, AssignRoleSerializer, RoleSerializer, UserSerializer


class OrganizationCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsMainAdmin]
    serializer_class = OrganizationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            organization = serializer.save()

            admin_role, _ = Role.objects.get_or_create(
                name="admin",
                organization=organization,
            )

            # Add the main admin 
            main_admin = User.objects.get(is_main_admin=True)
            UserRole.objects.create(
                user=main_admin,
                organization=organization,
                role=admin_role
            )

            if request.user != main_admin:
                UserRole.objects.create(
                    user=request.user,
                    organization=organization,
                    role=admin_role
                )

            return Response(
                {"message": "Organization created successfully!", "organization": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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
        try:
            user_roles = UserRole.objects.filter(
                organization_id=organizationId, user_id=userId
            ).select_related('role')
            roles = [user_role.role for user_role in user_roles]
            serializer = self.get_serializer(roles, many=True)
            return Response({"roles": serializer.data}, status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response(
                {"message": "User does not belong to the organization."},
                status=status.HTTP_404_NOT_FOUND
            )
        
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
            UserRole.objects.create(
                user_id=userId, organization_id=organizationId, role_id=role
            )
            return Response(
                {"message": "Role assigned successfully!"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class OrganizationListView(generics.ListAPIView):
    """
    View to retrieve all organizations from the database.
    Only authenticated users with the 'main_admin' role can access this view.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsMainAdmin]

class OrganizationDeleteView(generics.DestroyAPIView):
    """
    Delete an organization.
    Only authenticated users with the 'main_admin' role can access this view.
    """
    permission_classes = [IsAuthenticated, IsMainAdmin]
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Organization deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )
    
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
        
class UpdatePermissionsView(generics.GenericAPIView):
    """
    Update permissions for a role in an organization.
    """
    permission_classes = [IsAuthenticated, IsMainAdmin]
    serializer_class = RoleSerializer

    def patch(self, request, organizationId, roleId):
        try:
            role = Role.objects.get(id=roleId, organization_id=organizationId)
        except Role.DoesNotExist:
            return Response(
                {"message": "Role does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Role permissions updated successfully!"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizationUsersView(generics.GenericAPIView):
    """
    Retrieve all users in an organization along with their roles.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, organizationId):
        """
        Return the list of users in the specified organization.
        """
        try:
            # Ensure the organization exists
            organization = Organization.objects.get(id=organizationId)
        except Organization.DoesNotExist:
            return Response(
                {"message": "Organization does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Fetch all users directly associated with the organization
        users_roles = UserRole.objects.filter(
            organization=organization
        ).select_related('user', 'role')

        if not users_roles.exists():
            return Response(
                {"message": "No users found for the organization."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Build user data with roles
        users_data = {}
        for user_role in users_roles:
            # Get the roles of the user in the organization
            user = user_role.user
            if user.id not in users_data:
                users_data[user.id] = {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_organization_admin": user.is_organization_admin,
                    "roles": [],
                    "created_at": user.created_at
                }
            
            users_data[user.id]["roles"].append({
                "id": user_role.role.id,
                "name": user_role.role.name,
                "permissions": user_role.role.permissions
            })

        return Response({
            "users": list(users_data.values())},
            status=status.HTTP_200_OK)