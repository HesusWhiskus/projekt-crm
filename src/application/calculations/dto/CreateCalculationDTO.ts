export interface CreateCalculationDTO {
  // Personal data
  pesel?: string | null
  firstName?: string | null
  lastName?: string | null
  previousLastName?: string | null
  phone?: string | null
  email?: string | null
  // Address
  postalCode?: string | null
  city?: string | null
  street?: string | null
  houseNumber?: string | null
  apartmentNumber?: string | null
  // Correspondence address
  correspondenceAddress?: Record<string, any> | null
  // Additional data
  hasDrivingLicense?: boolean | null
  drivingLicenseDate?: string | null // ISO date string
  occupation?: string | null
  maritalStatus?: string | null
  hasChildUnder26?: boolean | null
  // Relations
  clientId?: string | null
  vehicleId?: string | null
  agentId?: string | null
  organizationId?: string | null
  // Business fields
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
  value?: number | null
  validUntil?: string | null // ISO date string
  // Insurance form data
  variant?: 'MINIMAL' | 'OPTIMAL' | 'MAXIMAL' | null
  scopes?: ('OC' | 'AC' | 'NNW' | 'ASS')[]
}

