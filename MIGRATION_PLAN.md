# Plan Prawidłowej Migracji Bazy Danych - Rollback do wersji 5.0

## Data: 2025-01-16
## Wersja docelowa: 0.5.0-beta

## ⚠️ WAŻNE - PRZED MIGRACJĄ

**UWAGA:** Ta migracja przywraca funkcjonalność z wersji 5.0, która została usunięta w wersji 5.3. Wymaga to:
1. Przywrócenia kolumny `companyName` w bazie danych
2. Upewnienia się, że wszystkie migracje są zastosowane
3. Regeneracji Prisma Client

## Co zostało przywrócone

### Zmiany w kodzie:
- ✅ Przywrócono pole `companyName` w `schema.prisma`
- ✅ Przywrócono obsługę typu COMPANY w `client-form.tsx`
- ✅ Zaktualizowano `PrismaClientRepository.ts` - dodano `companyName` do wszystkich select
- ✅ Zaktualizowano DTO (`CreateClientDTO`, `UpdateClientDTO`) - dodano `type`, `companyName`, `taxId`
- ✅ Zaktualizowano API routes - dodano walidację dla `type`, `companyName`, `taxId`
- ✅ Zaktualizowano use cases - obsługa `companyName` i `type`

## Plan migracji bazy danych

### Krok 1: Sprawdzenie stanu bazy danych

```sql
-- Sprawdź czy kolumna companyName istnieje
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'companyName';

-- Sprawdź czy enum ClientType istnieje
SELECT typname FROM pg_type WHERE typname = 'ClientType';

-- Sprawdź czy kolumna type istnieje
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'type';
```

### Krok 2: Uruchomienie migracji Prisma

**WAŻNE:** Migracja `20250107000000_add_client_type_fields` powinna już być zastosowana. Jeśli nie, uruchom:

```bash
# Sprawdź status migracji
npx prisma migrate status

# Jeśli migracja nie jest zastosowana, uruchom:
npx prisma migrate deploy
```

### Krok 3: Weryfikacja migracji

```sql
-- Sprawdź czy wszystkie kolumny istnieją
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('type', 'firstName', 'lastName', 'companyName', 'taxId')
ORDER BY column_name;
```

### Krok 4: Regeneracja Prisma Client

```bash
# Regeneruj Prisma Client po zmianach w schema.prisma
npx prisma generate
```

### Krok 5: Weryfikacja aplikacji

1. **Sprawdź build:**
   ```bash
   npm run build
   ```

2. **Sprawdź czy aplikacja się uruchamia:**
   ```bash
   npm run dev
   ```

3. **Przetestuj funkcjonalność:**
   - [ ] Tworzenie klienta typu PERSON
   - [ ] Tworzenie klienta typu COMPANY
   - [ ] Edycja klienta typu PERSON
   - [ ] Edycja klienta typu COMPANY
   - [ ] Wyświetlanie listy klientów (oba typy)
   - [ ] Wyszukiwanie po companyName

## Migracja danych (jeśli potrzebna)

Jeśli w bazie są dane, które wymagają migracji:

```sql
-- Sprawdź czy są klienci bez typu
SELECT id, "firstName", "lastName", type, "companyName"
FROM clients
WHERE type IS NULL;

-- Jeśli są, ustaw domyślny typ PERSON
UPDATE clients
SET type = 'PERSON'
WHERE type IS NULL;

-- Sprawdź czy są klienci z agencyName (jeśli kolumna jeszcze istnieje)
SELECT id, "agencyName", "companyName", type
FROM clients
WHERE "agencyName" IS NOT NULL AND "companyName" IS NULL;
```

## Rollback plan (w razie problemów)

Jeśli migracja się nie powiedzie:

1. **Przywróć poprzednią wersję schema.prisma:**
   ```bash
   git checkout HEAD~1 -- prisma/schema.prisma
   ```

2. **Regeneruj Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Sprawdź czy aplikacja działa:**
   ```bash
   npm run build
   ```

## Uwagi techniczne

### Backward compatibility

- Kod obsługuje zarówno `companyName` (nowe) jak i `agencyName` (deprecated) dla kompatybilności wstecznej
- Jeśli `type` nie jest podany, system automatycznie określa typ na podstawie obecności `companyName`
- Dla typu PERSON wymagane są `firstName` i `lastName`
- Dla typu COMPANY wymagane jest `companyName`

### Mapowanie danych

- W bazie danych: `companyName` (kolumna)
- W domenie: `agencyName` (Value Object) - mapowanie w PrismaClientRepository
- W API: `companyName` (DTO) - mapowanie w use cases

## Weryfikacja po migracji

Po zakończeniu migracji sprawdź:

1. ✅ Kolumna `companyName` istnieje w bazie danych
2. ✅ Enum `ClientType` istnieje
3. ✅ Kolumna `type` istnieje i ma wartości NOT NULL
4. ✅ Prisma Client został zregenerowany
5. ✅ Aplikacja się buduje bez błędów
6. ✅ Formularz klienta obsługuje oba typy (PERSON/COMPANY)
7. ✅ API routes akceptują `companyName` i `type`

## Kontakt

W przypadku problemów z migracją:
1. Sprawdź logi aplikacji
2. Sprawdź status migracji Prisma: `npx prisma migrate status`
3. Sprawdź czy wszystkie zależności są zainstalowane
4. Sprawdź czy baza danych jest dostępna

