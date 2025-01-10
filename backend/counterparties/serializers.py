from counterparties.models import Counterparty

from rest_framework import serializers


class CounterpartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty
        fields = '__all__'
        read_only_fields = ['id', 'added_at', 'updated_at']
