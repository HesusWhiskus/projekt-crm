export interface PolicyFilterDTO {
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
  clientId?: string
  vehicleId?: string
  insuranceCompanyId?: string
  agentId?: string
  organizationId?: string
  policyNumber?: string
  expiresSoon?: number // Days until expiry
  expired?: boolean
  search?: string
}

