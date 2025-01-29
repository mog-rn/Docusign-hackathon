from contracts.services.s3 import S3


def prepare_envelope_data(sender, contract, data_from_request):
    # generate presigned download url for signatureAPI to source document from
    s3_client = S3()
    contract_url = s3_client.generate_presigned_url_expanded(
        "get_object", contract.file_path
    )

    recipients = data_from_request["recipients"]
    for recipient in recipients:
        recipient["type"] = recipient.pop("recipient_type")

    places = data_from_request["places"]
    for place in places:
        place["type"] = place.pop("place_type")

    # Make the subject and message configurable
    envelope_data = {
        "title": contract.title,
        "message": data_from_request["message"],
        "routing": data_from_request["routing"],
        "documents": [
            {
                "title": contract.title,
                "url": contract_url,
                "places": places,
                "format": data_from_request["document_format"]
            },
        ],
        "recipients": recipients,
        "sender": {
            "email": sender.email,
            "name": f"{sender.first_name} {sender.last_name}",
            "organization": sender.organization.name,
        },
    }

    return envelope_data
