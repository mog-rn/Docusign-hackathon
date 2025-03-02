from django.db import models
from django.conf import settings
from esignature.services.signatureAPI import get_sender


class SignatureAPISenderProfile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="signature_api_sender_profile",
    )
    api_sender_id = models.CharField(max_length=255)

    class Meta:
        db_table = "signatureapi_sender_profiles"

    def __str__(self):
        return f"Email: {self.user.email}  API Sender ID: {self.api_sender_id}"
