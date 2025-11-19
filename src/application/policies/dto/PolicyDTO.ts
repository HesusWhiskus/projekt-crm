export interface PolicyDTO {
  id: string
  policyNumber: string
  issueDate: Date
  validFrom: Date
  validTo: Date
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
  calculationId: string | null
  clientId: string | null
  vehicleId: string | null
  insuranceCompanyId: string
  agentId: string | null
  organizationId: string | null
  externalId: string | null
  syncedAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Relations (optional, populated when included)
  client?: any
  vehicle?: any
  calculation?: any
  insuranceCompany?: any
  agent?: any
  documents?: PolicyDocumentDTO[]
}

export interface PolicyDocumentDTO {
  id: string
  policyId: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: Date
  externalId: string | null
}

