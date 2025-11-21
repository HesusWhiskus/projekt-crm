"use client"

import { useEffect } from "react"
import { applyColorScheme, getThemeColor, type Theme } from "@/lib/color-utils"

interface ColorSchemeApplierProps {
  userColorScheme: {
    primaryColor?: string | null
    themeName?: string | null
  } | null
  defaultColorScheme: {
    primaryColor?: string
    themeName?: string
  } | null
}

export function ColorSchemeApplier({
  userColorScheme,
  defaultColorScheme,
}: ColorSchemeApplierProps) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const predefinedThemes: Theme[] = [
      { name: "orange", label: "Pomarańczowy", color: "#f97316" },
      { name: "blue", label: "Niebieski", color: "#3b82f6" },
      { name: "green", label: "Zielony", color: "#10b981" },
      { name: "purple", label: "Fioletowy", color: "#8b5cf6" },
      { name: "red", label: "Czerwony", color: "#ef4444" },
    ]

    const themeName = userColorScheme?.themeName || defaultColorScheme?.themeName || "orange"
    let primaryColor: string

    if (themeName === "system" && defaultColorScheme) {
      primaryColor = defaultColorScheme.primaryColor || "#f97316"
    } else if (themeName === "custom") {
      primaryColor = userColorScheme?.primaryColor || "#f97316"
    } else {
      // Predefined theme
      primaryColor = getThemeColor(themeName, predefinedThemes)
    }

    applyColorScheme(primaryColor, themeName)
  }, [userColorScheme, defaultColorScheme])

  return null
}

