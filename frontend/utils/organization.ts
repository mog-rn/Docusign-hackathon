export interface OrganizationDomain {
    domain: string
    organizationId: string
    name: string
  }
  
  export async function getOrganizationFromEmail(email: string): Promise<OrganizationDomain | null> {
    const domain = email.split('@')[1]
    
    try {
      const response = await fetch(`/api/organizations/domain/${domain}`)
      if (!response.ok) return null
      
      return response.json()
    } catch (error) {
      console.error('Error fetching organization:', error)
      return null
    }
  }