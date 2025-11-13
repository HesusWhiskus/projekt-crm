"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileEdit, Trash2, Edit } from "lucide-react"

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

  useEffect(() => {
    // TODO: Fetch custom fields from API
    // For now, show empty state
    setIsLoading(false)
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

  if (fields.length === 0) {
    return (
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
          <Button>
            <FileEdit className="h-4 w-4 mr-2" />
            Utwórz pole
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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
  )
}

