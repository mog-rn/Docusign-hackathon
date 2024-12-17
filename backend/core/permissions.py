from rest_framework import permissions

class IsMainAdmin(permissions.BasePermission):
    """
    Allows access only to users who are main admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_main_admin