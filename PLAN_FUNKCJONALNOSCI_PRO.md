# Plan implementacji funkcjonalności PRO

## Analiza obecnego stanu

### Zdefiniowane funkcjonalności PRO:
1. **MULTI_TENANT** - Multi-tenant (wiele organizacji) ✅ (już działa - system organizacji)
2. **ADVANCED_REPORTS** - Zaawansowane raporty ❌ (brak UI)
3. **EXTERNAL_INTEGRATIONS** - Integracje zewnętrzne ❌ (brak UI)
4. **API_KEYS** - Klucze API ❌ (brak UI)
5. **CUSTOM_FIELDS** - Niestandardowe pola ❌ (brak UI)
6. **INTEGRATION_TABS** - Zakładki integracji ✅ (zaimplementowane w szczegółach klienta)
7. **WEBHOOKS** - Webhooks ❌ (jest endpoint API, brak UI)

### Problem:
- Funkcjonalności PRO są zdefiniowane w feature flags
- System sprawdza plan organizacji i włącza funkcje dla PRO
- **ALE** większość funkcjonalności nie ma interfejsu użytkownika
- Użytkownik nie widzi żadnych różnic między BASIC a PRO

## Plan implementacji

### Faza 1: Strony/komponenty dla funkcjonalności PRO

#### 1.1 Zaawansowane raporty (ADVANCED_REPORTS)
**Lokalizacja:** `/dashboard/reports` (nowa strona)

**Funkcjonalności:**
- Raporty sprzedażowe (przychód, konwersja, pipeline)
- Raporty aktywności (kontakty, zadania, follow-up)
- Raporty klientów (status, priorytet, źródło)
- Eksport raportów do Excel/PDF
- Filtry czasowe (dzień, tydzień, miesiąc, kwartał, rok)
- Wykresy i wizualizacje

**Komponenty:**
- `src/app/(dashboard)/reports/page.tsx` - strona główna raportów
- `src/components/reports/reports-list.tsx` - lista dostępnych raportów
- `src/components/reports/sales-report.tsx` - raport sprzedażowy
- `src/components/reports/activity-report.tsx` - raport aktywności
- `src/components/reports/client-report.tsx` - raport klientów

#### 1.2 Klucze API (API_KEYS)
**Lokalizacja:** `/dashboard/settings/api-keys` (nowa strona w ustawieniach)

**Funkcjonalności:**
- Lista kluczy API użytkownika/organizacji
- Generowanie nowych kluczy API
- Usuwanie kluczy API
- Wyświetlanie daty utworzenia i ostatniego użycia
- Kopiowanie klucza do schowka
- Ostrzeżenia bezpieczeństwa

**Komponenty:**
- `src/app/(dashboard)/settings/api-keys/page.tsx` - strona zarządzania kluczami
- `src/components/settings/api-keys-list.tsx` - lista kluczy
- `src/components/settings/api-key-form.tsx` - formularz tworzenia klucza
- `src/app/api/settings/api-keys/route.ts` - endpoint API

#### 1.3 Webhooks (WEBHOOKS)
**Lokalizacja:** `/dashboard/settings/webhooks` (nowa strona w ustawieniach)

**Funkcjonalności:**
- Lista webhooków organizacji
- Tworzenie nowych webhooków (URL, eventy)
- Testowanie webhooków
- Historia wywołań webhooków
- Edycja/usuwanie webhooków

**Komponenty:**
- `src/app/(dashboard)/settings/webhooks/page.tsx` - strona zarządzania webhookami
- `src/components/settings/webhooks-list.tsx` - lista webhooków
- `src/components/settings/webhook-form.tsx` - formularz webhooka
- `src/components/settings/webhook-history.tsx` - historia wywołań
- Endpoint API już istnieje: `src/app/api/integrations/webhook/route.ts`

#### 1.4 Niestandardowe pola (CUSTOM_FIELDS)
**Lokalizacja:** Integracja w formularzu klienta

**Funkcjonalności:**
- Zarządzanie niestandardowymi polami dla klientów
- Definiowanie typów pól (tekst, liczba, data, select)
- Dodawanie pól do formularza klienta
- Wyświetlanie pól w szczegółach klienta

**Komponenty:**
- `src/app/(dashboard)/settings/custom-fields/page.tsx` - zarządzanie polami
- `src/components/settings/custom-fields-list.tsx` - lista pól
- `src/components/settings/custom-field-form.tsx` - formularz pola
- Modyfikacja `src/components/clients/client-form.tsx` - dodanie dynamicznych pól
- Modyfikacja `src/components/clients/client-detail.tsx` - wyświetlanie pól

#### 1.5 Integracje zewnętrzne (EXTERNAL_INTEGRATIONS)
**Lokalizacja:** `/dashboard/integrations` (nowa strona)

**Funkcjonalności:**
- Lista dostępnych integracji
- Konfiguracja integracji (np. Salesforce, HubSpot, Pipedrive)
- Status połączenia
- Synchronizacja danych
- Historia synchronizacji

**Komponenty:**
- `src/app/(dashboard)/integrations/page.tsx` - strona integracji
- `src/components/integrations/integrations-list.tsx` - lista integracji
- `src/components/integrations/integration-card.tsx` - karta integracji
- `src/components/integrations/integration-config.tsx` - konfiguracja

### Faza 2: Wskaźniki PRO w UI

#### 2.1 Badge PRO w nawigacji
- Wyświetlanie badge "PRO" obok użytkownika jeśli ma plan PRO
- Tooltip z informacją o planie

#### 2.2 Strona "Funkcje PRO"
- Strona `/dashboard/pro-features` pokazująca wszystkie funkcje PRO
- Lista funkcji z opisami
- Wskaźniki które są włączone
- Linki do stron funkcji

#### 2.3 Ograniczenia dla BASIC
- Komunikaty "Ulepsz do PRO" na stronach funkcji PRO
- Blokowanie dostępu do funkcji PRO dla BASIC
- Promocja planu PRO

### Faza 3: Weryfikacja i testy

#### 3.1 Testy feature flags
- Sprawdzenie czy wszystkie funkcje PRO są poprawnie sprawdzane
- Testy dla organizacji BASIC vs PRO
- Testy dla użytkowników bez organizacji

#### 3.2 Testy UI
- Sprawdzenie czy wszystkie strony PRO są dostępne
- Sprawdzenie czy funkcje są widoczne tylko dla PRO
- Testy nawigacji

## Priorytetyzacja

### Wysoki priorytet (najważniejsze dla użytkownika):
1. **Strona "Funkcje PRO"** - pokazuje co jest dostępne
2. **Zaawansowane raporty** - podstawowa funkcjonalność PRO
3. **Klucze API** - często używane w integracjach

### Średni priorytet:
4. **Webhooks** - endpoint już istnieje, tylko UI
5. **Niestandardowe pola** - przydatne ale nie krytyczne

### Niski priorytet:
6. **Integracje zewnętrzne** - wymaga implementacji całych integracji

## Uwagi techniczne

- Wszystkie strony PRO powinny sprawdzać `checkFeature(user.id, FEATURE_KEYS.XXX)`
- Jeśli funkcja nie jest włączona - pokazać komunikat "Ulepsz do PRO"
- Wszystkie endpointy API powinny używać `requireFeature()` middleware
- Feature flags są już zaimplementowane - tylko brakuje UI

