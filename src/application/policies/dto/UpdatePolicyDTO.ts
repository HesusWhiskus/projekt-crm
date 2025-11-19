export interface UpdatePolicyDTO {
  policyNumber?: string
  issueDate?: string // ISO date string
  validFrom?: string // ISO date string
  validTo?: string // ISO date string
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
  calculationId?: string | null
  clientId?: string | null
  vehicleId?: string | null
  insuranceCompanyId?: string
  agentId?: string | null
}

