from rest_framework_simplejwt.tokens import RefreshToken

def login_response_constructor(user):
    refresh = RefreshToken.for_user(user)
    organization = user.organization

    organization_data = {
        "id": str(organization.id),
        "name": organization.name,
        "domains": [
            {
                "id": str(domain.id),
                "domain": domain.domain,
                "isPrimary": True,
                "isVerified": True,
                "verifedAt": domain.created_at.isoformat(),
                "created_at": domain.created_at.isoformat(),
            }
            for domain in organization.domains.all()
        ],
    }

    return {
        "accessToken": str(refresh.access_token),
        "refreshToken": str(refresh),
        "user": {
            "userId": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "organizationId": str(organization.id),
            "is_organization_admin": user.is_organization_admin,
            "organization": organization_data,
        }
    }
