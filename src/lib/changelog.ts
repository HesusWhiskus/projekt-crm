/**
 * Changelog data for "What's New" feature
 * Update this file when releasing new versions
 */

export interface ChangelogEntry {
  version: string
  date: string
  changes: {
    type: 'added' | 'changed' | 'fixed' | 'security'
    description: string
  }[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.1.3-beta',
    date: '2025-11-06',
    changes: [
      {
        type: 'fixed',
        description: 'Przywrócono oryginalną walidację dla opcjonalnych pól UUID - naprawiono błędy przy zapisywaniu/edytowaniu zadań, klientów i kontaktów',
      },
    ],
  },
  {
    version: '0.1.2-beta',
    date: '2025-11-06',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono walidację UUID dla wszystkich opcjonalnych pól (klienci, kontakty, zadania) - problem z zapisywaniem i edytowaniem',
      },
    ],
  },
  {
    version: '0.1.1-beta',
    date: '2025-11-06',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono walidację UUID dla opcjonalnych pól w zadaniach (assignedTo, clientId)',
      },
    ],
  },
  {
    version: '0.1.0-beta',
    date: '2025-11-06',
    changes: [
      {
        type: 'added',
        description: 'System wersjonowania aplikacji i komponent "Co nowego"',
      },
      {
        type: 'added',
        description: 'Integracja z Google Calendar API i synchronizacja zadań',
      },
      {
        type: 'added',
        description: 'System zarządzania klientami, kontaktami i zadaniami (CRUD)',
      },
      {
        type: 'added',
        description: 'Kalendarz zadań z możliwością klikania i dodawania zadań',
      },
      {
        type: 'added',
        description: 'System grup użytkowników i panel administracyjny',
      },
      {
        type: 'added',
        description: 'Import/Export danych (CSV, Excel)',
      },
      {
        type: 'changed',
        description: 'Zaktualizowano limity znaków pól zgodnie ze standardami branżowymi',
      },
      {
        type: 'security',
        description: 'Rate limiting, walidacja uploadów, CSP headers, walidacja siły hasła',
      },
    ],
  },
]

/**
 * Get the latest version from changelog
 */
export function getLatestVersion(): string {
  return changelog[0]?.version || '0.1.0-beta'
}

/**
 * Get changelog entries for a specific version
 */
export function getChangelogForVersion(version: string): ChangelogEntry | undefined {
  return changelog.find((entry) => entry.version === version)
}

/**
 * Get all changelog entries
 */
export function getAllChangelogs(): ChangelogEntry[] {
  return changelog
}

