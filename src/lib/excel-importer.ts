import * as XLSX from "xlsx"
import { db } from "./db"
import { ClientStatus, ContactType } from "@prisma/client"

interface ExcelRow {
  [key: string]: any
}

interface ImportResult {
  success: boolean
  clientsImported: number
  contactsImported: number
  errors: string[]
  warnings: string[]
}

interface ParsedClient {
  firstName: string
  lastName: string
  companyName?: string
  type?: "COMPANY" | "PERSON"
  email?: string
  phone?: string
  website?: string
  address?: string
  source?: string
  status?: ClientStatus
}

interface ParsedContact {
  clientIdentifier: string // email, companyName, or firstName+lastName
  type: ContactType
  date: Date
  notes: string
}

/**
 * Parsuje plik Excel i zwraca dane w strukturze
 */
export function parseExcelFile(buffer: Buffer): {
  clients: ParsedClient[]
  contacts: ParsedContact[]
  errors: string[]
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const clients: ParsedClient[] = []
  const contacts: ParsedContact[] = []
  const errors: string[] = []

  // Szukamy arkuszy z klientami i kontaktami
  const sheetNames = workbook.SheetNames

  // Debug: logowanie dostępnych arkuszy
  errors.push(`DEBUG: Znalezione arkusze: ${sheetNames.join(", ")}`)

  // Próbujemy znaleźć arkusz z klientami (nazwy mogą być różne)
  const clientsSheetName =
    sheetNames.find((name) =>
      name.toLowerCase().match(/klienci|clients|client/i)
    ) || sheetNames[0]

  // Próbujemy znaleźć arkusz z kontaktami
  const contactsSheetName = sheetNames.find((name) =>
    name.toLowerCase().match(/kontakty|contacts|contact/i)
  )

  try {
    // Parsowanie klientów
    if (clientsSheetName) {
      const clientsSheet = workbook.Sheets[clientsSheetName]
      // Używamy defval: "" aby uniknąć pomijania pustych komórek
      const clientsData = XLSX.utils.sheet_to_json<ExcelRow>(clientsSheet, {
        defval: "",
        raw: false,
      })

      errors.push(
        `DEBUG: Znaleziono ${clientsData.length} wierszy w arkuszu "${clientsSheetName}"`
      )

      // Jeśli są dane, logujemy pierwszy wiersz, aby zobaczyć strukturę
      if (clientsData.length > 0) {
        const firstRowKeys = Object.keys(clientsData[0])
        errors.push(
          `DEBUG: Dostępne kolumny w arkuszu: ${firstRowKeys.join(", ")}`
        )
        
        // Logujemy pierwszy wiersz danych (dla debugowania)
        if (clientsData.length > 0) {
          const firstRow = clientsData[0]
          const sampleData: string[] = []
          firstRowKeys.slice(0, 5).forEach(key => {
            const value = firstRow[key]
            if (value !== undefined && value !== null && value !== "") {
              sampleData.push(`${key}="${String(value).substring(0, 50)}"`)
            }
          })
          if (sampleData.length > 0) {
            errors.push(`DEBUG: Przykładowe dane z pierwszego wiersza: ${sampleData.join(", ")}`)
          }
        }
      }

      for (const row of clientsData) {
        try {
          const client = parseClientRow(row)
          if (client) {
            clients.push(client)
          }
        } catch (error: any) {
          errors.push(`Błąd w wierszu klienta: ${error.message}`)
        }
      }

      errors.push(`DEBUG: Sparsowano ${clients.length} klientów`)
    }

    // Parsowanie kontaktów
    if (contactsSheetName) {
      const contactsSheet = workbook.Sheets[contactsSheetName]
      const contactsData = XLSX.utils.sheet_to_json<ExcelRow>(contactsSheet)

      for (const row of contactsData) {
        try {
          const contact = parseContactRow(row)
          if (contact) {
            contacts.push(contact)
          }
        } catch (error: any) {
          errors.push(`Błąd w wierszu kontaktu: ${error.message}`)
        }
      }
    } else if (clientsSheetName) {
      // Jeśli nie ma osobnego arkusza kontaktów, sprawdzamy czy są w arkuszu klientów
      const clientsSheet = workbook.Sheets[clientsSheetName]
      const allData = XLSX.utils.sheet_to_json<ExcelRow>(clientsSheet)

      for (const row of allData) {
        // Sprawdzamy czy wiersz ma dane kontaktowe
        if (hasContactData(row)) {
          try {
            const contact = parseContactRow(row)
            if (contact) {
              contacts.push(contact)
            }
          } catch (error: any) {
            errors.push(`Błąd w wierszu kontaktu: ${error.message}`)
          }
        }
      }
    }
  } catch (error: any) {
    errors.push(`Błąd podczas parsowania pliku: ${error.message}`)
  }

  return { clients, contacts, errors }
}

