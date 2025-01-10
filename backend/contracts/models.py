import uuid
from django.db import models

class Contract(models.Model):
    # contract type choices
    STAGE_CHOICES = {
        "draft": "Draft",
        "draft_completed": "Draft Completed",
        "negotiation": "Negotiation",
        "review": "Review",
        "approval": "Approval",
        "execution": "Execution",
        "monitoring": "Monitoring",
        "renewal": "Renewal",
        "termination": "Termination",
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    contract_type = models.CharField(max_length=255)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='contracts')
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default="draft")
    effective_from = models.DateField(null=True, blank=True)
    expires_on = models.DateField(null=True, blank=True)
    is_renewable = models.BooleanField(default=False)
    renewal_count = models.PositiveIntegerField(default=0)
    renewed_on = models.DateField(null=True, blank=True)
    terminated_at = models.DateField(null=True, blank=True)
    terminated_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='created_contracts')
    last_modified_at = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='modified_contracts')
    file_path = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'contracts'

    def __str__(self):
        return f'{self.title} - {self.organization}'


