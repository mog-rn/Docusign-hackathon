from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


class IsMainAdmin(BasePermission):
    """
    Allows access only to the django superuser.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class IsOrganizationAdmin(BasePermission):
    """
    Allows access only to users who are organization admins.
    """

    def has_permission(self, request, view):
        user = request.user
        is_organization_admin = user.roles.filter(
            role__name="admin", role__organization=user.organization
        ).exists()
        print(is_organization_admin)
        return is_organization_admin


class IsInOrganization(BasePermission):
    """
    Allows access to users who belong to the requested organization.
    """

    def has_permission(self, request, view):
        organization_id = view.kwargs.get("organizationId")
        return request.user.organization.id == organization_id
