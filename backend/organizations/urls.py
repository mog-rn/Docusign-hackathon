from django.urls import path
from .views import AvailableRolesView, OrganizationCreateView, OrganizationDeleteView, OrganizationListView, OrganizationUsersView, UpdatePermissionsView, UserRolesView, AssignRoleView

urlpatterns = [
    path('', OrganizationListView.as_view(), name='list_organizations'),
    path('create/', OrganizationCreateView.as_view(), name='create_organization'),
    path(
        '<uuid:pk>/delete',
        OrganizationDeleteView.as_view(),
        name='delete_organization'
    ),
    path(
        '<uuid:organizationId>/roles/',
        AvailableRolesView.as_view(),
        name='get_roles'
    ),
    path(
        '<uuid:organizationId>/roles/<uuid:roleId>/permissions',
        UpdatePermissionsView.as_view(),
        name='update_permissions'
    ),
    path(
        '<uuid:organizationId>/users/',
        OrganizationUsersView.as_view(),
        name='get_organization_users'
    ),
    path(
        '<uuid:organizationId>/users/<uuid:userId>/roles',
        UserRolesView.as_view(),
        name='get_user_roles'
    ),
    path(
        '<uuid:organizationId>/users/<uuid:userId>/roles/assign',
        AssignRoleView.as_view(),
        name='assign_role'
    )
]