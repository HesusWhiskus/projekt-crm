import { AgentVisibilitySettings } from '@/domain/insurance-agents/entities/InsuranceAgent'

export interface UpdateInsuranceAgentDTO {
  licenseNumber?: string | null
  settings?: AgentVisibilitySettings
  isActive?: boolean
}

