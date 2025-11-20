import { ClientType } from "@prisma/client"

/**
 * Sprawdza czy typ klienta to firma (wszystkie typy oprócz PERSON)
 */
export function isCompanyType(type: ClientType): boolean {
  return type !== "PERSON"
}

/**
 * Zwraca wyświetlaną nazwę klienta na podstawie typu
 * Dla firm zwraca companyName, dla osób fizycznych imię i nazwisko
 */
export function getClientDisplayName(client: {
  type: ClientType
  firstName: string | null
  lastName: string | null
  companyName: string | null
}): string {
  if (isCompanyType(client.type)) {
    return client.companyName || "Brak nazwy firmy"
  }
  const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
  return name || "Brak imienia i nazwiska"
}

