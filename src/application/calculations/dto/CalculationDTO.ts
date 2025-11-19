export interface CalculationDTO {
  id: string
  pesel: string | null
  firstName: string | null
  lastName: string | null
  previousLastName: string | null
  phone: string | null
  email: string | null
  postalCode: string | null
  city: string | null
  street: string | null
  houseNumber: string | null
  apartmentNumber: string | null
  correspondenceAddress: Record<string, any> | null
  hasDrivingLicense: boolean | null
  drivingLicenseDate: Date | null
  occupation: string | null
  maritalStatus: string | null
  hasChildUnder26: boolean | null
  clientId: string | null
  vehicleId: string | null
  agentId: string | null
  organizationId: string | null
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
  value: number | null
  validUntil: Date | null
  variant: 'MINIMAL' | 'OPTIMAL' | 'MAXIMAL' | null
  scopes: ('OC' | 'AC' | 'NNW' | 'ASS')[]
  externalId: string | null
  syncedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

