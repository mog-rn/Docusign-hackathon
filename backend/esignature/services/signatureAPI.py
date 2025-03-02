import requests
from django.conf import settings

SIGNATUREAPI_BASE_URL = "https://api.signatureapi.com/v1/"


def create_envelope(envelope_data):
    """
    Make request to signatureAPI to create an envelope and start the signing process,
    sending the documents to the recipients.
    """
    headers = {"X-API-Key": settings.SIGNATUREAPI_API_KEY}

    response = requests.post(
        f"{SIGNATUREAPI_BASE_URL}envelopes", json=envelope_data, headers=headers
    )

    return response


def create_sender(email):
    headers = {"X-API-Key": settings.SIGNATUREAPI_API_KEY}

    response = requests.post(
        f"{SIGNATUREAPI_BASE_URL}senders", json={"email": email}, headers=headers
    )

    return response


def get_sender(sender_id):
    headers = {"X-API-Key": settings.SIGNATUREAPI_API_KEY}

    response = requests.get(
        f"{SIGNATUREAPI_BASE_URL}senders/{sender_id}", headers=headers
    )
    return response


# def get_sender_status(sender_id):
#     sender = get_sender(sender_id)

#     if sender.ok:
#         return sender.json()["status"]
