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
    version: '0.3.0-beta',
    date: '2025-11-07',
    changes: [
      {
        type: 'added',
        description: 'Tryb jasny/ciemny - pełna obsługa dark mode w całej aplikacji',
      },
      {
        type: 'added',
        description: 'Kolumna priorytetu w liście klientów z kolorowym oznaczeniem (Niski/Średni/Wysoki)',
      },
      {
        type: 'added',
        description: 'Kolorowe oznaczenia statusów klientów dla lepszej wizualizacji (Nowy lead, W kontakcie, Demo wysłane, itp.)',
      },
      {
        type: 'changed',
        description: 'Optymalizacja szerokości kolumn w tabeli klientów - telefon i status są węższe, dodano priorytet',
      },
      {
        type: 'changed',
        description: 'Płynny selector trybu jasny/ciemny - przyciski zamiast listy rozwijanej',
      },
      {
        type: 'fixed',
        description: 'Równość statusów w kolumnie - wszystkie statusy mają jednakową szerokość',
      },
      {
        type: 'fixed',
        description: 'Czytelność zakładek i nazwy użytkownika w trybie ciemnym',
      },
      {
        type: 'fixed',
        description: 'Tabela klientów działa poprawnie w trybie ciemnym',
      },
      {
        type: 'fixed',
        description: 'Status zadań jest widoczny w trybie ciemnym',
      },
    ],
  },
  {
    version: '0.2.0-beta',
    date: '2025-11-06',
    changes: [
      {
        type: 'added',
        description: 'Funkcje prospecting: priorytety klientów (LOW/MEDIUM/HIGH), ostatni kontakt, następny follow-up',
      },
      {
        type: 'added',
        description: 'Rozróżnienie notatek od kontaktów - możliwość tworzenia notatek bez typu kontaktu',
      },
      {
        type: 'added',
        description: 'Sekcja "Zarządzanie leadami" na Dashboard z szybkimi filtrami (bez kontaktu 7+/30+ dni, follow-up dzisiaj)',
      },
      {
        type: 'added',
        description: 'Filtrowanie kontaktów w ClientDetail - możliwość przeglądania kontaktów i notatek osobno',
      },
      {
        type: 'changed',
        description: 'Automatyczna aktualizacja daty ostatniego kontaktu przy dodawaniu kontaktu (nie notatki)',
      },
    ],
  },
  {
    version: '0.1.4-beta',
    date: '2025-11-06',
    changes: [
      {
        type: 'fixed',
        description: 'KRYTYCZNA NAPRAWA: Usunięto błędną walidację UUID - system używa CUID, nie UUID. Naprawiono błąd "Nieprawidłowy format ID" przy edycji',
      },
      {
        type: 'fixed',
        description: 'Naprawiono zapamiętywanie wybranego klienta przy edycji kontaktu',
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

