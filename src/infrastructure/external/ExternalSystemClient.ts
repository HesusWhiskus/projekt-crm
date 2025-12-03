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
 * SECURITY-FIX: [SSRF-1] Dodano walidację private IPs
 * Data: 2025-01-27
 * Sprawdza czy URL nie wskazuje na private IP/localhost (ochrona przed SSRF)
 */
function isPrivateIP(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' ||
           hostname === '0.0.0.0' ||
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) !== null ||
           hostname === '::1' ||
           hostname.toLowerCase() === 'localhost'
  } catch {
    return true // Jeśli nie można sparsować URL, traktuj jako niebezpieczny
  }
}

/**
 * SECURITY-FIX: [SSRF-1] Dodano walidację whitelist domen
 * Data: 2025-01-27
 * Sprawdza czy URL jest w dozwolonej liście domen (opcjonalnie)
 */
function isAllowedURL(url: string, allowedDomains?: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true // Jeśli brak whitelist, pozwól na wszystkie publiczne URL
  }
  
  try {
    const hostname = new URL(url).hostname
    return allowedDomains.some(domain => {
      // Obsługa wildcard domen (np. *.example.com)
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2)
        return hostname === baseDomain || hostname.endsWith('.' + baseDomain)
      }
      return hostname === domain
    })
  } catch {
    return false
  }
}

/**
 * External System Client
 * HTTP client for communicating with external insurance system
 */
export class ExternalSystemClient {
  private config: Required<ExternalSystemConfig>
  private allowedDomains?: string[]

  constructor(config: ExternalSystemConfig, allowedDomains?: string[]) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000, // 30 seconds default
      retryAttempts: config.retryAttempts || 3,
    }
    this.allowedDomains = allowedDomains
  }

  /**
   * Makes a request to external system
   */
  async request<T = any>(options: ExternalSystemRequestOptions): Promise<ExternalSystemResponse<T>> {
    const url = `${this.config.baseUrl}${options.endpoint}`
    
    // SECURITY-FIX: [SSRF-1] Walidacja URL przed fetch (ochrona przed SSRF)
    // Data: 2025-01-27
    if (isPrivateIP(url)) {
      return {
        success: false,
        error: 'Nie można wykonać żądania do private IP lub localhost (SSRF protection)',
        statusCode: 403,
      }
    }
    
    if (!isAllowedURL(url, this.allowedDomains)) {
      return {
        success: false,
        error: 'Domena nie jest na liście dozwolonych',
        statusCode: 403,
      }
    }
    
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

