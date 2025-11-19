import { AgentVisibilitySettings } from '@/domain/insurance-agents/entities/InsuranceAgent'

export interface UpdateVisibilitySettingsDTO {
  settings: Partial<AgentVisibilitySettings>
}

