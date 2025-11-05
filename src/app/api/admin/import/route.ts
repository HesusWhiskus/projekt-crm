import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { parseExcelFile, importExcelData } from "@/lib/excel-importer"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Brak uprawnień - tylko administrator może importować dane" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku do importu" },
        { status: 400 }
      )
    }

    // Sprawdzamy typ pliku
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      file.type !== "application/vnd.ms-excel"
    ) {
      return NextResponse.json(
        { error: "Nieobsługiwany format pliku. Obsługiwane formaty: .xlsx, .xls" },
        { status: 400 }
      )
    }

    // Konwersja pliku na buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parsowanie pliku Excel
    const { clients, contacts, errors: parseErrors } = parseExcelFile(buffer)

    if (parseErrors.length > 0 && clients.length === 0 && contacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Błąd podczas parsowania pliku",
          message: "Nie udało się sparsować pliku",
          details: {
            clientsImported: 0,
            contactsImported: 0,
            errors: parseErrors,
            warnings: [],
          },
        },
        { status: 400 }
      )
    }

    // Import danych do bazy
    const importResult = await importExcelData(clients, contacts, user.id)

    // Jeśli były błędy parsowania, dodajemy je do wyników
    importResult.errors.push(...parseErrors)

    return NextResponse.json({
      success: importResult.success,
      message: `Import zakończony. Zaimportowano ${importResult.clientsImported} klientów i ${importResult.contactsImported} kontaktów.`,
      details: {
        clientsImported: importResult.clientsImported,
        contactsImported: importResult.contactsImported,
        errors: importResult.errors,
        warnings: importResult.warnings,
      },
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Wystąpił błąd podczas importu danych",
        message: error.message || "Wystąpił nieoczekiwany błąd",
        details: {
          clientsImported: 0,
          contactsImported: 0,
          errors: [error.message || "Nieznany błąd"],
          warnings: [],
        },
      },
      { status: 500 }
    )
  }
}

