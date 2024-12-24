from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsMainAdmin
from core.models import User
from organizations.serializer import OrganizationSerializer
from ..models import Organization, UserRole, Role

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
