import { InsuranceAgent, AgentVisibilitySettings } from '../entities/InsuranceAgent'

/**
 * Agent Visibility Service
 * Domain service for managing agent visibility settings
 */
export class AgentVisibilityService {
  /**
   * Updates visibility settings for an agent
   * @param agent The insurance agent entity
   * @param settings New visibility settings (partial update)
   * @returns Updated agent entity
   */
  updateVisibilitySettings(
    agent: InsuranceAgent,
    settings: Partial<AgentVisibilitySettings>
  ): InsuranceAgent {
    agent.updateSettings(settings)
    return agent
  }

  /**
   * Updates a single visibility setting
   * @param agent The insurance agent entity
   * @param key Setting key
   * @param value Setting value
   */
  updateVisibilitySetting(
    agent: InsuranceAgent,
    key: string,
    value: boolean
  ): void {
    agent.updateVisibilitySetting(key, value)
  }

  /**
   * Checks if an element should be visible for an agent
   * @param agent The insurance agent entity
   * @param elementKey Element key to check
   * @returns true if element should be visible
   */
  isElementVisible(agent: InsuranceAgent, elementKey: string): boolean {
    return agent.isElementVisible(elementKey)
  }

  /**
   * Gets all visibility settings for an agent
   * @param agent The insurance agent entity
   * @returns Visibility settings object
   */
  getVisibilitySettings(agent: InsuranceAgent): AgentVisibilitySettings {
    return agent.getSettings()
  }

  /**
   * Resets visibility settings to defaults
   * @param agent The insurance agent entity
   */
  resetToDefaults(agent: InsuranceAgent): void {
    const defaultSettings: AgentVisibilitySettings = {
      showVehicles: true,
      showCalculations: true,
      showPolicies: true,
      showClients: true,
      showReports: true,
    }
    agent.updateSettings(defaultSettings)
  }
}

