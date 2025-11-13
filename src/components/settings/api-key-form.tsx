"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Key } from "lucide-react"

interface ApiKeyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApiKeyForm({ open, onOpenChange, onSuccess }: ApiKeyFormProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się utworzyć klucza API")
      }

      const data = await response.json()
      
      // Show the API key to user (only shown once)
      if (data.apiKey) {
        alert(`Klucz API został utworzony!\n\nKlucz: ${data.apiKey}\n\nZapisz ten klucz - nie będzie już wyświetlany!`)
      }

      setName("")
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Utwórz klucz API
          </DialogTitle>
          <DialogDescription>
            Utwórz nowy klucz API do integracji z systemem. Klucz będzie wyświetlony tylko raz po utworzeniu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa klucza</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Produkcja, Testy, Integracja XYZ"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Nazwa pomoże Ci zidentyfikować klucz w przyszłości
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Tworzenie..." : "Utwórz klucz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

