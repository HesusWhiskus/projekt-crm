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
    version: '0.9.10-beta',
    date: '2025-01-21',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono błąd serializacji Decimal w komponentach - naprawiono błąd "e.value.toFixed is not a function" występujący przy nawigacji z kalkulacji/polisy/pojazdu na klienta. Dodano sprawdzenie typu przed wywołaniem .toFixed() w komponentach wyświetlających wartości kalkulacji.',
      },
    ],
  },
  {
    version: '0.9.9-beta',
    date: '2025-11-20',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono błąd SelectItem z pustym value - zastąpiono wszystkie value="" specjalnymi wartościami (all/none/unassigned) w 25 miejscach w kodzie. Naprawiono błąd "A <Select.Item /> must have a value prop that is not an empty string" który blokował dostęp do stron klientów, kontaktów i zadań.',
      },
    ],
  },
  {
    version: '0.9.8-beta',
    date: '2025-11-20',
    changes: [
      {
        type: 'fixed',
        description: 'Rollback zmian serializacji dat - cofnięto wprowadzone wcześniej zmiany (parseDate, parseOptionalDate), które powodowały problemy z nawigacją do stron klientów, kontaktów i zadań. Przywrócono oryginalne użycie new Date() w komponentach.',
      },
    ],
  },
  {
    version: '0.9.7-beta',
    date: '2025-11-20',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono serializację dat w komponentach klientów, kontaktów i zadań - utworzono helper functions (parseDate, parseOptionalDate) i zaktualizowano wszystkie client components aby poprawnie konwertowały serializowane stringi ISO z powrotem na obiekty Date. Naprawiono błędy "Application error: a client-side exception has occurred"',
      },
    ],
  },
  {
    version: '0.9.6-beta',
    date: '2025-11-20',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono synchronizację package-lock.json - zregenerowano lock file aby usunąć konflikty wersji pakietów i naprawić błędy podczas builda na Railway',
      },
      {
        type: 'fixed',
        description: 'Naprawiono wyświetlanie metryk wydajności w health check - sekcja jest teraz zawsze widoczna, nawet jeśli nie ma jeszcze danych',
      },
    ],
  },
  {
    version: '0.9.5-beta',
    date: '2025-01-20',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono dostęp do kalkulacji i pojazdów dla ADMIN - może teraz widzieć wszystkie w organizacji',
      },
      {
        type: 'fixed',
        description: 'Naprawiono dostęp do klientów z widoków insurance - agentzy mają dostęp przez swoje kalkulacje, polisy i pojazdy',
      },
      {
        type: 'added',
        description: 'Rozszerzono logi w panelu admina - dodano filtrowanie, paginację, szczegóły i eksport do CSV',
      },
    ],
  },
  {
    version: '0.9.4-beta',
    date: '2025-01-20',
    changes: [
      {
        type: 'added',
        description: 'Zaktualizowano dokumentację Swagger - dodano dokumentację paginacji (page, limit) dla endpointów API',
      },
      {
        type: 'added',
        description: 'Dodano logowanie czasu odpowiedzi - wszystkie główne endpointy API logują czas odpowiedzi i dodają nagłówek X-Response-Time',
      },
      {
        type: 'added',
        description: 'Rozszerzono health check o metryki wydajności - średni czas odpowiedzi, p95, p99, liczba żądań z ostatnich 24h',
      },
    ],
  },
  {
    version: '0.9.3-beta',
    date: '2025-01-20',
    changes: [
      {
        type: 'added',
        description: 'Dodano paginację do API routes (/api/tasks, /api/contacts, /api/clients) z parametrami page i limit',
      },
      {
        type: 'changed',
        description: 'Zoptymalizowano wydajność React komponentów poprzez memoization (React.memo, useMemo, useCallback)',
      },
      {
        type: 'changed',
        description: 'Dodano lazy loading dla ClientDetail i formularzy (ClientForm, TaskForm, ContactForm) dla redukcji initial bundle size',
      },
      {
        type: 'changed',
        description: 'Zoptymalizowano zapytania na dashboardzie - zastąpiono wiele count queries jednym zapytaniem z groupBy',
      },
      {
        type: 'changed',
        description: 'Ogólna optymalizacja wydajności aplikacji - oczekiwana redukcja czasu odpowiedzi o 50-70% dla dużych zbiorów danych',
      },
    ],
  },
  {
    version: '0.9.2-beta',
    date: '2025-01-20',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono klikalność kalendarza - usunięto pointer-events-none który blokował kliknięcia w dni',
      },
      {
        type: 'fixed',
        description: 'Dodano odpowiedni margines do przycisku "Dodaj klienta" w formularzu zadania',
      },
      {
        type: 'changed',
        description: 'Refaktoryzacja kodu nawigacji - wyodrębniono logikę isActive do funkcji pomocniczej (DRY)',
      },
      {
        type: 'changed',
        description: 'Utworzono spójny system z-indexów w CSS variables dla lepszego zarządzania warstwami UI',
      },
      {
        type: 'changed',
        description: 'Uczyniono DataTable bardziej konfigurowalnym - minTableWidth i tooltipThreshold są teraz props',
      },
      {
        type: 'fixed',
        description: 'Usunięto nieużywane props z komponentów (clients z TasksCalendar)',
      },
    ],
  },
  {
    version: '0.9.1-beta',
    date: '2025-01-20',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono klikalność widgetów na dashboardzie - wszystkie widgety prowadzą teraz do odpowiednich widoków',
      },
      {
        type: 'fixed',
        description: 'Naprawiono klikalność kalendarza zadań - zadania nie blokują już kliknięcia w dzień',
      },
      {
        type: 'fixed',
        description: 'Naprawiono z-index formularzy - formularz dodawania klienta jest teraz widoczny nad formularzem zadania',
      },
      {
        type: 'fixed',
        description: 'Naprawiono ucięty przycisk "Dodaj klienta" w formularzu zadania',
      },
      {
        type: 'fixed',
        description: 'Power Admin widzi teraz wszystkie kalkulacje i polisy w organizacji na dashboardzie',
      },
      {
        type: 'added',
        description: 'Dodano drag & drop dla widgetów na dashboardzie - można zmieniać kolejność widgetów',
      },
      {
        type: 'added',
        description: 'Dodano link "Pipeline" do nawigacji ubezpieczeniowej',
      },
      {
        type: 'added',
        description: 'Zaimplementowano pełną stronę raportów sprzedażowych z SalesFunnel i rzeczywistymi danymi',
      },
    ],
  },
  {
    version: '0.9.0-beta',
    date: '2025-01-20',
    changes: [
      {
        type: 'added',
        description: 'Kompleksowa refaktoryzacja UI/UX - nowy design system, system widgetów, uniwersalne komponenty (DataTable, StatusBadge, EmptyState, Tabs, Breadcrumbs i inne)',
      },
      {
        type: 'added',
        description: 'AppLayout z sidebar - lepsza nawigacja na desktop/tablet z możliwością zwijania',
      },
      {
        type: 'added',
        description: 'Widok klientów z zakładkami - Ogólne, Kontakty, Zadania, Historia, Ubezpieczenia',
      },
      {
        type: 'added',
        description: 'Widok zadań z trzema opcjami - lista, kanban, kalendarz',
      },
      {
        type: 'added',
        description: 'Timeline view dla kontaktów z grupowaniem po datach (dzisiaj, wczoraj, ten tydzień, ten miesiąc, starsze)',
      },
      {
        type: 'added',
        description: 'System widgetów na dashboardzie - StatsWidget, ChartWidget, ListWidget z modułową architekturą',
      },
      {
        type: 'added',
        description: 'Zaawansowane filtry z możliwością zwijania i zarządzania aktywnymi filtrami',
      },
      {
        type: 'added',
        description: 'SalesFunnel - wizualizacja lejka sprzedażowego',
      },
      {
        type: 'added',
        description: 'ReportsDashboard - dashboard raportów z zakładkami',
      },
      {
        type: 'changed',
        description: 'Pełna responsywność wszystkich widoków - płynne skalowanie na różnych rozdzielczościach (320px-1920px)',
      },
      {
        type: 'fixed',
        description: 'Poprawiony kontrast kolorów zgodnie z WCAG 2.1 AA dla lepszej dostępności',
      },
      {
        type: 'fixed',
        description: 'Dodane aria-labels i obsługa klawiatury w interaktywnych elementach',
      },
    ],
  },
  {
    version: '0.8.1-beta',
    date: '2025-01-19',
    changes: [
      {
        type: 'added',
        description: 'Dodano skrypt generowania danych testowych dla funkcjonalności agencyjnych - generuje 200 klientów, 300 pojazdów, 400 kalkulacji i 200 polis z pełnymi powiązaniami',
      },
      {
        type: 'added',
        description: 'Nowy skrypt npm: npm run generate:insurance-data - łatwe uruchomienie generowania danych testowych',
      },
    ],
  },
  {
    version: '0.8.0-beta',
    date: '2025-01-19',
    changes: [
      {
        type: 'added',
        description: 'Redesign nawigacji dla agentów ubezpieczeniowych - dropdown menu zamiast pojedynczych linków, lepsza organizacja menu',
      },
      {
        type: 'added',
        description: 'Integracja dashboardów - sekcja agentów ubezpieczeniowych w głównym dashboardzie z statystykami i listami kalkulacji/polis',
      },
      {
        type: 'added',
        description: 'Rozszerzenie formularza klienta - sekcja powiązań ubezpieczeniowych z linkami do tworzenia kalkulacji, polis i pojazdów',
      },
      {
        type: 'changed',
        description: 'Refaktoryzacja feature flags - core features (GDPR, szyfrowanie, walidacja, audyt) są zawsze włączone niezależnie od planu',
      },
    ],
  },
  {
    version: '0.7.0-beta',
    date: '2025-01-19',
    changes: [
      {
        type: 'added',
        description: 'Dodano integrację zarządzania agentami ubezpieczeniowymi w module zarządzania użytkownikami - pełna kontrola z formularza edycji użytkownika',
      },
      {
        type: 'added',
        description: 'Dodano nawigację dla agentów ubezpieczeniowych - linki widoczne w menu głównym dla aktywnych agentów',
      },
      {
        type: 'added',
        description: 'Dodano strony szczegółów i formularze dla pojazdów, kalkulacji i polis - pełna obsługa CRUD z edycją inline',
      },
      {
        type: 'changed',
        description: 'Zrefaktoryzowano moduł zarządzania użytkownikami - zintegrowano zarządzanie agentami ubezpieczeniowymi',
      },
    ],
  },
  {
    version: '0.6.9-beta',
    date: '2025-01-19',
    changes: [
      {
        type: 'added',
        description: 'Dodano pełną obsługę agentów ubezpieczeniowych - backend (DDD), API Routes, UI Components',
      },
      {
        type: 'added',
        description: 'Dodano modele: InsuranceAgent, Vehicle, Calculation, Policy, InsuranceCompany, ExternalSync oraz modele wspierające',
      },
      {
        type: 'added',
        description: 'Dodano Value Objects i Domain Services dla pojazdów, kalkulacji, polis i integracji zewnętrznej',
      },
      {
        type: 'added',
        description: 'Dodano Use Cases dla wszystkich operacji CRUD i biznesowych (pojazdy, kalkulacje, polisy, agenci)',
      },
      {
        type: 'added',
        description: 'Dodano API Routes dla vehicles, calculations, policies, insurance-agents, external integration, validation, security, audit, configuration',
      },
      {
        type: 'added',
        description: 'Dodano Dashboard dla agentów ubezpieczeniowych z statystykami i przeglądem kalkulacji/polis',
      },
      {
        type: 'added',
        description: 'Dodano zakładki w ClientDetail dla pojazdów, kalkulacji i polis (gdy feature flag INSURANCE_AGENTS jest włączony)',
      },
      {
        type: 'added',
        description: 'Dodano formularze: VehicleForm, CalculationForm, PolicyForm',
      },
      {
        type: 'added',
        description: 'Dodano Feature Flags: INSURANCE_AGENTS, INSURANCE_DATA_VALIDATION, GDPR_COMPLIANCE, DATA_ENCRYPTION, AUDIT_LOGGING i inne',
      },
      {
        type: 'added',
        description: 'Dodano seed data dla InsuranceCompany (19 Towarzystw Ubezpieczeniowych)',
      },
      {
        type: 'added',
        description: 'Dodano Pipeline kalkulacji z drag & drop - widok kanban z automatyczną aktualizacją statusu',
      },
      {
        type: 'added',
        description: 'Dodano panele konfiguracji: AgentVisibilitySettings i InsuranceSettingsPanel',
      },
      {
        type: 'added',
        description: 'Dodano podstawowe testy jednostkowe i dokumentację API (README_API.md)',
      },
      {
        type: 'fixed',
        description: 'Naprawiono wszystkie błędy kompilacji TypeScript - pobieranie organizationId z bazy, poprawki sygnatur use cases, DTO i typów',
      },
    ],
  },
  {
    version: '0.6.8-beta',
    date: '2025-01-19',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono problem z niedostępnością dokumentacji API w panelu administracyjnym - dokumentacja działa teraz poprawnie w środowisku produkcyjnym',
      },
      {
        type: 'fixed',
        description: 'Naprawiono problem z nieskończonym ładowaniem przy pierwszym logowaniu - logowanie działa teraz natychmiast',
      },
    ],
  },
  {
    version: '0.6.7-beta',
    date: '2025-01-17',
    changes: [
      {
        type: 'added',
        description: 'Dodano sekcję "Dokumentacja i narzędzia" w panelu administracyjnym z dostępem do Swagger UI, dokumentacji API i dokumentacji projektu',
      },
    ],
  },
  {
    version: '0.6.6-beta',
    date: '2025-11-17',
    changes: [
      {
        type: 'fixed',
        description: 'Naprawiono kafelki "Bez kontaktu" na dashboardzie - teraz pokazują tylko klientów przypisanych do użytkownika, a nie wszystkich z bazy',
      },
      {
        type: 'fixed',
        description: 'Naprawiono znacznik "Co nowego" - teraz jest per użytkownik (zapis w bazie danych) zamiast globalnego localStorage',
      },
    ],
  },
  {
    version: '0.6.5-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'added',
        description: 'Dodano paginację po stronie serwera dla listy klientów - znacznie poprawia wydajność przy dużej liczbie rekordów',
      },
      {
        type: 'changed',
        description: 'Przeniesiono sortowanie i filtrowanie na serwer - eliminuje przetwarzanie po stronie klienta i poprawia wydajność',
      },
    ],
  },
  {
    version: '0.6.4-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'fixed',
        description: 'Przeprojektowano strukturę tabeli klientów - usunięto konfliktujące style, zmieniono na table-layout: fixed z procentowymi szerokościami kolumn dla stabilnej szerokości i poprawnego skalowania na różnych rozdzielczościach',
      },
    ],
  },
  {
    version: '0.6.3-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'added',
        description: 'Dodano wyszukiwanie klientów w formularzach - rozwiązuje problem z wydajnością przy dużej liczbie klientów',
      },
      {
        type: 'added',
        description: 'Dodano narzędzie masowego przydzielania klientów w sekcji Admin',
      },
      {
        type: 'fixed',
        description: 'Naprawiono problem z nieskończonym scrollowaniem w listach wyboru klientów',
      },
      {
        type: 'changed',
        description: 'Zoptymalizowano zapytania do bazy - formularze nie pobierają już wszystkich klientów na raz',
      },
    ],
  },
  {
    version: '0.6.2-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'fixed',
        description: 'Ukryto funkcje PRO dla użytkowników bez organizacji i z planem BASIC - funkcje PRO są teraz całkowicie niewidoczne w menu',
      },
      {
        type: 'fixed',
        description: 'Poprawiono stronę Funkcje PRO - dla użytkowników bez PRO wyświetla komunikat zamiast listy funkcji',
      },
      {
        type: 'changed',
        description: 'Zmieniono logikę kontroli dostępu - funkcje PRO wymagają organizacji z planem PRO',
      },
    ],
  },
  {
    version: '0.6.1-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'fixed',
        description: 'Optymalizacja nawigacji górnej - przeniesienie mniej używanych funkcji do menu "Więcej", poprawa responsywności',
      },
      {
        type: 'fixed',
        description: 'Naprawiono błędy 404 dla stron Raporty, Funkcje PRO i Integracje - poprawiono linki zgodnie z Next.js App Router',
      },
      {
        type: 'fixed',
        description: 'Dodano działające formularze dla kluczy API, webhooków i niestandardowych pól z modalem Dialog',
      },
      {
        type: 'fixed',
        description: 'Naprawiono nieaktywne przyciski "Utwórz" w ustawieniach - dodano onClick handlery i integrację z formularzami',
      },
      {
        type: 'added',
        description: 'Komponent MoreMenu z dropdown dla mniej używanych funkcji (Funkcje PRO, Integracje)',
      },
      {
        type: 'added',
        description: 'Formularze tworzenia: ApiKeyForm, WebhookForm, CustomFieldForm z pełną funkcjonalnością',
      },
      {
        type: 'added',
        description: 'API endpoints dla kluczy API, webhooków i niestandardowych pól z walidacją uprawnień PRO',
      },
      {
        type: 'added',
        description: 'Komponenty UI: Dialog, Checkbox, DropdownMenu (Radix UI)',
      },
      {
        type: 'changed',
        description: 'Zoptymalizowano layout nawigacji DashboardNav - zmniejszono padding, dodano MoreMenu',
      },
      {
        type: 'changed',
        description: 'Zaktualizowano wszystkie linki z /dashboard/... na /... zgodnie z Next.js App Router',
      },
    ],
  },
  {
    version: '0.6.0-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'added',
        description: 'Implementacja funkcjonalności PRO - dodano strony dla zaawansowanych raportów, kluczy API, webhooków, niestandardowych pól i integracji',
      },
      {
        type: 'added',
        description: 'Strona "Funkcje PRO" - przegląd wszystkich dostępnych funkcji PRO z informacją o statusie',
      },
      {
        type: 'added',
        description: 'Nawigacja warunkowa - linki do funkcji PRO widoczne tylko dla użytkowników z planem PRO',
      },
      {
        type: 'added',
        description: 'Badge "PRO" obok użytkownika w nawigacji gdy ma plan PRO',
      },
      {
        type: 'changed',
        description: 'Walidacja planu w panelu administracyjnym - blokowanie włączania funkcji PRO dla organizacji z planem BASIC',
      },
    ],
  },
  {
    version: '0.5.5-beta',
    date: '2025-11-13',
    changes: [
      {
        type: 'added',
        description: 'Dodano pola PESEL (dla osoby fizycznej) i REGON (dla firmy) w formularzu klienta',
      },
      {
        type: 'added',
        description: 'Dodano wybór organizacji przy rejestracji - użytkownicy mogą wybrać organizację podczas rejestracji',
      },
      {
        type: 'fixed',
        description: 'Naprawiono panel administracyjny - wszystkie karty są teraz klikalne i prowadzą do stron zarządzania',
      },
    ],
  },
  {
    version: '0.5.4-beta',
    date: '2025-11-13',
    changes: [
      {
        type: 'fixed',
        description: 'Kompletna migracja ClientType i companyName wykonana - dodano enum ClientType, kolumny type, companyName i taxId',
      },
      {
        type: 'fixed',
        description: 'Poprawiono składnię SQL migracji - użyto IF NOT EXISTS i bezpiecznego tworzenia enum',
      },
    ],
  },
  {
    version: '0.5.3-beta',
    date: '2025-11-13',
    changes: [
      {
        type: 'fixed',
        description: 'Migracja companyName wykonana - przywrócono pełną funkcjonalność obsługi klientów typu COMPANY',
      },
      {
        type: 'changed',
        description: 'Użyto railway ssh do wykonania migracji (Railway CLI nie może połączyć się z bazą przez railway run)',
      },
    ],
  },
  {
    version: '0.5.2-beta',
    date: '2025-11-13',
    changes: [
      {
        type: 'added',
        description: 'Wybór organizacji w rejestracji - możliwość wyboru organizacji podczas rejestracji konta',
      },
      {
        type: 'fixed',
        description: 'Błąd Application error - dodano komentarze wskazujące na wymaganą migrację companyName',
      },
    ],
  },
  {
    version: '0.5.1-beta',
    date: '2025-11-13',
    changes: [
      {
        type: 'fixed',
        description: 'Krytyczne błędy "Application error" - naprawiono błędy spowodowane brakującymi kolumnami w bazie (companyName, lastContactAt, nextFollowUpAt)',
      },
      {
        type: 'fixed',
        description: 'Utworzono migrację dla kolumny companyName - przywrócono pełną funkcjonalność obsługi klientów typu COMPANY',
      },
      {
        type: 'fixed',
        description: 'Przywrócono filtry prospecting (bez kontaktu 7+/30+ dni, follow-up dzisiaj) na dashboardzie i stronie klientów',
      },
    ],
  },
  {
    version: '0.5.0-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'security',
        description: 'Zabezpieczenie API - rate limiting na wszystkich endpointach, centralizowane logowanie aktywności',
      },
      {
        type: 'added',
        description: 'Responsywność mobilna - tabele jako karty na mobile, hamburger menu w nawigacji',
      },
      {
        type: 'added',
        description: 'Wersje Basic/Pro - system organizacji i feature flags dla konfiguracji funkcji',
      },
      {
        type: 'added',
        description: 'Typ klienta - obsługa osób fizycznych (PERSON) i firm (COMPANY) z warunkowymi polami',
      },
      {
        type: 'added',
        description: 'Integracje zewnętrzne (Pro) - dynamiczne zakładki integracji dla klientów',
      },
      {
        type: 'added',
        description: 'Rozproszona baza danych - cache manager z IndexedDB, synchronizacja i offline support',
      },
    ],
  },
  {
    version: '0.4.5-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'changed',
        description: 'REFACTOR: Rozdzielenie notatek od kontaktów - utworzono osobny endpoint /api/notes i komponent NoteForm',
      },
      {
        type: 'added',
        description: 'Nowy endpoint /api/notes dla notatek - zawsze ustawia isNote=true, nie aktualizuje lastContactAt',
      },
      {
        type: 'added',
        description: 'Nowy komponent NoteForm - dedykowany formularz dla notatek z uproszczonym interfejsem',
      },
      {
        type: 'fixed',
        description: 'Krytyczny bug z dodawaniem notatek - rozwiązany poprzez refaktor i rozdzielenie funkcjonalności',
      },
    ],
  },
  {
    version: '0.4.4-beta',
    date: '2025-01-15',
    changes: [
      {
        type: 'fixed',
        description: 'Krytyczny bug z dodawaniem notatek - naprawiono problem z zapisywaniem notatek (błąd "kontakt nie znaleziony")',
      },
      {
        type: 'fixed',
        description: 'Poprawiono inicjalizację clientId w ContactForm - teraz zawsze używa clientId z props gdy contact.clientId nie jest dostępne',
      },
      {
        type: 'changed',
        description: 'Dodano walidację clientId przed wysłaniem formularza - zapobiega wysyłaniu pustego clientId',
      },
    ],
  },
  {
    version: '0.4.3-beta',
    date: '2025-11-10',
    changes: [
      {
        type: 'added',
        description: 'Optymalizacje wydajności - naprawiono N+1 queries, dodano indeksy do bazy, cache dla users/groups',
      },
      {
        type: 'changed',
        description: 'ListClientsUseCase i GetClientUseCase używają teraz zoptymalizowanych metod pobierania relacji',
      },
      {
        type: 'fixed',
        description: 'Eliminacja N+1 queries - wszystkie relacje pobierane w jednym zapytaniu zamiast osobnych zapytań dla każdego rekordu',
      },
    ],
  },
  {
    version: '0.4.2-beta',
    date: '2025-11-10',
    changes: [
      {
        type: 'fixed',
        description: 'Usunięcie duplikacji w panelu admina - pozostały tylko estetyczne karty statystyk',
      },
      {
        type: 'fixed',
        description: 'Logo adaptujące się do stylu - poprawne filtry CSS dla light/dark mode',
      },
      {
        type: 'fixed',
        description: 'Blokada przycisku logowania - przycisk pozostaje zablokowany aż do przekierowania',
      },
      {
        type: 'fixed',
        description: 'Poprawa selektora daty/czasu - wrócono do datetime-local z lepszą precyzją',
      },
      {
        type: 'fixed',
        description: 'Naprawa stref czasowych - poprawiona konwersja UTC na lokalną strefę czasową przeglądarki',
      },
    ],
  },
  {
    version: '0.4.1-beta',
    date: '2025-11-07',
    changes: [
      {
        type: 'fixed',
        description: 'Zablokowanie wielokrotnego kliknięcia przycisku logowania - zapobieganie wielokrotnym requestom',
      },
      {
        type: 'fixed',
        description: 'Usunięcie duplikacji w panelu admina - usunięto zdublowane karty zarządzania',
      },
      {
        type: 'fixed',
        description: 'Wyróżnik dla zadań niewykonanych w terminie - wizualne oznaczenie w liście i kalendarzu',
      },
      {
        type: 'fixed',
        description: 'Logo adaptujące się do stylu - automatyczne dostosowanie do dark/light mode',
      },
      {
        type: 'fixed',
        description: 'Poprawa selektora daty/czasu - precyzyjny wybór godzin i minut (co 5 minut)',
      },
      {
        type: 'added',
        description: 'Obsługa strefy czasowej - wybór strefy czasowej w ustawieniach, formatowanie dat z uwzględnieniem strefy',
      },
    ],
  },
  {
    version: '0.4.0-beta',
    date: '2025-11-07',
    changes: [
      {
        type: 'changed',
        description: 'REFACTORING: Wprowadzono architekturę Domain-Driven Design (DDD) i Single Responsibility Principle (SRP)',
      },
      {
        type: 'added',
        description: 'Warstwa domenowa (domain/) - Value Objects, Entities, Domain Services dla Client, Contact i Task',
      },
      {
        type: 'added',
        description: 'Warstwa aplikacyjna (application/) - Use Cases i DTO dla operacji biznesowych',
      },
      {
        type: 'added',
        description: 'Warstwa infrastruktury (infrastructure/) - Implementacje repozytoriów Prisma i ActivityLogger',
      },
      {
        type: 'added',
        description: 'Warstwa prezentacji (presentation/) - Refaktoryzowane API routes z middleware autoryzacji',
      },
      {
        type: 'changed',
        description: 'API routes dla Client - teraz używają Use Cases zamiast bezpośredniego dostępu do bazy danych',
      },
      {
        type: 'changed',
        description: 'Walidacja danych - przeniesiona do Value Objects z pełną enkapsulacją logiki biznesowej',
      },
      {
        type: 'changed',
        description: 'Logika biznesowa - enkapsulowana w Entities z metodami changeStatus, updatePriority, assignTo',
      },
      {
        type: 'added',
        description: 'ClientStatusChangeService - Domain Service do obsługi zmian statusu z historią',
      },
      {
        type: 'changed',
        description: 'Separacja odpowiedzialności - każda klasa ma jedną odpowiedzialność zgodnie z SRP',
      },
      {
        type: 'changed',
        description: 'Testowalność - logika biznesowa może być testowana niezależnie od infrastruktury',
      },
    ],
  },
  {
    version: '0.3.1-beta',
    date: '2025-11-07',
    changes: [
      {
        type: 'fixed',
        description: 'Równość priorytetów w kolumnie - wszystkie priorytety mają jednakową szerokość (min-w-[100px])',
      },
      {
        type: 'fixed',
        description: 'Poprawiono widoczność wszystkich pól w ustawieniach w trybie ciemnym - zastąpiono hardcoded kolory zmiennymi CSS',
      },
      {
        type: 'fixed',
        description: 'Naprawiono formatowanie logo - teraz wszystkie obrazy (PNG, JPG, SVG, kwadratowe, prostokątne) są zawsze formatowane do prostokąta 224x64px z wypełnieniem całego pola (cover style)',
      },
      {
        type: 'added',
        description: 'Automatyczna konwersja i skalowanie logo - preferowany rozmiar 224x64px, automatyczna konwersja do PNG',
      },
      {
        type: 'changed',
        description: 'Dodano informację o preferowanym rozmiarze logo (224x64px, proporcje 3.5:1) w formularzu',
      },
    ],
  },
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

