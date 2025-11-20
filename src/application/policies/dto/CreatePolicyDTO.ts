export interface CreatePolicyDTO {
  policyNumber: string
  issueDate: string // ISO date string
  validFrom: string // ISO date string
  validTo: string // ISO date string
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
  calculationId?: string | null
  clientId?: string | null
  vehicleId?: string | null
  insuranceCompanyId: string
  agentId?: string | null
  organizationId?: string | null
  externalId?: string | null
  configurationType?: 'STANDARD' | 'LEASING' | 'CREDIT' | null
  leasingCompany?: string | null
  creditProvider?: string | null
  contractNumber?: string | null
}

