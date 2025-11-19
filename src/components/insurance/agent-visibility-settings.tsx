"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface AgentVisibilitySettingsProps {
  agentId: string
  initialSettings?: {
    showVehicles: boolean
    showCalculations: boolean
    showPolicies: boolean
    showClients: boolean
    showDashboard: boolean
    showReports: boolean
  }
  onSuccess?: () => void
}

const defaultSettings = {
  showVehicles: true,
  showCalculations: true,
  showPolicies: true,
  showClients: true,
  showDashboard: true,
  showReports: true,
}

export function AgentVisibilitySettings({ 
  agentId, 
  initialSettings = defaultSettings,
  onSuccess 
}: AgentVisibilitySettingsProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/insurance-agents/${agentId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Wystąpił błąd')
      }

      setSuccess(true)
      if (onSuccess) {
        onSuccess()
      }
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message || 'Wystąpił błąd podczas zapisywania ustawień')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustawienia widoczności</CardTitle>
        <CardDescription>
          Wybierz, które elementy mają być widoczne dla tego agenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
              Ustawienia zostały zapisane pomyślnie
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showVehicles"
                checked={settings.showVehicles}
                onCheckedChange={() => handleToggle('showVehicles')}
              />
              <Label htmlFor="showVehicles" className="cursor-pointer">
                Pojazdy
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showCalculations"
                checked={settings.showCalculations}
                onCheckedChange={() => handleToggle('showCalculations')}
              />
              <Label htmlFor="showCalculations" className="cursor-pointer">
                Kalkulacje
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPolicies"
                checked={settings.showPolicies}
                onCheckedChange={() => handleToggle('showPolicies')}
              />
              <Label htmlFor="showPolicies" className="cursor-pointer">
                Polisy
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showClients"
                checked={settings.showClients}
                onCheckedChange={() => handleToggle('showClients')}
              />
              <Label htmlFor="showClients" className="cursor-pointer">
                Klienci
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDashboard"
                checked={settings.showDashboard}
                onCheckedChange={() => handleToggle('showDashboard')}
              />
              <Label htmlFor="showDashboard" className="cursor-pointer">
                Dashboard
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showReports"
                checked={settings.showReports}
                onCheckedChange={() => handleToggle('showReports')}
              />
              <Label htmlFor="showReports" className="cursor-pointer">
                Raporty
              </Label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

