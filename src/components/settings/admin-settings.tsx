"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminBranding } from "./admin-branding"
import { ColorSchemePicker } from "./color-scheme-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AdminSettingsProps {
  systemName: string
  systemLogo: string | null
  defaultColorScheme: {
    primaryColor?: string
    themeName?: string
  } | null
}

export function AdminSettings({
  systemName: initialSystemName,
  systemLogo: initialSystemLogo,
  defaultColorScheme: initialDefaultColorScheme,
}: AdminSettingsProps) {
  const router = useRouter()
  const [defaultColorScheme, setDefaultColorScheme] = useState<{
    primaryColor?: string
    themeName: string
  }>({
    primaryColor: initialDefaultColorScheme?.primaryColor || "#3b82f6",
    themeName: initialDefaultColorScheme?.themeName || "blue",
  })
  const [isSavingColorScheme, setIsSavingColorScheme] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleBrandingSave = async (data: {
    systemName: string
    logo?: File | null
  }) => {
    const formData = new FormData()
    formData.append("systemName", data.systemName)
    if (data.logo) {
      formData.append("logo", data.logo)
    } else if (data.logo === null) {
      // Explicitly remove logo
      formData.append("removeLogo", "true")
    }

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Błąd podczas zapisywania ustawień")
    }

    router.refresh()
  }

  const handleColorSchemeSave = async () => {
    setError(null)
    setSuccess(null)
    setIsSavingColorScheme(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultColorScheme: {
            primaryColor: defaultColorScheme.primaryColor,
            themeName: defaultColorScheme.themeName,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas zapisywania kolorystyki")
        return
      }

      setSuccess("Domyślna kolorystyka została zapisana")
      router.refresh()
    } catch (error) {
      setError("Wystąpił błąd podczas zapisywania kolorystyki")
    } finally {
      setIsSavingColorScheme(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminBranding
        systemName={initialSystemName}
        systemLogo={initialSystemLogo}
        onSave={handleBrandingSave}
      />

      <Card>
        <CardHeader>
          <CardTitle>Domyślna kolorystyka systemu</CardTitle>
          <CardDescription>
            Ustaw domyślną kolorystykę dla nowych użytkowników
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
              {success}
            </div>
          )}

          <ColorSchemePicker
            value={{
              primaryColor: defaultColorScheme.primaryColor,
              themeName: defaultColorScheme.themeName,
            }}
            onChange={setDefaultColorScheme}
            showSystemOption={false}
          />

          <div className="pt-4 border-t">
            <Button onClick={handleColorSchemeSave} disabled={isSavingColorScheme}>
              {isSavingColorScheme ? "Zapisywanie..." : "Zapisz domyślną kolorystykę"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

