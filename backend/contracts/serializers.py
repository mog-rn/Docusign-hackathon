from rest_framework import serializers

from counterparties.serializers import CounterpartySerializer
from contracts.models import Contract


class ContractSerializer(serializers.ModelSerializer):
    counterparties = CounterpartySerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'created_by', 'last_modified_at', 'last_modified_by', 'organization']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')

        if request and request.method in ['PUT', 'PATCH']:
            fields['file_path'].read_only = True
        
        return fields
