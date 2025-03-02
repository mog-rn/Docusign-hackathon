from rest_framework import serializers


class RecipientSerializer(serializers.Serializer):
    """
    Serializer for Recipient.
    """

    key = serializers.CharField()  # unique identifier for a recipient
    recipient_type = serializers.ChoiceField(choices=["signer"], source="type")
    name = serializers.CharField()
    email = serializers.EmailField()


class InitialsAndSignaturePlaceSerializer(serializers.Serializer):
    """
    Serializer for initials and signature place_type.
    """

    recipient_key = (
        serializers.CharField()
    )  # must match one of the keys in the recipient list
    height = serializers.IntegerField(min_value=20, max_value=60, default=60)


class TextPlaceSerializer(serializers.Serializer):
    """
    Serializer for text place_type.

    Text is just a string that will be included in the document.
    """

    value = serializers.CharField()
    font_size = serializers.IntegerField(default=12)
    font_color = serializers.CharField(default="#000000")


class TextInputPlaceSerializer(serializers.Serializer):
    """
    Serializer for text_input place_type.

    Text input will be used to ask recipients for input.
    """

    recipient_key = (
        serializers.CharField()
    )  # must match one of the keys in the recipient list
    capture_as = serializers.CharField(required=False)
    hint = serializers.CharField(required=False)
    prompt = serializers.CharField(required=False)
    requirement = serializers.ChoiceField(
        choices=["optional", "required"], default="required"
    )
    input_format = serializers.CharField(
        required=False, source="format"
    )  # define validation format for the input. Accepted values are email, zipcode-us or a regular expression
    format_message = serializers.CharField(required=False)


class RecipientCompletedDatePlaceSerializer(serializers.Serializer):
    """
    The date when the recipient, identified by the recipient_key, completed (for example, signed) the envelope.

    Will automatically be populated once recipient completes their ceremony.
    """

    recipient_key = (
        serializers.CharField()
    )  # must match one of the keys in the recipient list
    date_format = serializers.CharField(default="D MMM YYYY")


class EnvelopeCompletedDatePlaceSerializer(serializers.Serializer):
    """
    The date when the envelope was completed (for example, signed) by all recipients.
    """

    date_format = serializers.CharField(default="D MMM YYYY")


class PlaceSerializer(serializers.Serializer):
    """
    This serializer will be used to validate the base values of a place.
    And then it will select the correct serializer based on the type.
    """

    key = (
        serializers.CharField()
    )  # placeholder text to mark position in the format [[ place_key ]]
    place_type = serializers.ChoiceField(
        choices=[
            "signature",
            "initials",
            "text",
            "text_input",
            "recipient_completed_date",
            "envelope_completed_date",
        ],
        source="type",
    )

    def to_internal_value(self, data):
        common_validated_data = super().to_internal_value(
            data
        )  # try using a non-existing place_type

        # validate the remaining fields using the correct serializer
        serializer_map = {
            "signature": InitialsAndSignaturePlaceSerializer,
            "initials": InitialsAndSignaturePlaceSerializer,
            "text": TextPlaceSerializer,
            "text_input": TextInputPlaceSerializer,
            "recipient_completed_date": RecipientCompletedDatePlaceSerializer,
            "envelope_completed_date": EnvelopeCompletedDatePlaceSerializer,
        }

        place_type = common_validated_data["type"]
        serializer_class = serializer_map[place_type]
        serializer = serializer_class(data=data)
        serializer.is_valid(raise_exception=True)

        return {**common_validated_data, **serializer.validated_data}


class EnvelopeDataSerializer(serializers.Serializer):
    """
    Serializer for EnvelopeData.
    """

    contract_id = serializers.UUIDField()
    document_format = serializers.ChoiceField(choices=["docx", "pdf"])
    routing = serializers.ChoiceField(choices=["sequential", "parallel"])
    recipients = RecipientSerializer(many=True, max_length=10, allow_empty=False)
    places = PlaceSerializer(many=True, allow_empty=False)
