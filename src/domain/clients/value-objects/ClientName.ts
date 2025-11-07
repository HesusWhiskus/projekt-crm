/**
 * ClientName Value Object
 * Immutable value object representing a client's first or last name
 */
export class ClientName {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a ClientName value object from a string
   * @param name The name value
   * @param fieldName Field name for error messages (e.g., "Imię", "Nazwisko")
   * @param minLength Minimum length (default: 1)
   * @param maxLength Maximum length (default: 50)
   * @throws Error if name is invalid
   */
  static create(
    name: string,
    fieldName: string = 'Imię',
    minLength: number = 1,
    maxLength: number = 50
  ): ClientName {
    if (!name || typeof name !== 'string') {
      throw new Error(`${fieldName} jest wymagane`)
    }

    const trimmed = name.trim()

    if (trimmed.length < minLength) {
      throw new Error(`${fieldName} jest wymagane`)
    }

    if (trimmed.length > maxLength) {
      throw new Error(`${fieldName} jest zbyt długie (max ${maxLength} znaków)`)
    }

    // Allow letters, spaces, hyphens, apostrophes, and Polish characters
    const nameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-'\.]+$/
    if (!nameRegex.test(trimmed)) {
      throw new Error(`${fieldName} może zawierać tylko litery, spacje, myślniki i apostrofy`)
    }

    return new ClientName(trimmed)
  }

  /**
   * Creates a ClientName from a validated string (for internal use)
   */
  static fromValidated(value: string): ClientName {
    return new ClientName(value)
  }

  /**
   * Returns the name value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the name value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: ClientName): boolean {
    return this.value === other.value
  }
}

