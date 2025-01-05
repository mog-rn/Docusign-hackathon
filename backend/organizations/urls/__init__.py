from .domain_urls import urlpatterns as domain_urlpatterns
from .org_urls import urlpatterns as org_urlpatterns

urlpatterns = domain_urlpatterns + org_urlpatterns
