"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ColorSchemePickerProps {
  value?: {
    primaryColor?: string | null
    themeName?: string | null
  } | null
  defaultColorScheme?: {
    primaryColor?: string
    themeName?: string
  } | null
  onChange: (colorScheme: { primaryColor?: string; themeName: string }) => void
  showSystemOption?: boolean
}

const predefinedThemes = [
  { name: "blue", label: "Niebieski", color: "#3b82f6" },
  { name: "green", label: "Zielony", color: "#10b981" },
  { name: "purple", label: "Fioletowy", color: "#8b5cf6" },
  { name: "red", label: "Czerwony", color: "#ef4444" },
]

export function ColorSchemePicker({
  value,
  defaultColorScheme,
  onChange,
  showSystemOption = false,
}: ColorSchemePickerProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(
    value?.themeName || defaultColorScheme?.themeName || "blue"
  )
  const [customColor, setCustomColor] = useState<string>(
    value?.primaryColor || defaultColorScheme?.primaryColor || "#3b82f6"
  )

  useEffect(() => {
    if (value?.themeName) {
      setSelectedTheme(value.themeName)
      if (value.primaryColor) {
        setCustomColor(value.primaryColor)
      }
    }
  }, [value])

  const handleThemeSelect = (themeName: string, color: string) => {
    setSelectedTheme(themeName)
    onChange({ themeName, primaryColor: color })
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    setSelectedTheme("custom")
    onChange({ themeName: "custom", primaryColor: color })
  }

  const handleSystemTheme = () => {
    setSelectedTheme("system")
    onChange({
      themeName: "system",
      primaryColor: defaultColorScheme?.primaryColor || "#3b82f6",
    })
  }

  const currentColor =
    selectedTheme === "custom"
      ? customColor
      : selectedTheme === "system"
      ? defaultColorScheme?.primaryColor || "#3b82f6"
      : predefinedThemes.find((t) => t.name === selectedTheme)?.color || "#3b82f6"

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Predefiniowane motywy</Label>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {predefinedThemes.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => handleThemeSelect(theme.name, theme.color)}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                selectedTheme === theme.name && selectedTheme !== "custom" && selectedTheme !== "system"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className="w-12 h-12 rounded-full mb-2"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-xs font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showSystemOption && defaultColorScheme && (
        <div>
          <Label className="text-base font-semibold">Domyślna kolorystyka systemu</Label>
          <button
            type="button"
            onClick={handleSystemTheme}
            className={`mt-3 w-full flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
              selectedTheme === "system"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className="w-8 h-8 rounded-full mr-3"
              style={{
                backgroundColor: defaultColorScheme.primaryColor || "#3b82f6",
              }}
            />
            <span className="font-medium">Użyj domyślnej kolorystyki systemu</span>
          </button>
        </div>
      )}

      <div>
        <Label htmlFor="customColor" className="text-base font-semibold">
          Niestandardowy kolor
        </Label>
        <div className="mt-3 flex items-center space-x-3">
          <Input
            id="customColor"
            type="color"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            type="text"
            value={customColor}
            onChange={(e) => {
              const color = e.target.value
              if (/^#[0-9A-F]{6}$/i.test(color)) {
                handleCustomColorChange(color)
              } else {
                setCustomColor(color)
              }
            }}
            placeholder="#3b82f6"
            className="flex-1"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Wybierz niestandardowy kolor główny dla interfejsu
        </p>
      </div>

      <div className="pt-4 border-t">
        <Label className="text-base font-semibold mb-3 block">Podgląd</Label>
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: currentColor + "10",
            borderColor: currentColor + "30",
          }}
        >
          <div className="space-y-3">
            <Button
              style={{
                backgroundColor: currentColor,
                borderColor: currentColor,
              }}
              className="text-white hover:opacity-90"
            >
              Przykładowy przycisk
            </Button>
            <div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: currentColor }}
                className="font-medium hover:underline"
              >
                Przykładowy link
              </a>
            </div>
            <div
              className="px-3 py-2 rounded-md text-sm font-medium"
              style={{
                backgroundColor: currentColor + "20",
                color: currentColor,
              }}
            >
              Przykładowy akcent
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

