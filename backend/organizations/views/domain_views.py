from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny

from organizations.models import Domain


class CheckDomainView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    """
    API check if the domain exists in the system.
    """
    def get(self, request, *args, **kwargs):
        """
        Check if the domain exists in the system.
        """
        domain = request.query_params.get('domain')

        if not domain:
            return Response(
                {"error": "Domain parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        domain_exists = Domain.objects.filter(domain=domain).exists()

        if domain_exists:
            return Response(
                {"message": "Domain exists in the system."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"message": "Domain does not exist in the system. Please contact your organization administrator."},
                status=status.HTTP_404_NOT_FOUND
            )