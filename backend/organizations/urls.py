from django.urls import path, include

from .urls import urlpatterns as domain_urlpatterns
from .urls import urlpatterns as org_urlpatterns

urlpatterns = domain_urlpatterns + org_urlpatterns