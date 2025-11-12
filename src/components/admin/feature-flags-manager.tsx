"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FEATURE_KEYS, FeatureKey } from "@/lib/feature-flags"
import { Flag, Check, X } from "lucide-react"

interface FeatureFlagsManagerProps {
  organizationId: string
  organizationName: string
  onClose: () => void
  onSuccess: () => void
}

const featureLabels: Record<FeatureKey, string> = {
  [FEATURE_KEYS.MULTI_TENANT]: "Multi-tenant (wiele organizacji)",
  [FEATURE_KEYS.ADVANCED_REPORTS]: "Zaawansowane raporty",
  [FEATURE_KEYS.EXTERNAL_INTEGRATIONS]: "Integracje zewnętrzne",
  [FEATURE_KEYS.API_KEYS]: "Klucze API",
  [FEATURE_KEYS.CUSTOM_FIELDS]: "Niestandardowe pola",
  [FEATURE_KEYS.INTEGRATION_TABS]: "Zakładki integracji",
  [FEATURE_KEYS.WEBHOOKS]: "Webhooks",
}

const featureDescriptions: Record<FeatureKey, string> = {
  [FEATURE_KEYS.MULTI_TENANT]: "Umożliwia zarządzanie wieloma organizacjami w jednej instancji",
  [FEATURE_KEYS.ADVANCED_REPORTS]: "Dostęp do zaawansowanych raportów i analityki",
  [FEATURE_KEYS.EXTERNAL_INTEGRATIONS]: "Integracje z zewnętrznymi systemami",
  [FEATURE_KEYS.API_KEYS]: "Generowanie i zarządzanie kluczami API",
  [FEATURE_KEYS.CUSTOM_FIELDS]: "Dodawanie niestandardowych pól do klientów",
  [FEATURE_KEYS.INTEGRATION_TABS]: "Dynamiczne zakładki integracji w szczegółach klienta",
  [FEATURE_KEYS.WEBHOOKS]: "Webhooks dla zewnętrznych integracji",
}

export function FeatureFlagsManager({
  organizationId,
  organizationName,
  onClose,
  onSuccess,
}: FeatureFlagsManagerProps) {
  const [featureFlags, setFeatureFlags] = useState<Record<FeatureKey, boolean>>({} as Record<FeatureKey, boolean>)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}/feature-flags`)
        if (!response.ok) {
          throw new Error("Nie udało się pobrać funkcji")
        }
        const data = await response.json()
        
        // Initialize all features as disabled
        const flags: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>
        Object.values(FEATURE_KEYS).forEach((key) => {
          flags[key] = false
        })
        
        // Set enabled features
        data.featureFlags.forEach((ff: { featureKey: FeatureKey; enabled: boolean }) => {
          flags[ff.featureKey] = ff.enabled
        })
        
        setFeatureFlags(flags)
      } catch (err: any) {
        setError(err.message || "Wystąpił błąd")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatureFlags()
  }, [organizationId])

  const handleToggle = (featureKey: FeatureKey) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/feature-flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureFlags: Object.entries(featureFlags).map(([key, enabled]) => ({
            featureKey: key,
            enabled,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas zapisywania funkcji")
    } finally {
      setIsSaving(false)
    }
  }

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Zarządzanie funkcjami: {organizationName}
        </CardTitle>
        <CardDescription>
          Włącz lub wyłącz funkcje dla tej organizacji. Funkcje Pro są dostępne tylko dla planu PRO.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {Object.values(FEATURE_KEYS).map((featureKey) => (
            <div key={featureKey} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor={featureKey} className="font-semibold cursor-pointer">
                    {featureLabels[featureKey]}
                  </Label>
                  {featureFlags[featureKey] ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {featureDescriptions[featureKey]}
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featureFlags[featureKey]}
                    onChange={() => handleToggle(featureKey)}
                    disabled={isSaving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

