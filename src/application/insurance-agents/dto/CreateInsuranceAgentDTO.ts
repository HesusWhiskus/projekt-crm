import { AgentVisibilitySettings } from '@/domain/insurance-agents/entities/InsuranceAgent'

export interface CreateInsuranceAgentDTO {
  userId: string
  licenseNumber?: string | null
  settings?: AgentVisibilitySettings
  isActive?: boolean
  organizationId?: string | null
}

