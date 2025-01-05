from django.urls import path

from organizations.views.domain_views import CheckDomainView

urlpatterns = [
    path('check-domain/', CheckDomainView.as_view(), name='check_domain')
]