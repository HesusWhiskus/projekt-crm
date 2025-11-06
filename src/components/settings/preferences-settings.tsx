"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorSchemePicker } from "./color-scheme-picker"

interface PreferencesSettingsProps {
  preferences: {
    id?: string
    primaryColor?: string | null
    themeName?: string | null
    theme?: string | null
    language?: string | null
    emailTasks?: boolean
    emailContacts?: boolean
  } | null
  defaultColorScheme: {
    primaryColor?: string
    themeName?: string
  } | null
}

export function PreferencesSettings({
  preferences,
  defaultColorScheme,
}: PreferencesSettingsProps) {
  const router = useRouter()
  const [colorScheme, setColorScheme] = useState<{
    primaryColor?: string
    themeName: string
  }>({
    primaryColor: preferences?.primaryColor || defaultColorScheme?.primaryColor || "#3b82f6",
    themeName: preferences?.themeName || defaultColorScheme?.themeName || "blue",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Apply color scheme to document (only on client)
    if (typeof window === "undefined") return

    if (colorScheme.themeName === "system" && defaultColorScheme) {
      document.documentElement.style.setProperty(
        "--color-primary",
        defaultColorScheme.primaryColor || "#3b82f6"
      )
    } else {
      document.documentElement.style.setProperty(
        "--color-primary",
        colorScheme.primaryColor || "#3b82f6"
      )
    }
    document.documentElement.setAttribute("data-theme", colorScheme.themeName)
  }, [colorScheme, defaultColorScheme])

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          colorScheme: {
            primaryColor: colorScheme.primaryColor,
            themeName: colorScheme.themeName,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas zapisywania preferencji")
        return
      }

      setSuccess("Preferencje zostały zapisane pomyślnie")
      router.refresh()
    } catch (error) {
      setError("Wystąpił błąd podczas zapisywania preferencji")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kolorystyka interfejsu</CardTitle>
        <CardDescription>
          Dostosuj kolory interfejsu do swoich preferencji
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
          value={preferences}
          defaultColorScheme={defaultColorScheme}
          onChange={setColorScheme}
          showSystemOption={!!defaultColorScheme}
        />

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

