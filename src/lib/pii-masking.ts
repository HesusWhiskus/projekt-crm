/**
 * SECURITY-FIX: [PII-14] Funkcje maskujące wrażliwe dane osobowe (PII)
 * Data: 2025-01-27
 * 
 * Funkcje maskujące dane osobowe zgodnie z RODO/GDPR:
 * - PESEL: pokazuje pierwsze 3 i ostatnie 2 cyfry
 * - Telefon: pokazuje pierwsze 3 i ostatnie 3 cyfry
 * - Email: pokazuje pierwszą literę i domenę
 */

/**
 * Maskuje PESEL - pokazuje pierwsze 3 i ostatnie 2 cyfry
 * Przykład: 12345678901 -> 123****8901
 */
export function maskPESEL(pesel: string | null | undefined): string {
  if (!pesel || pesel.length !== 11) return pesel || ''
  
  // Sprawdź czy to są tylko cyfry
  if (!/^\d{11}$/.test(pesel)) return pesel
  
  return `${pesel.slice(0, 3)}****${pesel.slice(-2)}`
}

/**
 * Maskuje numer telefonu - pokazuje pierwsze 3 i ostatnie 3 cyfry
 * Przykład: +48123456789 -> +48***789 lub 123456789 -> 123***789
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  
  // Usuń spacje i myślniki dla łatwiejszego przetwarzania
  const cleaned = phone.replace(/[\s-]/g, '')
  
  // Jeśli numer jest bardzo krótki, zwróć jak jest
  if (cleaned.length <= 6) return phone
  
  // Sprawdź czy zaczyna się od kodu kraju (np. +48, +1)
  const countryCodeMatch = cleaned.match(/^(\+\d{1,3})(.+)$/)
  
  if (countryCodeMatch) {
    const [, countryCode, number] = countryCodeMatch
    if (number.length <= 6) return phone
    return `${countryCode}${number.slice(0, 3)}***${number.slice(-3)}`
  }
  
  // Numer bez kodu kraju
  if (cleaned.length <= 6) return phone
  return `${cleaned.slice(0, 3)}***${cleaned.slice(-3)}`
}

/**
 * Maskuje adres email - pokazuje pierwszą literę i domenę
 * Przykład: jan.kowalski@example.com -> j***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return ''
  
  const [localPart, domain] = email.split('@')
  
  if (!domain) return email // Nieprawidłowy format email
  
  if (localPart.length <= 1) {
    return `${localPart}@${domain}`
  }
  
  return `${localPart[0]}***@${domain}`
}

/**
 * Maskuje adres - pokazuje tylko miasto i kod pocztowy
 * Przykład: ul. Przykładowa 123, 00-001 Warszawa -> *** Warszawa (00-001)
 */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return ''
  
  // Wyciągnij kod pocztowy (format: XX-XXX lub XXXXX)
  const postalCodeMatch = address.match(/\b\d{2}-?\d{3}\b/)
  const postalCode = postalCodeMatch ? postalCodeMatch[0] : ''
  
  // Wyciągnij miasto (zwykle na końcu)
  const parts = address.split(',').map(p => p.trim())
  const city = parts[parts.length - 1] || ''
  
  if (postalCode && city) {
    return `*** ${city} (${postalCode})`
  }
  
  if (city) {
    return `*** ${city}`
  }
  
  // Jeśli nie można wyciągnąć miasta, zwróć zamaszkowany adres
  return '***'
}

/**
 * Sprawdza czy użytkownik ma uprawnienia do wyświetlania pełnych danych PII
 * Domyślnie tylko ADMIN może widzieć pełne dane
 */
export function canViewFullPII(userRole?: string | null): boolean {
  return userRole === 'ADMIN'
}

/**
 * Maskuje PESEL jeśli użytkownik nie ma uprawnień
 */
export function maskPESELIfNeeded(pesel: string | null | undefined, userRole?: string | null): string {
  if (canViewFullPII(userRole)) {
    return pesel || ''
  }
  return maskPESEL(pesel)
}

/**
 * Maskuje telefon jeśli użytkownik nie ma uprawnień
 */
export function maskPhoneIfNeeded(phone: string | null | undefined, userRole?: string | null): string {
  if (canViewFullPII(userRole)) {
    return phone || ''
  }
  return maskPhone(phone)
}

/**
 * Maskuje email jeśli użytkownik nie ma uprawnień
 */
export function maskEmailIfNeeded(email: string | null | undefined, userRole?: string | null): string {
  if (canViewFullPII(userRole)) {
    return email || ''
  }
  return maskEmail(email)
}

