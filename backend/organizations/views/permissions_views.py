from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsMainAdmin
from organizations.serializers import RoleSerializer
from organizations.models import Role


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