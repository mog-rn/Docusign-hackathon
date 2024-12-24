from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from organizations.serializer import UserSerializer
from ..models import Organization, UserRole

class OrganizationUsersView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, organizationId):
        try:
            organization = Organization.objects.get(id=organizationId)
        except Organization.DoesNotExist:
            return Response(
                {"message": "Organization does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        users_roles = UserRole.objects.filter(
            organization=organization
        ).select_related('user', 'role')

        if not users_roles.exists():
            return Response(
                {"message": "No users found for the organization."},
                status=status.HTTP_404_NOT_FOUND
            )

        users_data = {}
        for user_role in users_roles:
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

        return Response({"users": list(users_data.values())}, status=status.HTTP_200_OK)