"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: {
      clientsImported: number
      contactsImported: number
      errors: string[]
      warnings: string[]
    }
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls")
      ) {
        setFile(selectedFile)
        setResult(null)
      } else {
        alert("Proszę wybrać plik Excel (.xlsx lub .xls)")
        e.target.value = ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert("Proszę wybrać plik do importu")
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || "Wystąpił błąd podczas importu",
          details: data.details,
        })
      } else {
        setResult({
          success: true,
          message: data.message || "Import zakończony pomyślnie",
          details: data.details,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Wystąpił błąd: ${error.message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Import danych z Excel</span>
          </CardTitle>
          <CardDescription>
            Zaimportuj klientów i kontakty z pliku Excel (.xlsx lub .xls)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Wybierz plik Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                disabled={isLoading}
                required
              />
              <p className="text-sm text-muted-foreground">
                Obsługiwane formaty: .xlsx, .xls
              </p>
            </div>

            {file && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading || !file} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importowanie...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Rozpocznij import
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instrukcje */}
      <Card>
        <CardHeader>
          <CardTitle>Format pliku Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Arkusz z klientami</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Plik powinien zawierać arkusz z nazwą zawierającą "klienci" lub "clients".
                Wspierane kolumny:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Imię / First Name / firstName</li>
                <li>Nazwisko / Last Name / lastName</li>
                <li>Nazwa firmy / Agency Name / agencyName / Firma / Company</li>
                <li>Email / E-mail</li>
                <li>Telefon / Phone / Tel</li>
                <li>Strona WWW / Website / WWW</li>
                <li>Adres / Address</li>
                <li>Źródło / Source</li>
                <li>Status (NEW_LEAD, IN_CONTACT, DEMO_SENT, NEGOTIATION, ACTIVE_CLIENT, LOST)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Arkusz z kontaktami (opcjonalnie)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Jeśli chcesz zaimportować kontakty, dodaj arkusz z nazwą zawierającą "kontakty" lub "contacts".
                Wspierane kolumny:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Klient Email / Client Email / Email klienta (identyfikator klienta)</li>
                <li>Typ kontaktu / Type (PHONE_CALL, MEETING, EMAIL, LINKEDIN_MESSAGE, OTHER)</li>
                <li>Data / Date</li>
                <li>Notatka / Notes / Opis / Description</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Uwaga:</strong> Jeśli klient już istnieje (po email lub nazwie firmy),
                jego dane zostaną zaktualizowane. Kontakty są zawsze dodawane jako nowe rekordy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wyniki importu */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Wyniki importu</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`p-3 rounded-md ${
                  result.success
                    ? "bg-green-50 text-green-900"
                    : "bg-red-50 text-red-900"
                }`}
              >
                <p className="font-medium">{result.message}</p>
              </div>

              {result.details && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Zaimportowanych klientów
                      </p>
                      <p className="text-2xl font-bold">
                        {result.details.clientsImported}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Zaimportowanych kontaktów
                      </p>
                      <p className="text-2xl font-bold">
                        {result.details.contactsImported}
                      </p>
                    </div>
                  </div>

                  {result.details.warnings && result.details.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-md">
                      <p className="text-sm font-medium text-yellow-900 mb-2">
                        Ostrzeżenia ({result.details.warnings.length})
                      </p>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {result.details.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.details.errors && result.details.errors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-md">
                      <p className="text-sm font-medium text-red-900 mb-2">
                        Błędy ({result.details.errors.length})
                      </p>
                      <ul className="text-sm text-red-800 space-y-1 max-h-60 overflow-y-auto">
                        {result.details.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

