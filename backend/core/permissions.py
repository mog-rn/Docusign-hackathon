from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

class IsMainAdmin(BasePermission):
    """
    Allows access only to users who are main admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_main_admin
    

class IsOrganizationAdmin(BasePermission):
    """
    Allows access only to users who are organization admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_organization_admin


class IsInOrganization(BasePermission):
    """
    Allows access to users who belong to the requested organization.
    """
    def has_permission(self, request, view):
        organization_id = view.kwargs.get('organizationId')
        return request.user.organization.id == organization_id


def can_access_organization(user, organization):
    if user.organization == organization or user.is_main_admin:
        return True

    raise PermissionDenied({'error': 'User does not have permission to access this organization'})
