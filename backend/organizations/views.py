from rest_framework import generics, status
from rest_framework.response import Response
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from .models import Organization, UserRole, Role, Domain

from core.permissions import IsMainAdmin
from organizations.permissions import IsOrganizationAdmin
from organizations.serializer import OrganizationSerializer, AssignRoleSerializer


class OrganizationCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsMainAdmin]
    serializer_class = OrganizationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            organization = serializer.save()
            return Response(
                {"message": "Organization created successfully!", "organization": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserRolesView(generics.GenericAPIView):
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