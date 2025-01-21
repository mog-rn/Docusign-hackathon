from django.urls import path
from organizations.views.organization_views import OrganizationListCreateView, OrganizationRetrieveUpdateDestroyView
from organizations.views.permissions_views import UpdatePermissionsView
from organizations.views.role_views import AssignRoleView, AvailableRolesView, UserRolesView
from organizations.views.user_views import OrganizationUsersView

urlpatterns = [
    path('', OrganizationListCreateView.as_view(), name='list_create_organizations'),
    path('<uuid:pk>/', OrganizationRetrieveUpdateDestroyView.as_view(), name='retrieve_update_destroy_organization'),
    path('<uuid:organizationId>/users/', OrganizationUsersView.as_view(), name='get_organization_users'),
    path('<uuid:organizationId>/roles/', AvailableRolesView.as_view(), name='get_roles'),
    path('<uuid:organizationId>/roles/<int:roleId>/permissions/', UpdatePermissionsView.as_view(), name='update_permissions'),
    path('<uuid:organizationId>/users/<int:userId>/roles', UserRolesView.as_view(), name='get_user_roles'),
    path('<uuid:organizationId>/users/<int:userId>/roles/assign', AssignRoleView.as_view(), name='assign_role'),
]
