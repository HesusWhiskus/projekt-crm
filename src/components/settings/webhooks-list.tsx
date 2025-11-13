"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Webhook, Trash2, Calendar, CheckCircle, XCircle, Plus } from "lucide-react"
import { WebhookForm } from "./webhook-form"

interface WebhookItem {
  id: string
  url: string
  events: string[]
  enabled: boolean
  lastTriggeredAt: string | null
}

export function WebhooksList() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchWebhooks = async () => {
    try {
      const response = await fetch("/api/settings/webhooks")
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (err) {
      console.error("Error fetching webhooks:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
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
      <WebhookForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          fetchWebhooks()
        }}
      />
      {webhooks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Brak webhooków</CardTitle>
            <CardDescription>
              Utwórz swój pierwszy webhook, aby rozpocząć automatyczne powiadomienia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Webhooks pozwalają na automatyczne powiadamianie zewnętrznych systemów o zdarzeniach w CRM.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Webhook className="h-4 w-4 mr-2" />
              Utwórz webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nowy webhook
            </Button>
          </div>
      {webhooks.map((webhook) => (
        <Card key={webhook.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{webhook.url}</CardTitle>
                {webhook.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Eventy: </span>
                <span className="text-muted-foreground">{webhook.events.join(", ")}</span>
              </div>
              {webhook.lastTriggeredAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ostatnie wywołanie: {new Date(webhook.lastTriggeredAt).toLocaleDateString("pl-PL")}</span>
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