/**
 * Czyści wartość z niepotrzebnych białych znaków i cudzysłowów
 */
function cleanValue(value: string): string {
  if (!value) return ""
  
  // Usuwamy białe znaki z początku i końca
  let cleaned = String(value).trim()
  
  // Usuwamy cudzysłowy z początku i końca, jeśli są
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  
  // Usuwamy niepotrzebne białe znaki (wiele spacji -> jedna)
  cleaned = cleaned.replace(/\s+/g, " ")
  
  return cleaned
}

/**
 * Znajduje wartość w obiekcie po różnych możliwych kluczach (case-insensitive)
 */
function findValue(
  row: ExcelRow,
  possibleKeys: string[]
): string | undefined {
  // Najpierw sprawdzamy dokładne dopasowanie
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      const value = cleanValue(String(row[key]))
      return value || undefined
    }
  }

  // Potem sprawdzamy case-insensitive
  const rowKeys = Object.keys(row)
  for (const possibleKey of possibleKeys) {
    const foundKey = rowKeys.find(
      (rk) => rk.toLowerCase() === possibleKey.toLowerCase()
    )
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== "") {
      const value = cleanValue(String(row[foundKey]))
      return value || undefined
    }
  }

  return undefined
}

/**
 * Parsuje wiersz z danymi klienta
 * Obsługuje różne formaty kolumn
 */
