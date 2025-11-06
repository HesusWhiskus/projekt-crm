# Plan implementacji funkcji prospecting

## Analiza obecnego stanu

**Co już istnieje:**
- Pole `source` w Client (leadSource) ✅
- System Contact z notatkami ✅
- Filtry na stronie klientów ✅

**Czego brakuje:**
1. `lastContactAt` - data ostatniego kontaktu
2. `nextFollowUpAt` - data następnego follow-up
3. `priority` - priorytet leadu (enum: LOW, MEDIUM, HIGH)
4. Flaga `isNote` w Contact - rozróżnienie notatek od kontaktów
5. Szybkie filtry na dashboardzie

**NIE DODAJEMY:**
- Email log (na razie)
- dealValue (tylko priority enum)

## Proponowana implementacja

### 1. Rozszerzenie modelu Client (prisma/schema.prisma)

Dodanie pól:
- `lastContactAt DateTime?` - automatycznie aktualizowane przy tworzeniu kontaktu
- `nextFollowUpAt DateTime?` - ustawiane ręcznie lub automatycznie
- `priority ClientPriority?` - enum (LOW, MEDIUM, HIGH)

Nowy enum:
```prisma
enum ClientPriority {
  LOW
  MEDIUM
  HIGH
}
```

### 2. Rozszerzenie modelu Contact (prisma/schema.prisma)

Dodanie pola:
- `isNote Boolean @default(false)` - flaga rozróżniająca notatki od kontaktów

### 3. Automatyczna aktualizacja lastContactAt

W `src/app/api/contacts/route.ts` (POST):
- Po utworzeniu kontaktu (gdy `isNote = false`), zaktualizować `client.lastContactAt` na datę kontaktu

### 4. Aktualizacja formularzy

**ClientForm (`src/components/clients/client-form.tsx`):**
- Dodanie pola `priority` (select: LOW/MEDIUM/HIGH)
- Dodanie pola `nextFollowUpAt` (date picker)

**ClientDetail (`src/components/clients/client-detail.tsx`):**
- Wyświetlanie `lastContactAt`, `nextFollowUpAt`, `priority`
- Filtrowanie Contact: osobno "Kontakty" (isNote=false) i "Notatki" (isNote=true)
- Możliwość dodawania notatek przez ContactForm z flagą isNote=true

**ContactForm (`src/components/contacts/contact-form.tsx`):**
- Dodanie checkboxa "To jest notatka" (ustawia isNote=true)
- Gdy isNote=true, ukryć pole "Typ kontaktu" (nie jest potrzebne)

### 5. Szybkie filtry na dashboardzie

**Dashboard (`src/app/(dashboard)/dashboard/page.tsx`):**
- Nowa sekcja "Zarządzanie leadami" z kartami:
  - "Tylko NEW_LEAD" - link do `/clients?status=NEW_LEAD`
  - "Brak kontaktu >7 dni" - link do `/clients?noContactDays=7`
  - "Follow-up dzisiaj" - link do `/clients?followUpToday=true`

**API (`src/app/api/clients/route.ts` GET):**
- Obsługa query params:
  - `noContactDays` - filtry klientów bez kontaktu przez X dni (lastContactAt < today - X dni)
  - `followUpToday` - filtry klientów z follow-up dzisiaj (nextFollowUpAt = today)

### 6. Migracja bazy danych

Utworzenie migracji Prisma:
- Dodanie pól do Client (lastContactAt, nextFollowUpAt, priority)
- Dodanie pola isNote do Contact
- Dodanie enum ClientPriority

### 7. Aktualizacja walidacji

**src/lib/field-validators.ts:**
- Walidacja dla `nextFollowUpAt` (data w przyszłości lub null)

**src/app/api/clients/route.ts:**
- Aktualizacja schematów walidacji o nowe pola (priority, nextFollowUpAt)

**src/app/api/contacts/route.ts:**
- Aktualizacja schematów o pole isNote

### 8. Dokumentacja

Utworzenie/aktualizacja:
- `FEATURES.md` - NOWY - szczegółowa dokumentacja funkcjonalności systemu (co jest, czego nie ma)
- Aktualizacja `API_DOCUMENTATION.md` - nowe pola i filtry
- Aktualizacja `CHANGELOG.md` - nowe funkcje

## Pliki do modyfikacji

1. `prisma/schema.prisma` - rozszerzenie modeli Client i Contact
2. `src/app/api/clients/route.ts` - nowe filtry (noContactDays, followUpToday)
3. `src/app/api/clients/[id]/route.ts` - aktualizacja schematów (priority, nextFollowUpAt)
4. `src/app/api/contacts/route.ts` - dodanie isNote, automatyczna aktualizacja lastContactAt
5. `src/components/clients/client-form.tsx` - pola priority i nextFollowUpAt
6. `src/components/clients/client-detail.tsx` - wyświetlanie nowych pól, filtrowanie notatek
7. `src/components/contacts/contact-form.tsx` - checkbox isNote
8. `src/app/(dashboard)/dashboard/page.tsx` - szybkie filtry
9. `src/lib/field-validators.ts` - walidacja nextFollowUpAt
10. `FEATURES.md` - NOWY - dokumentacja funkcjonalności
11. `API_DOCUMENTATION.md` - aktualizacja o nowe pola i filtry
12. `CHANGELOG.md` - wpis o nowych funkcjach

## Kolejność implementacji

1. Migracja bazy danych (schema + migrate)
2. Aktualizacja Client API (nowe pola, filtry)
3. Aktualizacja Contact API (isNote, automatyczna aktualizacja lastContactAt)
4. Aktualizacja formularzy i widoków
5. Szybkie filtry na dashboardzie
6. Dokumentacja (FEATURES.md, aktualizacja API_DOCUMENTATION.md, CHANGELOG.md)
7. Testy i weryfikacja

## Uwagi

- `lastContactAt` będzie aktualizowane automatycznie przy każdym kontakcie (isNote=false)
- `nextFollowUpAt` można ustawić ręcznie lub automatycznie (np. +7 dni od kontaktu)
- Priorytet pomaga w sortowaniu i priorytetyzacji leadów
- Notatki wykorzystują istniejący model Contact z flagą isNote=true
- Email log NIE jest dodawany (na razie)

## Status

Plan zapisany: 2025-11-06
Gotowy do realizacji po naprawieniu błędów walidacji UUID w zadaniach ✅

