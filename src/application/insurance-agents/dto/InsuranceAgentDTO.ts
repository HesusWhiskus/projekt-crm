import { AgentVisibilitySettings } from '@/domain/insurance-agents/entities/InsuranceAgent'

export interface InsuranceAgentDTO {
  id: string
  userId: string
  licenseNumber: string | null
  settings: AgentVisibilitySettings
  isActive: boolean
  organizationId: string | null
  createdAt: Date
  updatedAt: Date
  // Relations (optional, populated when included)
  user?: any
  organization?: any
}

