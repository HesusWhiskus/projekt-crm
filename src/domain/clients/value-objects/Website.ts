/**
 * Website Value Object
 * Immutable value object representing a website URL
 */
export class Website {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a Website value object from a string
   * @throws Error if website is invalid
   */
  static create(website: string | null | undefined): Website | null {
    if (!website || website.trim() === '') {
      return null
    }

    const trimmed = website.trim()

    if (trimmed.length > 2048) {
      throw new Error('URL jest zbyt długi (max 2048 znaków)')
    }

    // Allow URLs with or without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    if (!urlPattern.test(trimmed)) {
      throw new Error('Nieprawidłowy format URL. Użyj pełnego adresu (np. https://example.com)')
    }

    // Add https:// if no protocol specified
    let normalizedUrl = trimmed
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      normalizedUrl = `https://${trimmed}`
    }

    return new Website(normalizedUrl)
  }

  /**
   * Creates a Website from a validated string (for internal use)
   */
  static fromValidated(value: string): Website {
    return new Website(value)
  }

  /**
   * Returns the website value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the website value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: Website | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

