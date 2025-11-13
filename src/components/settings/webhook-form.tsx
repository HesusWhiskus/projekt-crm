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
import { Webhook } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface WebhookFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const webhookEvents = [
  { id: "client.created", label: "Utworzenie klienta" },
  { id: "client.updated", label: "Aktualizacja klienta" },
  { id: "contact.created", label: "Utworzenie kontaktu" },
  { id: "task.created", label: "Utworzenie zadania" },
  { id: "task.completed", label: "Ukończenie zadania" },
]

export function WebhookForm({ open, onOpenChange, onSuccess }: WebhookFormProps) {
  const [url, setUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (selectedEvents.length === 0) {
      setError("Wybierz przynajmniej jedno zdarzenie")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/settings/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          events: selectedEvents,
          secret: secret || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się utworzyć webhooka")
      }

      setUrl("")
      setSecret("")
      setSelectedEvents([])
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Utwórz webhook
          </DialogTitle>
          <DialogDescription>
            Skonfiguruj webhook do automatycznego powiadamiania zewnętrznych systemów o zdarzeniach.
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
              <Label htmlFor="url">URL webhooka *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Adres URL, na który będą wysyłane powiadomienia
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Secret (opcjonalnie)</Label>
              <Input
                id="secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Tajny klucz do weryfikacji"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Używany do weryfikacji autentyczności żądań
              </p>
            </div>
            <div className="space-y-2">
              <Label>Zdarzenia *</Label>
              <div className="space-y-2 border rounded-md p-4">
                {webhookEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => handleEventToggle(event.id)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={event.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Wybierz zdarzenia, które będą wywoływać webhook
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
            <Button type="submit" disabled={isLoading || !url.trim() || selectedEvents.length === 0}>
              {isLoading ? "Tworzenie..." : "Utwórz webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

