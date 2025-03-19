from contracts.models import Contract
from core.permissions import IsOrganizationAdmin
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from esignature.models import SignatureAPISenderProfile
from esignature.serializers import EnvelopeDataSerializer
from esignature.services.signatureAPI import (
    create_envelope,
    create_sender,
    get_sender,
)
from esignature.utils import prepare_envelope_data
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class SendContractForSigning(APIView):
    """
    Send a contract for electronic signing.

    This endpoint prepares and submits a contract for electronic signing via the SignatureAPI.
    It validates the request data, ensures the contract belongs to the user's organization, prepares
    the envelope data, and submits it to SignatureAPI. See https://signatureapi.com/docs/resources/envelopes/create for
    the required format of payload needed to send a request to signatureAPI to create an envelope
    and send to recipients.

    The endpoint will use data from the frontend to build the complete envelope payload.
    See utils.py:prepare_envelope_data().
    """

    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    @swagger_auto_schema(
        request_body=EnvelopeDataSerializer,
        responses={
            status.HTTP_202_ACCEPTED: "Contract signing request accepted and is being processed"
        },
    )
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
            sender=user, contract=contract, data_from_request=serializer.validated_data
        )

        response = create_envelope(envelope_data)

        if (
            response.status_code != 201
        ):  # if there was an error forward the error response from signatureAPI to frontend
            return Response(
                response.json(),
                status=response.status_code,  # if 422 it is mostly a validation error
            )

        contract.stage = "sign_pending"  # update contract stage
        contract.save()

        # the request has been accepted by signatureAPI
        # document has not been necessarily sent
        # but processing is underway
        # planning to use webhooks to update about the statuses...
        return Response(status=status.HTTP_202_ACCEPTED)


class CreateSender(APIView):
    """
    Registers the authenticated user as a sender in signatureAPI.

    This endpoint initiates the sender creation process with signatureAPI.
    No request body is needed, logged in user's email will be used.
    The user must be an organization admin.
    SignatureAPI will send a verification email to the user's email address.
    Users must confirm the email to complete the verification process and be able to send contracts.
    """

    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    @swagger_auto_schema(
        request_body=None,  # no request body is needed, logged in user's email will be used
        responses={
            status.HTTP_202_ACCEPTED: "signatureAPI sender creation request accepted",
        },
    )
    def post(self, request, format=None):
        user = request.user

        try:
            profile = SignatureAPISenderProfile.objects.get(user=user)
            sender = get_sender(profile.api_sender_id)

            if sender.status_code == 200:
                sender_status = sender.json()["status"]

                if sender_status == "verified":
                    return Response(
                        {"error": "User is already a verified sender"},
                        status=status.HTTP_409_CONFLICT,
                    )
                elif sender_status == "pending_verification":
                    return Response(
                        {
                            # ask user to check email and confirm request
                            # request cannot be repeated by signatureAPI
                            "error": "Verification request email sent but not confirmed"
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                elif sender_status == "failed":
                    return Response(
                        {"error": "Sender creation failed"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            elif sender.status_code == 404:
                # delete the profile and try again
                profile.delete()
                return self.post(request, format)
            else:
                return Response(sender.json(), status=sender.status_code)
        except SignatureAPISenderProfile.DoesNotExist:
            # TODO: remember to verify app users email addresses
            new_sender = create_sender(user.email)

            if new_sender.ok:
                SignatureAPISenderProfile.objects.create(
                    user=user, api_sender_id=new_sender.json()["id"]
                )
                # sender creation request has been accepted by signatureAPI
                # sender status is pending verification
                # but can be failed if email is not valid
                return Response(new_sender.json(), status=status.HTTP_202_ACCEPTED)

            return Response(new_sender.json(), status=new_sender.status_code)
