import uuid
from django.db import models


class Counterparty(models.Model):
    # party_type_choices
    # role -> signatory, viewer, influencer
    # party_type -> company, person
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    party_name = models.CharField(max_length=255)
    party_type = models.CharField(max_length=255)
    contract = models.ForeignKey(
        "contracts.Contract", on_delete=models.CASCADE, related_name="counterparties"
    )
    email = models.EmailField()
    isPrimary = models.BooleanField(default=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "counterparties"