function parseClientRow(row: ExcelRow): ParsedClient | null {
  // Szukamy kolumn z danymi klienta (case-insensitive)
  
  // Najpierw sprawdzamy czy jest kolumna "Imię i nazwisko" (połączona)
  const fullName =
    findValue(row, [
      "Imię i nazwisko",
      "imię i nazwisko",
      "Imie i nazwisko",
      "Full Name",
      "full name",
      "fullName",
    ]) || ""

  // Jeśli jest pełne imię i nazwisko, dzielimy je
  let firstName = ""
  let lastName = ""
  
  if (fullName) {
    const nameParts = fullName.trim().split(/\s+/)
    if (nameParts.length >= 2) {
      firstName = nameParts[0]
      lastName = nameParts.slice(1).join(" ")
    } else {
      firstName = fullName
    }
  } else {
    // Jeśli nie ma pełnego imienia, szukamy osobno
    firstName =
      findValue(row, [
        "Imię",
        "Imie",
        "First Name",
        "firstName",
        "firstname",
        "IMIĘ",
      ]) || ""

    lastName =
      findValue(row, [
        "Nazwisko",
        "Last Name",
        "lastName",
        "lastname",
        "NAZWISKO",
      ]) || ""
  }

  const companyName =
    findValue(row, [
      "Nazwa agencji",
      "nazwa agencji",
      "Nazwa Agencji",
      "Nazwa firmy",
      "Nazwa Firmy",
      "nazwa firmy",
      "Agency Name",
      "agencyName",
      "agency name",
      "Firma",
      "firma",
      "Company",
      "company",
      "COMPANY",
      "FIRMA",
    ]) || undefined

  const email =
    findValue(row, [
      "Email agencji",
      "email agencji",
      "Email Agencji",
      "Email",
      "email",
      "E-mail",
      "e-mail",
      "EMAIL",
      "E-MAIL",
    ]) || undefined

  const phone =
    findValue(row, [
      "Telefon agencji",
      "telefon agencji",
      "Telefon Agencji",
      "Telefon",
      "telefon",
      "Phone",
      "phone",
      "Tel",
      "tel",
      "TELEFON",
      "PHONE",
    ]) || undefined

  const website =
    findValue(row, [
      "WWW",
      "www",
      "Strona WWW",
      "strona www",
      "Website",
      "website",
      "WEBSITE",
    ]) || undefined

  const address =
    findValue(row, ["Adres", "adres", "Address", "address", "ADRES"]) ||
    undefined

  const source =
    findValue(row, [
      "Źródło kontaktu",
      "źródło kontaktu",
      "Źródło Kontaktu",
      "Źródło",
      "źródło",
      "Zrodlo",
      "Source",
      "source",
      "SOURCE",
    ]) || undefined

  const statusStr =
    findValue(row, ["Status", "status", "STATUS", "DUPLIKAT_W_RAPORCIE"]) || undefined

  // Jeśli brakuje podstawowych danych, pomijamy
  // Ale sprawdzamy czy wiersz nie jest pusty (może zawierać tylko puste wartości)
  const hasAnyData = firstName || lastName || companyName || email || phone

  if (!hasAnyData) {
    return null
  }

  // Jeśli brakuje imienia i nazwiska, ale jest nazwa firmy, używamy nazwy firmy jako firstName
  const finalFirstName = firstName || companyName || "Nieznane"
  const finalLastName = lastName || ""

  let status: ClientStatus | undefined = undefined
  if (statusStr) {
    const statusMap: Record<string, ClientStatus> = {
      "NEW_LEAD": ClientStatus.NEW_LEAD,
      "NEW LEAD": ClientStatus.NEW_LEAD,
      "Nowy lead": ClientStatus.NEW_LEAD,
      "nowy lead": ClientStatus.NEW_LEAD,
      "IN_CONTACT": ClientStatus.IN_CONTACT,
      "IN CONTACT": ClientStatus.IN_CONTACT,
      "W kontakcie": ClientStatus.IN_CONTACT,
      "w kontakcie": ClientStatus.IN_CONTACT,
      "DEMO_SENT": ClientStatus.DEMO_SENT,
      "DEMO SENT": ClientStatus.DEMO_SENT,
      "Demo wysłane": ClientStatus.DEMO_SENT,
      "demo wysłane": ClientStatus.DEMO_SENT,
      "NEGOTIATION": ClientStatus.NEGOTIATION,
      "Negocjacje": ClientStatus.NEGOTIATION,
      "negocjacje": ClientStatus.NEGOTIATION,
      "ACTIVE_CLIENT": ClientStatus.ACTIVE_CLIENT,
      "ACTIVE CLIENT": ClientStatus.ACTIVE_CLIENT,
      "Klient aktywny": ClientStatus.ACTIVE_CLIENT,
      "klient aktywny": ClientStatus.ACTIVE_CLIENT,
      "LOST": ClientStatus.LOST,
      "Utracony": ClientStatus.LOST,
      "utracony": ClientStatus.LOST,
    }
    status = statusMap[statusStr] || undefined
  }

  return {
    firstName: finalFirstName,
    lastName: finalLastName,
    companyName: companyName || undefined,
    type: companyName ? "COMPANY" : "PERSON",
    email: email || undefined,
    phone: phone || undefined,
    website: website || undefined,
    address: address || undefined,
    source: source || undefined,
    status: status || ClientStatus.NEW_LEAD,
  }
}

/**
 * Parsuje wiersz z danymi kontaktu
 */
