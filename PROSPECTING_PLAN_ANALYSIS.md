# Analiza planu implementacji funkcji prospecting

## Data analizy: 2025-11-06

## ✅ Pozytywne aspekty planu

1. **Bezpieczna migracja bazy danych**
   - Wszystkie nowe pola są nullable (`DateTime?`, `ClientPriority?`, `Boolean @default(false)`)
   - Nie ma ryzyka utraty danych
   - Istniejące rekordy będą miały `null` dla nowych pól, co jest akceptowalne

2. **Zachowanie kompatybilności wstecznej**
   - Nowe pola są opcjonalne w formularzach
   - Istniejące API endpointy będą działać (nowe pola będą `null` dla starych rekordów)

3. **Logiczna struktura**
   - Wykorzystanie istniejącego modelu Contact z flagą `isNote` jest eleganckie
   - Automatyczna aktualizacja `lastContactAt` jest sensowna

## ⚠️ Potencjalne problemy i ryzyka

### 1. **KRYTYCZNE: Walidacja UUID w query params**

**Problem:**
W `src/lib/query-validator.ts` są schematy z walidacją UUID:
- `assignedTo: z.string().uuid(...)` w `clientQuerySchema`
- `clientId: z.string().uuid(...)` w `contactQuerySchema`
- `userId: z.string().uuid(...)` w `contactQuerySchema`

**Ale system używa CUID, nie UUID!**

**Ryzyko:**
- Nowe filtry `noContactDays` i `followUpToday` będą działać
- Ale istniejące filtry przez `assignedTo` mogą nie działać poprawnie jeśli użytkownik użyje CUID w URL
- To może powodować błędy walidacji

**Rozwiązanie:**
- **PRZED implementacją** należy usunąć walidację `.uuid()` z query params i zastąpić prostą walidacją CUID (niepusty string)
- Lub dodać `.or(z.literal(""))` jak już jest, ale to nie rozwiązuje problemu dla wartości CUID

### 2. **Automatyczna aktualizacja lastContactAt - wydajność**

**Problem:**
W `src/app/api/contacts/route.ts` (POST) plan zakłada aktualizację `client.lastContactAt` po każdym kontakcie.

**Ryzyko:**
- Jeśli będzie dużo kontaktów tworzonych jednocześnie, może być problem z wydajnością
- Potencjalne race conditions jeśli wiele kontaktów jest tworzonych równocześnie dla tego samego klienta

**Rozwiązanie:**
- Użyć transakcji Prisma
- Lub użyć `updateMany` zamiast `findUnique + update`
- Rozważyć batch update dla wielu kontaktów

### 3. **Filtrowanie kontaktów w ClientDetail**

**Problem:**
Plan zakłada filtrowanie Contact na "Kontakty" (isNote=false) i "Notatki" (isNote=true).

**Ryzyko:**
- Obecnie wszystkie kontakty są wyświetlane razem
- Zmiana może zepsuć istniejące widoki jeśli nie będzie obsłużona poprawnie
- Musimy upewnić się, że istniejące kontakty będą miały `isNote=false` (domyślnie)

**Rozwiązanie:**
- Dodać migrację która ustawi `isNote=false` dla wszystkich istniejących kontaktów
- Lub użyć `@default(false)` w schema (już jest w planie ✅)

### 4. **ContactForm - ukrywanie pola "Typ kontaktu"**

**Problem:**
Plan zakłada ukrycie pola "Typ kontaktu" gdy `isNote=true`.

**Ryzyko:**
- W schemacie `createContactSchema` pole `type` jest wymagane (`z.nativeEnum(ContactType)`)
- Jeśli ukryjemy pole, musimy ustawić domyślną wartość lub zmienić schemat

**Rozwiązanie:**
- Zmienić schemat na `type: z.nativeEnum(ContactType).optional()`
- Gdy `isNote=true`, ustawić domyślną wartość (np. `OTHER`) lub `null`
- Zaktualizować model Contact w Prisma - `type` musi być opcjonalne lub mieć domyślną wartość

### 5. **Nowe query params - konflikt z istniejącymi**

**Problem:**
Plan dodaje nowe query params: `noContactDays` i `followUpToday`.

**Ryzyko:**
- Muszą być dodane do `clientQuerySchema` w `query-validator.ts`
- Muszą być obsłużone w `src/app/api/clients/route.ts` GET
- Nie mogą kolidować z istniejącymi filtrami

**Rozwiązanie:**
- Dodać do `clientQuerySchema`:
  - `noContactDays: z.string().optional()` (liczba dni jako string, potem konwersja na number)
  - `followUpToday: z.string().optional()` (boolean jako string "true"/"false")
- Obsłużyć w logice filtrowania w GET route

### 6. **Walidacja nextFollowUpAt**

**Problem:**
Plan zakłada walidację `nextFollowUpAt` (data w przyszłości lub null).

