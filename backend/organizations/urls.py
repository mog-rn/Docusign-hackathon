from django.urls import path
from .views import OrganizationCreateView, OrganizationListView, UserRolesView, AssignRoleView

urlpatterns = [
    path('', OrganizationListView.as_view(), name='list-organizations'),
    path('create/', OrganizationCreateView.as_view(), name='create-organization'),
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