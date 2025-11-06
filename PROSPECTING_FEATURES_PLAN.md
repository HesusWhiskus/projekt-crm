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

**WAŻNA ZMIANA:** Pole `type` musi być opcjonalne dla notatek:
- `type ContactType?` - zmienione z wymaganego na opcjonalne (dla notatek nie jest potrzebne)
- Lub `type ContactType @default(OTHER)` - jeśli chcemy zachować wymagane pole z domyślną wartością

### 3. Automatyczna aktualizacja lastContactAt

W `src/app/api/contacts/route.ts` (POST):
- Po utworzeniu kontaktu (gdy `isNote = false`), zaktualizować `client.lastContactAt` na datę kontaktu
- **Użyć transakcji Prisma** aby zapewnić atomicity operacji
- Przykład:
  ```typescript
  await db.$transaction(async (tx) => {
    const contact = await tx.contact.create({ ... })
    if (!validatedData.isNote) {
      await tx.client.update({
        where: { id: validatedData.clientId },
        data: { lastContactAt: new Date(validatedData.date) }
      })
    }
    return contact
  })
  ```

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
- Gdy isNote=true, ustawić `type=undefined` lub `type=null` w formData (schemat będzie akceptował opcjonalne pole)

### 5. Szybkie filtry na dashboardzie

**Dashboard (`src/app/(dashboard)/dashboard/page.tsx`):**
- Nowa sekcja "Zarządzanie leadami" z kartami:
  - "Tylko NEW_LEAD" - link do `/clients?status=NEW_LEAD`
  - "Brak kontaktu >7 dni" - link do `/clients?noContactDays=7`
  - "Follow-up dzisiaj" - link do `/clients?followUpToday=true`

**API (`src/app/api/clients/route.ts` GET):**
- Obsługa query params (już dodane do `clientQuerySchema` w `query-validator.ts`):
  - `noContactDays` - filtry klientów bez kontaktu przez X dni (lastContactAt < today - X dni lub lastContactAt IS NULL)
    - Konwersja: `const days = validatedParams.noContactDays ? parseInt(validatedParams.noContactDays) : null`
  - `followUpToday` - filtry klientów z follow-up dzisiaj (nextFollowUpAt = today)
    - Konwersja: `const isToday = validatedParams.followUpToday === "true"`
- Logika filtrowania:
  ```typescript
  if (validatedParams.noContactDays) {
    const days = parseInt(validatedParams.noContactDays)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    where.OR = [
      ...(where.OR || []),
      { lastContactAt: { lt: cutoffDate } },
      { lastContactAt: null }
    ]
  }
  if (validatedParams.followUpToday === "true") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    where.nextFollowUpAt = {
      gte: today,
      lt: tomorrow
    }
  }
  ```

### 6. Migracja bazy danych

Utworzenie migracji Prisma:
- Dodanie pól do Client (lastContactAt, nextFollowUpAt, priority)
- Dodanie pola isNote do Contact
- **WAŻNE:** Zmiana `type` w Contact na opcjonalne (`type ContactType?`) lub z domyślną wartością
- Dodanie enum ClientPriority
- **WAŻNE:** Ustawienie `isNote=false` dla wszystkich istniejących kontaktów (migracja danych):
  ```prisma
  // W migracji SQL lub przez Prisma Studio:
  UPDATE contacts SET "isNote" = false WHERE "isNote" IS NULL;
  ```
  Lub użyć `@default(false)` w schema (automatycznie ustawi dla nowych rekordów)

### 7. Aktualizacja walidacji

**src/lib/field-validators.ts:**
- Walidacja dla `nextFollowUpAt` (data w przyszłości lub null)

**src/app/api/clients/route.ts:**
- Aktualizacja schematów walidacji o nowe pola (priority, nextFollowUpAt)

