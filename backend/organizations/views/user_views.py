from core.permissions import IsInOrganization
from django.shortcuts import get_object_or_404
from organizations.models import Organization
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.serializers import UserSerializer


class OrganizationUsersView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsInOrganization]
    serializer_class = UserSerializer

    def get(self, request, organizationId):
        organization = get_object_or_404(Organization, id=organizationId)
        members = organization.members.all()

        user_data = []

        for member in members:
            member_data = self.get_serializer(member).data
            member_roles = member.roles.filter(role__organization=organization)
            member_data["roles"] = [role.role.name for role in member_roles]
            user_data.append(member_data)

        return Response(user_data, status=status.HTTP_200_OK)
