/**
 * Accessibility utilities and helpers
 */

/**
 * Check if color contrast meets WCAG 2.1 AA standards
 * @param foreground - Foreground color in HSL format (e.g., "0 0% 0%")
 * @param background - Background color in HSL format (e.g., "0 0% 100%")
 * @returns true if contrast ratio >= 4.5:1 for normal text or 3:1 for large text
 */
export function checkContrast(foreground: string, background: string): boolean {
  // Simplified contrast check - in production, use a proper library
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return true // Placeholder - implement proper contrast calculation
}

/**
 * Get accessible label for status badge
 */
export function getStatusAriaLabel(status: string, label: string): string {
  return `Status: ${label}`
}

/**
 * Get accessible label for action button
 */
export function getActionAriaLabel(action: string, itemName?: string): string {
  if (itemName) {
    return `${action}: ${itemName}`
  }
  return action
}

/**
 * Keyboard event handlers for accessibility
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key press
   */
  onEnter: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handler()
    }
  },

  /**
   * Handle Escape key press
   */
  onEscape: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      handler()
    }
  },

  /**
   * Handle Arrow keys for navigation
   */
  onArrowKeys: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        onUp?.()
        break
      case "ArrowDown":
        e.preventDefault()
        onDown?.()
        break
      case "ArrowLeft":
        e.preventDefault()
        onLeft?.()
        break
      case "ArrowRight":
        e.preventDefault()
        onRight?.()
        break
    }
  },
}

