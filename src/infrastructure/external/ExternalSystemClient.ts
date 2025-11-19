/**
 * Configuration for external system client
 */
export interface ExternalSystemConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
  retryAttempts?: number
}

/**
 * Request options for external system
 */
export interface ExternalSystemRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  data?: Record<string, any>
  headers?: Record<string, string>
}

/**
 * Response from external system
 */
export interface ExternalSystemResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

/**
 * External System Client
 * HTTP client for communicating with external insurance system
 */
export class ExternalSystemClient {
  private config: Required<ExternalSystemConfig>

  constructor(config: ExternalSystemConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000, // 30 seconds default
      retryAttempts: config.retryAttempts || 3,
    }
  }

  /**
   * Makes a request to external system
   */
  async request<T = any>(options: ExternalSystemRequestOptions): Promise<ExternalSystemResponse<T>> {
    const url = `${this.config.baseUrl}${options.endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const fetchOptions: RequestInit = {
          method: options.method,
          headers,
          signal: controller.signal,
        }

        if (options.data && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
          fetchOptions.body = JSON.stringify(options.data)
        }

        const response = await fetch(url, fetchOptions)
        clearTimeout(timeoutId)

        const responseData = await response.json().catch(() => ({}))

        if (!response.ok) {
          return {
            success: false,
            error: responseData.error || `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          }
        }

        return {
          success: true,
          data: responseData,
          statusCode: response.status,
        }
      } catch (error: any) {
        lastError = error

        // Don't retry on abort (timeout) or certain errors
        if (error.name === 'AbortError' || attempt === this.config.retryAttempts) {
          break
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
    }
  }

  /**
   * Sends client data to external system
   */
  async syncClient(clientData: Record<string, any>): Promise<ExternalSystemResponse> {
    return this.request({
      method: 'POST',
      endpoint: '/api/clients',
      data: clientData,
    })
  }

  /**
   * Sends vehicle data to external system
   */
  async syncVehicle(vehicleData: Record<string, any>): Promise<ExternalSystemResponse> {
    return this.request({
      method: 'POST',
      endpoint: '/api/vehicles',
      data: vehicleData,
    })
  }

  /**
   * Sends calculation data to external system
   */
  async syncCalculation(calculationData: Record<string, any>): Promise<ExternalSystemResponse> {
    return this.request({
      method: 'POST',
      endpoint: '/api/calculations',
      data: calculationData,
    })
  }

  /**
   * Sends policy data to external system
   */
  async syncPolicy(policyData: Record<string, any>): Promise<ExternalSystemResponse> {
    return this.request({
      method: 'POST',
      endpoint: '/api/policies',
      data: policyData,
    })
  }

  /**
   * Gets data from external system
   */
  async getData<T = any>(endpoint: string): Promise<ExternalSystemResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
    })
  }

  /**
   * Helper method for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

