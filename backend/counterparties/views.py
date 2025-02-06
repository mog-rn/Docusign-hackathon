from contracts.models import Contract
from core.permissions import IsOrganizationAdmin
from counterparties.models import Counterparty
from counterparties.serializers import CounterpartySerializer
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class CounterpartyListCreateView(generics.ListCreateAPIView):
    """
    List counterparties for user's organization or create a new one.
    """

    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = CounterpartySerializer

    def get_queryset(self):
        organization = self.request.user.organization
        return Counterparty.objects.filter(contract__organization=organization)

    def create(self, request, *args, **kwargs):
        """
        Create a new counterparty.
        """
        user = request.user
        contract_id = request.data.get("contract")
        contract = get_object_or_404(Contract, id=contract_id)

        if contract.organization != user.organization:
            return Response(
                {"error": "The contract does not belong user's organization"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CounterpartyRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a counterparty.
    """

    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = CounterpartySerializer
    queryset = Counterparty.objects.all()

    def check_organization_and_get_counterparty(self, request):
        """
        Check if the requested counterparty is associated with user's organization
        and return it. If not, raise PermissionDenied.
        """
        user = request.user
        organization = user.organization

        counterparty = self.get_object()

        if counterparty.contract.organization != organization:
            raise PermissionDenied(
                {"error": "The counterparty is not associated with user's organization"}
            )

        return counterparty

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a counterparty.
        """
        counterparty = self.check_organization_and_get_counterparty(request)
        serializer = self.get_serializer(counterparty)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """
        Update a counterparty.
        """
        counterparty = self.check_organization_and_get_counterparty(request)
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(
            counterparty, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a counterparty.
        """
        counterparty = self.check_organization_and_get_counterparty(request)
        counterparty.delete()
        return Response(
            {"message": "Counterparty deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )
