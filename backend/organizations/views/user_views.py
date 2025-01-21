from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from organizations.serializers import UserSerializer
from organizations.models import Organization, UserRole
from authentication.serializers import UserSerializer

class OrganizationUsersView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, organizationId):
        organization = get_object_or_404(Organization, id=organizationId)
        members = organization.members.all()

        user_data = []

        for member in members:
            member_data = UserSerializer(member).data
            member_roles = member.roles.filter(role__organization=organization)
            member_data['roles'] = [role.role.name for role in member_roles]
            user_data.append(member_data)
        
        return Response(user_data, status=status.HTTP_200_OK)
