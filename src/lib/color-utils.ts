/**
 * Utility functions for color scheme management
 * Handles conversion between hex and HSL color formats
 * and applies color schemes to the document
 */

export interface Theme {
  name: string
  label: string
  color: string
}

/**
 * Converts hex color to HSL format
 * @param hex - Hex color string (e.g., "#f97316")
 * @returns HSL color string (e.g., "24.6 95% 53.1%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "")
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  // Convert to percentages and round
  h = Math.round(h * 360 * 10) / 10
  s = Math.round(s * 100 * 10) / 10
  const lPercent = Math.round(l * 100 * 10) / 10

  return `${h} ${s}% ${lPercent}%`
}

/**
 * Gets the color for a theme name from predefined themes
 * @param themeName - Name of the theme
 * @param predefinedThemes - Array of predefined themes
 * @returns Hex color string or default orange color
 */
export function getThemeColor(
  themeName: string,
  predefinedThemes: Theme[]
): string {
  const theme = predefinedThemes.find((t) => t.name === themeName)
  return theme?.color || "#f97316" // Default to orange (iBooster)
}

/**
 * Applies color scheme to the document by updating CSS variables
 * @param primaryColor - Primary color in hex format (e.g., "#f97316")
 * @param themeName - Name of the theme (for reference)
 */
export function applyColorScheme(primaryColor: string, themeName: string): void {
  if (typeof window === "undefined") return

  // Convert hex to HSL
  const hsl = hexToHsl(primaryColor)

  // Update CSS variables
  document.documentElement.style.setProperty("--primary", hsl)
  document.documentElement.style.setProperty("--accent", hsl)
  document.documentElement.style.setProperty("--ring", hsl)

  // Also update --color-primary for compatibility
  document.documentElement.style.setProperty("--color-primary", primaryColor)

  // Set data-theme attribute
  document.documentElement.setAttribute("data-theme", themeName)
}