function parseContactRow(row: ExcelRow): ParsedContact | null {
  const clientIdentifier =
    row["Klient Email"] ||
    row["klient email"] ||
    row["Client Email"] ||
    row["client email"] ||
    row["Email klienta"] ||
    row["email klienta"] ||
    row["Email"] ||
    row["email"] ||
    row["Nazwa firmy"] ||
    row["nazwa firmy"] ||
    row["Agency Name"] ||
    row["companyName"] ||
    row["agencyName"] || // backward compatibility
    row["Firma"] ||
    row["firma"] ||
    row[""] ||
    ""

  const typeStr =
    row["Typ kontaktu"] ||
    row["typ kontaktu"] ||
    row["Type"] ||
    row["type"] ||
    row["Typ"] ||
    row["typ"] ||
    ""

  const dateStr =
    row["Data"] ||
    row["data"] ||
    row["Date"] ||
    row["date"] ||
    row[""] ||
    new Date().toISOString()

  const notes =
    row["Notatka"] ||
    row["notatka"] ||
    row["Notes"] ||
    row["notes"] ||
    row["Notatki"] ||
    row["notatki"] ||
    row["Opis"] ||
    row["opis"] ||
    row["Description"] ||
    row["description"] ||
    row[""] ||
    ""

  if (!clientIdentifier || !notes) {
    return null
  }

  // Parsowanie typu kontaktu
  const typeMap: Record<string, ContactType> = {
    "PHONE_CALL": ContactType.PHONE_CALL,
    "PHONE CALL": ContactType.PHONE_CALL,
    "Rozmowa telefoniczna": ContactType.PHONE_CALL,
    "rozmowa telefoniczna": ContactType.PHONE_CALL,
    "Telefon": ContactType.PHONE_CALL,
    "telefon": ContactType.PHONE_CALL,
    "MEETING": ContactType.MEETING,
    "Spotkanie": ContactType.MEETING,
    "spotkanie": ContactType.MEETING,
    "EMAIL": ContactType.EMAIL,
    "E-mail": ContactType.EMAIL,
    "e-mail": ContactType.EMAIL,
    "LINKEDIN_MESSAGE": ContactType.LINKEDIN_MESSAGE,
    "LINKEDIN MESSAGE": ContactType.LINKEDIN_MESSAGE,
    "Wiadomość LinkedIn": ContactType.LINKEDIN_MESSAGE,
    "wiadomość linkedin": ContactType.LINKEDIN_MESSAGE,
    "LinkedIn": ContactType.LINKEDIN_MESSAGE,
    "linkedin": ContactType.LINKEDIN_MESSAGE,
    "OTHER": ContactType.OTHER,
    "Inne": ContactType.OTHER,
    "inne": ContactType.OTHER,
  }

  const type = typeMap[typeStr] || ContactType.OTHER

  // Parsowanie daty
  let date: Date
  if (dateStr instanceof Date) {
    date = dateStr
  } else if (typeof dateStr === "number") {
    // Excel serial date - konwersja z dnia Excel (1900-01-01 = dzień 1)
    const excelEpoch = new Date(1899, 11, 30) // 1899-12-30
    date = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
  } else {
    date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      date = new Date()
    }
  }

  return {
    clientIdentifier,
    type,
    date,
    notes: notes || "",
  }
}

/**
 * Sprawdza czy wiersz zawiera dane kontaktowe
 */
function hasContactData(row: ExcelRow): boolean {
  const contactIndicators = [
    "Typ kontaktu",
    "typ kontaktu",
    "Type",
    "type",
    "Notatka",
    "notatka",
    "Notes",
    "notes",
  ]

  return contactIndicators.some((indicator) => row[indicator] !== undefined)
}

/**
 * Importuje klientów i kontakty z danych Excel do bazy
 */
