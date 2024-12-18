from rest_framework_simplejwt.tokens import RefreshToken

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