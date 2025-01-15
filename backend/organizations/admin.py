from django.contrib import admin

from .models import Organization, Role, UserRole

admin.site.register(Organization)
admin.site.register(Role)
admin.site.register(UserRole)
# admin.site.register(Permission)
# admin.site.register(PermissionGroup)
# admin.site.register(PermissionGroupPermission)

