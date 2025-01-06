from django.db import models
from django.conf import settings
from organizations.models import Organization, Role
import uuid
from django.utils import timezone

class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.ForeignKey('organizations.Role', on_delete=models.CASCADE)
    accepted = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'invitations'
        unique_together = []
        indexes = [
            models.Index(fields=['email', 'organization']),
            models.Index(fields=['expires_at'])
        ] 

    def __str__(self):
        return f"Invitation for {self.email} to {self.organization.name}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def save(self, *args, **kwargs):
        if not self.pk:
            existing = Invitation.objects.filter(
                email=self.email, 
                organization=self.organization,
                accepted=False,
                expires_at__gte=timezone.now()
            ).first()

            if existing:
                self.pk = existing.pk
                self.expires_at = timezone.now() + timezone.timedelta(days=7)
                kwargs['force_update'] = True
                kwargs['force_insert'] = False
        super().save(*args, **kwargs)