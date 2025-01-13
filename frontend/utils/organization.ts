import { BASE_URL } from "@/constants";

export interface OrganizationDomain {
  domain: string;
  organizationId: string;
  name: string;
}

export async function getOrganizationFromEmail(email: string): Promise<OrganizationDomain | null> {
  const domain = email.split('@')[1].toLowerCase(); 

  console.log('BASE_URL:', BASE_URL);
  try {
    const response = await fetch(`${BASE_URL}/organizations/check-domain/?domain=${domain}`, {
      method: 'GET', 
    });

    if (!response.ok) {
      console.error(`Failed to fetch organization: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json(); 
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}