export async function importExcelData(
  clients: ParsedClient[],
  contacts: ParsedContact[],
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    clientsImported: 0,
    contactsImported: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Import klientów
    const clientMap = new Map<string, string>() // Mapowanie identyfikatora -> clientId

    for (const clientData of clients) {
      try {
        // Sprawdzamy czy klient już istnieje (po email lub nazwie firmy)
        let existingClient = null

        if (clientData.email) {
          existingClient = await db.client.findFirst({
            where: { email: clientData.email },
          })
        }

        if (!existingClient && clientData.companyName) {
          existingClient = await db.client.findFirst({
            where: {
              companyName: clientData.companyName,
              firstName: clientData.firstName,
              lastName: clientData.lastName,
            },
          })
        }

        if (existingClient) {
          // Aktualizujemy istniejącego klienta
          await db.client.update({
            where: { id: existingClient.id },
            data: {
              firstName: clientData.firstName || existingClient.firstName,
              lastName: clientData.lastName || existingClient.lastName,
              companyName: clientData.companyName || existingClient.companyName,
              type: (clientData.companyName || existingClient.companyName) ? "COMPANY" : "PERSON",
              email: clientData.email || existingClient.email,
              phone: clientData.phone || existingClient.phone,
              website: clientData.website || existingClient.website,
              address: clientData.address || existingClient.address,
              source: clientData.source || existingClient.source,
              status: clientData.status || existingClient.status,
            },
          })

          const identifier =
            clientData.email ||
            clientData.companyName ||
            `${clientData.firstName} ${clientData.lastName}`
          clientMap.set(identifier, existingClient.id)
          result.warnings.push(
            `Klient ${identifier} już istniał, zaktualizowano dane`
          )
        } else {
          // Tworzymy nowego klienta
          const newClient = await db.client.create({
            data: {
              firstName: clientData.firstName,
              lastName: clientData.lastName,
              companyName: clientData.companyName,
              type: clientData.companyName ? "COMPANY" : "PERSON",
              email: clientData.email,
              phone: clientData.phone,
              website: clientData.website,
              address: clientData.address,
              source: clientData.source,
              status: clientData.status || ClientStatus.NEW_LEAD,
              assignedTo: userId,
            },
          })

          const identifier =
            clientData.email ||
            clientData.companyName ||
            `${clientData.firstName} ${clientData.lastName}`
          clientMap.set(identifier, newClient.id)
          result.clientsImported++
        }
      } catch (error: any) {
        result.errors.push(
          `Błąd podczas importu klienta ${clientData.firstName} ${clientData.lastName}: ${error.message}`
        )
      }
    }

    // Import kontaktów
    for (const contactData of contacts) {
      try {
        // Znajdź klienta po identyfikatorze
        let clientId: string | null = null

        // Najpierw sprawdzamy mapę
        if (clientMap.has(contactData.clientIdentifier)) {
          clientId = clientMap.get(contactData.clientIdentifier) || null
        } else {
          // Szukamy w bazie
          const client = await db.client.findFirst({
            where: {
              OR: [
                { email: contactData.clientIdentifier },
                { companyName: contactData.clientIdentifier },
              ],
            },
          })

          if (client) {
            clientId = client.id
          } else {
            result.errors.push(
              `Nie znaleziono klienta dla kontaktu: ${contactData.clientIdentifier}`
            )
            continue
          }
        }

        if (!clientId) {
          continue
        }

        // Tworzymy kontakt
        await db.contact.create({
          data: {
            clientId,
            type: contactData.type,
            date: contactData.date,
            notes: contactData.notes,
            userId,
          },
        })

        result.contactsImported++
      } catch (error: any) {
        result.errors.push(
          `Błąd podczas importu kontaktu: ${error.message}`
        )
      }
    }

    // Logowanie aktywności
    await db.activityLog.create({
      data: {
        userId,
        action: "BULK_IMPORT",
        entityType: "Import",
        details: {
          clientsImported: result.clientsImported,
          contactsImported: result.contactsImported,
          errors: result.errors.length,
          warnings: result.warnings.length,
        },
      },
    })
  } catch (error: any) {
    result.success = false
    result.errors.push(`Krytyczny błąd podczas importu: ${error.message}`)
  }

  return result
}

