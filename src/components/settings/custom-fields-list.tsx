"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileEdit, Trash2, Edit, Plus } from "lucide-react"
import { CustomFieldForm } from "./custom-field-form"

interface CustomField {
  id: string
  name: string
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT"
  required: boolean
  options?: string[]
}

export function CustomFieldsList() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/settings/custom-fields")
      if (response.ok) {
        const data = await response.json()
        setFields(data.fields || [])
      }
    } catch (err) {
      console.error("Error fetching custom fields:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFields()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Ładowanie...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <CustomFieldForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          fetchFields()
        }}
      />
      {fields.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Brak niestandardowych pól</CardTitle>
            <CardDescription>
              Utwórz swoje pierwsze niestandardowe pole, aby rozszerzyć formularz klienta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Niestandardowe pola pozwalają na dodanie dodatkowych informacji do formularza klienta,
              takich jak specjalne identyfikatory, dodatkowe dane kontaktowe czy inne informacje
              specyficzne dla Twojej organizacji.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <FileEdit className="h-4 w-4 mr-2" />
              Utwórz pole
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nowe pole
            </Button>
          </div>
      {fields.map((field) => (
        <Card key={field.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{field.name}</CardTitle>
                <CardDescription>
                  Typ: {field.type} {field.required && "• Wymagane"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edytuj
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń
                </Button>
              </div>
            </div>
          </CardHeader>
          {field.options && field.options.length > 0 && (
            <CardContent>
              <div className="text-sm">
                <span className="font-semibold">Opcje: </span>
                <span className="text-muted-foreground">{field.options.join(", ")}</span>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
        </div>
      )}
    </>
  )
}

