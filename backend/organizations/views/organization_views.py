from core.permissions import IsMainAdmin, IsOrganizationAdmin
from organizations.models import Organization, Role, UserRole
from organizations.serializers import OrganizationSerializer
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class OrganizationListCreateView(generics.ListCreateAPIView):
    """
    List all organizations or create a new organization.

    - The list operation is restricted to superusers only.
    - The create operation checks if the user is already part of an organization.
      If not, it associates the user with the new organization and assigns them
      an admin role within that organization, unless the user is a Django superuser.
    """

    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Create a new organization and automatically make user an admin,
        unless the user is a superuser.
        """
        user = request.user

        if user.organization:
            return Response(
                {"message": "User already belongs to an organization."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            organization = serializer.save()

            if not user.is_superuser:
                # django superuser should not be associated with any organization
                user.organization = organization
                user.save()

                admin_role, _ = Role.objects.get_or_create(
                    name="admin",
                    organization=organization,
                    defaults={
                        "permissions": {
                            "can_invite": True,
                            "can_manage_users": True,
                            "can_manage_roles": True,
                            "can_manage_permissions": True,
                            "can_manage_organization": True,
                            "is_organization_admin": True,
                        }
                    },
                )

                UserRole.objects.create(user=user, role=admin_role)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """
        List all organizations, accessible only to superusers.
        """
        user = request.user
        if not user.is_superuser:
            return Response(
                {"message": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().list(request, *args, **kwargs)


class OrganizationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an organization.

    User must be either an organization admin or a Django superuser to access this view.
    """

    permission_classes = [IsAuthenticated, IsOrganizationAdmin | IsMainAdmin]
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
