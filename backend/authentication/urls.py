from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import AcceptInvitationView, InviteUserView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("<uuid:organizationId>/invite/", InviteUserView.as_view(), name="invite_user"),
    path(
        "invitations/<uuid:organizationId>/accept/",
        AcceptInvitationView.as_view(),
        name="accept_invitation",
    ),
]
