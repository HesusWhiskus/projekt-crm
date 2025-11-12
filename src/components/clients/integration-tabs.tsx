"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface IntegrationTab {
  id: string
  title: string
  content: Record<string, any>
  order: number
}

interface IntegrationTabsProps {
  clientId: string
  enabled: boolean
}

export function IntegrationTabs({ clientId, enabled }: IntegrationTabsProps) {
  const [tabs, setTabs] = useState<IntegrationTab[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const fetchTabs = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/integration-tabs`)
        if (!response.ok) {
          if (response.status === 404) {
            setTabs([])
            return
          }
          throw new Error("Nie udało się pobrać zakładek integracji")
        }
        const data = await response.json()
        setTabs(data.tabs || [])
      } catch (err: any) {
        setError(err.message || "Wystąpił błąd")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTabs()
  }, [clientId, enabled])

  if (!enabled) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integracje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integracje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (tabs.length === 0) {
    return null
  }

  // Sort tabs by order
  const sortedTabs = [...tabs].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      {sortedTabs.map((tab) => (
        <Card key={tab.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              {tab.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tab.content).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start py-2 border-b last:border-0">
                  <span className="font-medium text-sm text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="text-sm text-right flex-1 ml-4">
                    {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

