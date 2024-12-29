from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def login_response_constructor(user):
    refresh = RefreshToken.for_user(user)
    
    # Initialize organization data as None
    organization_data = None
    organization_id = None
    
    # Check if user has an organization
    if hasattr(user, 'organization') and user.organization:
        organization = user.organization
        organization_id = str(organization.id)
        
        # Get domains if they exist
        domains = []
        if hasattr(organization, 'domains'):
            domains = [
                {
                    "id": str(domain.id),
                    "domain": domain.domain,
                    "isPrimary": True,
                    "isVerified": True,
                    "verifedAt": domain.created_at.isoformat(),
                    "created_at": domain.created_at.isoformat(),
                }
                for domain in organization.domains.all()
            ]
        
        organization_data = {
            "id": organization_id,
            "name": organization.name,
            "domains": domains
        }

    return {
        "accessToken": str(refresh.access_token),
        "refreshToken": str(refresh),
        "user": {
            "userId": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "organizationId": organization_id,
            "is_organization_admin": getattr(user, 'is_organization_admin', False),
            "organization": organization_data,
        }
    }

def send_invitation_email(invitation, invitation_url):
    """
    Send invitation email using configured email backend
    """
    try:
        context = {
            'invitation': invitation,
            'invitation_url': invitation_url,
            'organization_name': invitation.organization.name,
            'sender_name': 'CLM System'
        }
        
        # Render email templates
        html_message = render_to_string('email/invitation.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject=f'CLM System: Invitation to join {invitation.organization.name}',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send invitation email: {str(e)}")
        raise