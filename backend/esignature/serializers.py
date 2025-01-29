from rest_framework import serializers


class RecipientSerializer(serializers.Serializer):
    key = serializers.CharField()  # unique identifier for a recipient
    recipient_type = serializers.ChoiceField(choices=["signer"], source="type")
    name = serializers.CharField()
    email = serializers.EmailField()


class PlaceSerializer(serializers.Serializer):
    key = (
        serializers.CharField()
    )  # placeholder text to mark position; can be just a random value
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
    recipient_key = (
        serializers.CharField()
    )  # must match one of the keys in the recipient list


class EnvelopeDataSerializer(serializers.Serializer):
    contract_id = serializers.UUIDField()
    routing = serializers.ChoiceField(choices=["sequential", "parallel"])
    document_format = serializers.ChoiceField(choices=["docx", "pdf"])
    recipients = RecipientSerializer(many=True)
    places = PlaceSerializer(many=True)
    message = serializers.CharField()

    def validate_recipients(self, value):
        if not value:
            raise serializers.ValidationError("Recipients list cannot be empty.")
        return value

    def validate_places(self, value):
        if not value:
            raise serializers.ValidationError("Places list cannot be empty.")
        return value