**src/app/api/contacts/route.ts:**
- Aktualizacja schematów o pole isNote
- **WAŻNE:** Zmiana `type` na opcjonalne w `createContactSchema`:
  - `type: z.nativeEnum(ContactType).optional()` (zamiast wymaganego)
  - Gdy `isNote=true`, `type` może być `undefined`

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

### FAZA 0: Poprawki przed implementacją (WYKONANE)

1. ✅ Naprawiono walidację UUID w query params - zmieniono na CUID format
2. ✅ Dodano nowe query params do `clientQuerySchema` (noContactDays, followUpToday)

### FAZA 1: Migracja bazy danych

1. Zaktualizować `prisma/schema.prisma`:
   - Dodać enum `ClientPriority`
   - Dodać pola do Client (lastContactAt, nextFollowUpAt, priority)
   - Dodać pole isNote do Contact
   - **WAŻNE:** Zmienić `type ContactType` na `type ContactType?` (opcjonalne)
2. Utworzyć migrację: `npx prisma migrate dev --name add_prospecting_fields`
3. **WAŻNE:** Uruchomić migrację danych dla istniejących kontaktów:
   ```sql
   UPDATE contacts SET "isNote" = false WHERE "isNote" IS NULL;
   ```
   Lub użyć Prisma Studio/script do aktualizacji

### FAZA 2: Aktualizacja API

1. Aktualizacja Client API (`src/app/api/clients/route.ts`):
   - Dodać nowe pola do schematów (priority, nextFollowUpAt)
   - Dodać logikę filtrowania dla `noContactDays` i `followUpToday`
2. Aktualizacja Contact API (`src/app/api/contacts/route.ts`):
   - Dodać `isNote` do schematów
   - **WAŻNE:** Zmienić `type` na opcjonalne w `createContactSchema`
   - Dodać automatyczną aktualizację `lastContactAt` w transakcji

### FAZA 3: Aktualizacja formularzy i widoków

1. ClientForm - dodać pola priority i nextFollowUpAt
2. ClientDetail - wyświetlanie nowych pól, filtrowanie notatek
3. ContactForm - checkbox isNote, ukrywanie typu dla notatek

### FAZA 4: Dashboard

1. Dodać sekcję "Zarządzanie leadami" z szybkimi filtrami

### FAZA 5: Dokumentacja

1. Utworzyć FEATURES.md
2. Zaktualizować API_DOCUMENTATION.md
3. Zaktualizować CHANGELOG.md

### FAZA 6: Testy i weryfikacja

1. Przetestować wszystkie istniejące funkcje
2. Przetestować nowe funkcje
3. Przetestować migrację danych

## Uwagi

- `lastContactAt` będzie aktualizowane automatycznie przy każdym kontakcie (isNote=false) - używa transakcji Prisma
- `nextFollowUpAt` można ustawić ręcznie lub automatycznie (np. +7 dni od kontaktu)
- Priorytet pomaga w sortowaniu i priorytetyzacji leadów
- Notatki wykorzystują istniejący model Contact z flagą isNote=true
- **WAŻNE:** Dla notatek pole `type` jest opcjonalne (może być `null` lub `undefined`)
- Email log NIE jest dodawany (na razie)

## Poprawki wprowadzone

1. ✅ **Naprawiono walidację UUID w query params** - zmieniono na CUID format (niepusty string)
2. ✅ **Dodano nowe query params** do `clientQuerySchema` (noContactDays, followUpToday)
3. ✅ **Zaktualizowano plan** - dodano informacje o:
   - Zmianie `type` na opcjonalne w Contact
   - Użyciu transakcji Prisma dla aktualizacji lastContactAt
   - Migracji danych dla istniejących kontaktów
   - Szczegółowej logice filtrowania

## Status

Plan zapisany: 2025-11-06
Plan zaktualizowany: 2025-11-06
**FAZA 0 WYKONANA:** Poprawki przed implementacją ✅
Gotowy do realizacji - FAZA 1 (Migracja bazy danych) ✅