**Ryzyko:**
- Co jeśli użytkownik ustawi datę w przeszłości? Czy to błąd czy akceptowalne?
- Musimy zdecydować czy data może być w przeszłości (np. dla follow-up które już minęły)

**Rozwiązanie:**
- Użyć `z.string().refine()` z logiką sprawdzającą czy data jest w przyszłości
- Lub pozwolić na daty w przeszłości (może być przydatne do historii)

### 7. **Dashboard - nowe filtry**

**Problem:**
Plan dodaje nowe linki na dashboardzie z query params.

**Ryzyko:**
- Muszą być zgodne z nowymi query params w API
- Muszą działać z istniejącym routingiem

**Rozwiązanie:**
- Upewnić się, że linki używają poprawnych query params
- Przetestować czy routing działa poprawnie

## 🔧 Wymagane poprawki przed implementacją

### PRIORYTET 1 (KRYTYCZNE - przed implementacją):

1. **Naprawić walidację UUID w query params**
   - Usunąć `.uuid()` z `assignedTo`, `clientId`, `userId` w `query-validator.ts`
   - Zastąpić prostą walidacją CUID (niepusty string, min długość)
   - Lub całkowicie usunąć walidację formatu (tylko sprawdzić czy nie jest pusty)

### PRIORYTET 2 (WAŻNE - przed implementacją):

2. **Zmienić model Contact - type opcjonalne**
   - W `prisma/schema.prisma`: `type ContactType?` (opcjonalne) lub `type ContactType @default(OTHER)`
   - W `createContactSchema`: `type: z.nativeEnum(ContactType).optional()`
   - W `updateContactSchema`: już jest opcjonalne ✅

3. **Dodać migrację dla istniejących kontaktów**
   - Ustawić `isNote=false` dla wszystkich istniejących kontaktów
   - Lub użyć `@default(false)` (już jest w planie ✅)

### PRIORYTET 3 (WAŻNE - podczas implementacji):

4. **Zoptymalizować aktualizację lastContactAt**
   - Użyć transakcji Prisma
   - Rozważyć batch update

5. **Dodać nowe query params do schematu**
   - `noContactDays: z.string().optional()` (konwersja na number w kodzie)
   - `followUpToday: z.string().optional()` (konwersja na boolean w kodzie)

## 📋 Plan poprawiony (kolejność)

1. **PRZED implementacją:**
   - ✅ Naprawić walidację UUID w query params (PRIORYTET 1)
   - ✅ Zmienić model Contact - type opcjonalne (PRIORYTET 2)
   - ✅ Dodać migrację dla istniejących kontaktów (PRIORYTET 2)

2. **Migracja bazy danych:**
   - Dodanie pól do Client (lastContactAt, nextFollowUpAt, priority)
   - Dodanie pola isNote do Contact
   - Dodanie enum ClientPriority
   - Ustawienie isNote=false dla istniejących kontaktów

3. **Aktualizacja API:**
   - Client API (nowe pola, filtry)
   - Contact API (isNote, automatyczna aktualizacja lastContactAt)
   - Dodanie nowych query params do schematu

4. **Aktualizacja formularzy i widoków:**
   - ClientForm (priority, nextFollowUpAt)
   - ClientDetail (wyświetlanie, filtrowanie)
   - ContactForm (isNote checkbox)

5. **Dashboard:**
   - Szybkie filtry

6. **Dokumentacja:**
   - FEATURES.md
   - Aktualizacja API_DOCUMENTATION.md
   - Aktualizacja CHANGELOG.md

## ✅ Rekomendacja

**Plan jest DOBRY, ale wymaga poprawek przed implementacją:**

1. **KRYTYCZNE:** Naprawić walidację UUID w query params (używać CUID, nie UUID)
2. **WAŻNE:** Zmienić model Contact - type opcjonalne (dla notatek)
3. **WAŻNE:** Dodać migrację dla istniejących kontaktów (isNote=false)

Po tych poprawkach plan można bezpiecznie implementować.

## 🎯 Szacowane ryzyko

- **Ryzyko zepsucia istniejących funkcji:** ŚREDNIE (po poprawkach: NISKIE)
- **Ryzyko problemów z wydajnością:** NISKIE (z optymalizacją transakcji)
- **Ryzyko problemów z migracją:** NISKIE (wszystkie pola nullable)

## 📝 Dodatkowe uwagi

1. **Testowanie:**
   - Przetestować wszystkie istniejące funkcje po implementacji
   - Przetestować nowe filtry
   - Przetestować automatyczną aktualizację lastContactAt

2. **Backup:**
   - Przed migracją zrobić backup bazy danych
   - Przetestować migrację na kopii

3. **Rollback plan:**
   - Przygotować plan rollback jeśli coś pójdzie nie tak
   - Migracja Prisma może być odwrócona

