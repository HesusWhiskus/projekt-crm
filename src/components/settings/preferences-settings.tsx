"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ColorSchemePicker } from "./color-scheme-picker"
import { COMMON_TIMEZONES, getUserTimezone } from "@/lib/timezone"

interface PreferencesSettingsProps {
  preferences: {
    id?: string
    primaryColor?: string | null
    themeName?: string | null
    theme?: string | null
    language?: string | null
    timezone?: string | null
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
  const { theme, setTheme } = useTheme()
  const [colorScheme, setColorScheme] = useState<{
    primaryColor?: string
    themeName: string
  }>({
    primaryColor: preferences?.primaryColor || defaultColorScheme?.primaryColor || "#3b82f6",
    themeName: preferences?.themeName || defaultColorScheme?.themeName || "blue",
  })
  const [currentTheme, setCurrentTheme] = useState<string>(preferences?.theme || theme || "light")
  const [timezone, setTimezone] = useState<string>(
    preferences?.timezone || getUserTimezone()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (preferences?.theme) {
      setCurrentTheme(preferences.theme)
      setTheme(preferences.theme)
    }
  }, [preferences?.theme, setTheme])

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
          theme: currentTheme,
          timezone: timezone,
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
      setTheme(currentTheme)
      router.refresh()
    } catch (error) {
      setError("Wystąpił błąd podczas zapisywania preferencji")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tryb wyświetlania</CardTitle>
          <CardDescription>
            Wybierz tryb jasny lub ciemny
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Motyw</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={currentTheme === "light" ? "default" : "outline"}
                onClick={() => setCurrentTheme("light")}
                className="flex-1"
              >
                Jasny
              </Button>
              <Button
                type="button"
                variant={currentTheme === "dark" ? "default" : "outline"}
                onClick={() => setCurrentTheme("dark")}
                className="flex-1"
              >
                Ciemny
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strefa czasowa</CardTitle>
          <CardDescription>
            Wybierz strefę czasową dla wyświetlania dat i godzin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Strefa czasowa</Label>
            <Select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Wszystkie daty i godziny będą wyświetlane zgodnie z wybraną strefą czasową
            </p>
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}

