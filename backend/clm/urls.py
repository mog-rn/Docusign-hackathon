from django.contrib import admin
from django.urls import include, path
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

schema_view = get_schema_view(
    openapi.Info(
        title="CLM Management API",
        default_version="v1",
        description="This is the API for the Contract Lifecycle Management System",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="your-email@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("api/users/", include("users.urls")),
    path("api/organizations/", include("organizations.urls")),
    path("api/contracts/", include("contracts.urls")),
    path("api/counterparties/", include("counterparties.urls")),
    path("", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
