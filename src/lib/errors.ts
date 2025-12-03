/**
 * SECURITY-FIX: [ERROR-16] Custom Error classes dla lepszego debugowania i obsługi błędów
 * Data: 2025-01-27
 * 
 * Custom Error classes pozwalają na:
 * - Lepsze typowanie błędów
 * - Łatwiejsze debugowanie (stack trace z kontekstem)
 * - Spójną obsługę błędów w całej aplikacji
 * - Lepsze logowanie (wiadomości błędów bez stacktrace w produkcji)
 */

/**
 * Błąd walidacji danych wejściowych
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}

/**
 * Błąd gdy zasób nie został znaleziony
 */
export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`
    super(message)
    this.name = 'NotFoundError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError)
    }
  }
}

/**
 * Błąd autoryzacji - użytkownik nie jest zalogowany
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnauthorizedError)
    }
  }
}

/**
 * Błąd uprawnień - użytkownik nie ma dostępu do zasobu
 */
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError)
    }
  }
}

/**
 * Błąd konfliktu - zasób już istnieje lub jest w konflikcie
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConflictError)
    }
  }
}

/**
 * Błąd zewnętrznego systemu (API, baza danych, etc.)
 */
export class ExternalServiceError extends Error {
  constructor(message: string, public service?: string, public originalError?: unknown) {
    super(message)
    this.name = 'ExternalServiceError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExternalServiceError)
    }
  }
}

/**
 * Błąd limitu - przekroczono limit (rate limit, payload size, etc.)
 */
export class LimitExceededError extends Error {
  constructor(message: string, public limitType?: string) {
    super(message)
    this.name = 'LimitExceededError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LimitExceededError)
    }
  }
}

/**
 * Type guard do sprawdzania czy błąd jest instancją custom Error
 */
export function isCustomError(error: unknown): error is Error & { name: string } {
  return error instanceof Error && 'name' in error
}

/**
 * Mapuje custom Error na kod HTTP
 */
export function getHttpStatusCode(error: unknown): number {
  if (!isCustomError(error)) {
    return 500
  }

  switch (error.name) {
    case 'ValidationError':
      return 400
    case 'UnauthorizedError':
      return 401
    case 'ForbiddenError':
      return 403
    case 'NotFoundError':
      return 404
    case 'ConflictError':
      return 409
    case 'LimitExceededError':
      return 429
    case 'ExternalServiceError':
      return 502
    default:
      return 500
  }
}

