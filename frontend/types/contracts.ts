export interface Counterparty {
    id?: string;
    party_name: string;
    party_type: string;
    email: string;
    isPrimary: boolean;
    added_at?: string;
    updated_at?: string;
    contract: string;
  }
  
  export interface Contract {
    id: string;
    title: string;
    description: string;
    contract_type: string;
    stage: string;
    effective_from: string;
    expires_on: string;
    is_renewable: boolean;
    renewal_count: number;
    renewed_on: string;
    terminated_at: string;
    terminated_reason: string;
    created_at: string;
    last_modified_at: string;
    file_path: string;
    organization: string;
    created_by: number;
    last_modified_by: number;
    counterparties: Counterparty[];
    content: string;
  }