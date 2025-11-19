"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface InsuranceSettingsPanelProps {
  organizationId: string
  initialSettings?: {
    externalSystemUrl?: string | null
    externalSystemApiKey?: string | null
    enableBidirectionalSync?: boolean
    enableDataValidation?: boolean
    enableAuditLogging?: boolean
    syncInterval?: number | null
  }
  onSuccess?: () => void
}

export function InsuranceSettingsPanel({ 
  organizationId, 
  initialSettings,
  onSuccess 
}: InsuranceSettingsPanelProps) {
  const [settings, setSettings] = useState({
    externalSystemUrl: initialSettings?.externalSystemUrl || '',
    externalSystemApiKey: initialSettings?.externalSystemApiKey || '',
    enableBidirectionalSync: initialSettings?.enableBidirectionalSync ?? true,
    enableDataValidation: initialSettings?.enableDataValidation ?? true,
    enableAuditLogging: initialSettings?.enableAuditLogging ?? true,
    syncInterval: initialSettings?.syncInterval?.toString() || '60',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/organizations/${organizationId}/insurance-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalSystemUrl: settings.externalSystemUrl || null,
          externalSystemApiKey: settings.externalSystemApiKey || null,
          enableBidirectionalSync: settings.enableBidirectionalSync,
          enableDataValidation: settings.enableDataValidation,
          enableAuditLogging: settings.enableAuditLogging,
          syncInterval: settings.syncInterval ? parseInt(settings.syncInterval, 10) : null,
        }),
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
        <CardTitle>Ustawienia ubezpieczeń</CardTitle>
        <CardDescription>
          Konfiguracja integracji z systemem zewnętrznym i funkcji ubezpieczeniowych
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <h3 className="text-lg font-semibold mb-4">Integracja zewnętrzna</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="externalSystemUrl">URL systemu zewnętrznego</Label>
                <Input
                  id="externalSystemUrl"
                  type="url"
                  value={settings.externalSystemUrl}
                  onChange={(e) => setSettings({ ...settings, externalSystemUrl: e.target.value })}
                  placeholder="https://example.com/api"
                />
              </div>

              <div>
                <Label htmlFor="externalSystemApiKey">Klucz API</Label>
                <Input
                  id="externalSystemApiKey"
                  type="password"
                  value={settings.externalSystemApiKey}
                  onChange={(e) => setSettings({ ...settings, externalSystemApiKey: e.target.value })}
                  placeholder="Wprowadź klucz API"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableBidirectionalSync"
                  checked={settings.enableBidirectionalSync}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableBidirectionalSync: checked === true })}
                />
                <Label htmlFor="enableBidirectionalSync" className="cursor-pointer">
                  Włącz dwukierunkową synchronizację
                </Label>
              </div>

              <div>
                <Label htmlFor="syncInterval">Interwał synchronizacji (minuty)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min="1"
                  value={settings.syncInterval}
                  onChange={(e) => setSettings({ ...settings, syncInterval: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Funkcje</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableDataValidation"
                  checked={settings.enableDataValidation}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableDataValidation: checked === true })}
                />
                <Label htmlFor="enableDataValidation" className="cursor-pointer">
                  Włącz walidację danych (PESEL, VIN, numer rejestracyjny)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableAuditLogging"
                  checked={settings.enableAuditLogging}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableAuditLogging: checked === true })}
                />
                <Label htmlFor="enableAuditLogging" className="cursor-pointer">
                  Włącz szczegółowe logowanie audytowe
                </Label>
              </div>
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

