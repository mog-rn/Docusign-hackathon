from contracts.services.s3 import S3


def prepare_envelope_data(sender, contract, data_from_request):
    """
    Build complete envelope payload for signatureAPI using data from the frontend
    plus the contract file from s3.
    """

    # generate presigned download url for signatureAPI to source document from
    s3_client = S3()
    contract_url = s3_client.generate_presigned_url_expanded(
        "get_object", contract.file_path
    )

    envelope_data = {
        "title": contract.title,
        "message": "Please review the agreement at your convenience and provide your electronic signature.",
        "routing": data_from_request["routing"],
        "documents": [
            {
                "title": contract.title,
                "url": contract_url,
                "places": data_from_request["places"],
                "format": data_from_request["document_format"],
            },
        ],
        "recipients": data_from_request["recipients"],
        "sender": {
            "email": sender.email,
            "name": f"{sender.first_name} {sender.last_name}",
            "organization": sender.organization.name,
        },
    }

    return envelope_data
