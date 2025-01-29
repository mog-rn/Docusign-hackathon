import requests
from django.conf import settings
from pprint import pprint

SIGNATUREAPI_BASE_URL = "https://api.signatureapi.com/v1/"


def create_envelope(envelope_data):
    headers = {"X-API-Key": settings.SIGNATUREAPI_API_KEY}

    response = requests.post(
        f"{SIGNATUREAPI_BASE_URL}envelopes", json=envelope_data, headers=headers
    )

    pprint(response.json())
    return response
