from django.contrib import admin

from .models import Organization, Domain, Role, UserRole

admin.site.register(Organization)
admin.site.register(Domain)
admin.site.register(Role)
admin.site.register(UserRole)
# admin.site.register(Permission)
# admin.site.register(PermissionGroup)
# admin.site.register(PermissionGroupPermission)

