"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Key, Copy, Trash2, Calendar, Plus } from "lucide-react"
import { ApiKeyForm } from "./api-key-form"

interface ApiKey {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
}

export function ApiKeysList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/settings/api-keys")
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error("Error fetching API keys:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApiKeys()
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
      <ApiKeyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          fetchApiKeys()
        }}
      />
      {apiKeys.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Brak kluczy API</CardTitle>
            <CardDescription>
              Utwórz swój pierwszy klucz API, aby rozpocząć integrację z systemem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Klucze API pozwalają na bezpieczne połączenie zewnętrznych aplikacji z systemem CRM.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Key className="h-4 w-4 mr-2" />
              Utwórz klucz API
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nowy klucz
            </Button>
          </div>
        {apiKeys.map((key) => (
        <Card key={key.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{key.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Kopiuj
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Utworzono: {new Date(key.createdAt).toLocaleDateString("pl-PL")}</span>
              </div>
              {key.lastUsedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ostatnie użycie: {new Date(key.lastUsedAt).toLocaleDateString("pl-PL")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
        </div>
      )}
    </>
  )
}

