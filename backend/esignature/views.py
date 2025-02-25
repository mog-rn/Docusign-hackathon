from contracts.models import Contract
from core.permissions import IsOrganizationAdmin
from django.shortcuts import get_object_or_404
from esignature.serializers import EnvelopeDataSerializer
from esignature.utils import prepare_envelope_data
from esignature.services.signatureAPI import create_envelope
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class SendContractForSigning(APIView):
    """
    Send a contract for electronic signing.
    
    This endpoint allows an authenticated user with organization admin permissions
    to send a contract for signing. It validates the request data, ensures the contract
    belongs to the user's organization, prepares the envelope data, and submits it
    to the e-signature API.
    
    Methods:
        post(request, format=None):
            - Validates the request data using EnvelopeDataSerializer.
            - Retrieves the contract and checks organization ownership.
            - Prepares envelope data and sends it via the signature API.
            - Updates contract status to "sign_pending" upon successful submission.
    
    Permissions:
        - Requires authentication.
        - Requires the user to be an organization admin.
    
    Responses:
        - 200: Contract successfully sent.
        - 400: Contract could not be sent.
        - 403: Contract does not belong to the user's organization.
    """
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def post(self, request, format=None):
        user = request.user

        serializer = EnvelopeDataSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        contract_id = serializer.data["contract_id"]
        contract = get_object_or_404(Contract, pk=contract_id)

        if contract.organization != user.organization:
            return Response(
                {
                    "error": "The contract in request does not belong to user's organization"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        envelope_data = prepare_envelope_data(
            sender=user, contract=contract, data_from_request=serializer.data
        )

        response = create_envelope(envelope_data)
        if response.status_code != 201:
            return Response(
                {"error": "Contract could not be sent"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contract.status = "sign_pending"
        contract.save()

        return Response(
            {"message": "Contract successfully sent"}, status=status.HTTP_200_OK
        )
