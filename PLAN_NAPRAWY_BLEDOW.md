# Plan naprawy błędów

## Problem 1: Brak pola organizacji przy rejestracji

### Analiza:
- Kod jest w pliku `src/app/(auth)/signup/signup-form.tsx` (linie 135-155)
- Zmiany nie zostały wdrożone w produkcji (są w working directory)
- Endpoint `/api/organizations` istnieje i jest publiczny (middleware ma wyjątek)
- Problem: Zmiany nie są commitowane i nie są w produkcji

### Plan naprawy:
1. **Sprawdzenie czy kod jest poprawny:**
   - Zweryfikować czy pole organizacji jest w formularzu (linie 135-155)
   - Sprawdzić czy `useEffect` pobiera organizacje (linie 31-44)
   - Sprawdzić czy `organizationId` jest wysyłane w `handleSubmit` (linia 73)

2. **Wdrożenie zmian:**
   - Commitować zmiany do git
   - Wypchnąć zmiany do repozytorium
   - Zrestartować aplikację na Railway (lub poczekać na automatyczny deploy)

3. **Weryfikacja:**
   - Sprawdzić czy endpoint `/api/organizations` zwraca dane
   - Sprawdzić czy pole organizacji jest widoczne w formularzu rejestracji
   - Sprawdzić czy można wybrać organizację (jeśli istnieją w bazie)

---

## Problem 2: Brak opcji w panelu administracyjnym

### Analiza:
- Strony istnieją: `/admin/users`, `/admin/groups`, `/admin/organizations`
- W kodzie `src/app/(dashboard)/admin/page.tsx` są linki (`<Link href="/admin/users">`)
- Kod jest poprawny - wszystkie karty mają `<Link>` wrappery (sprawdzone)
- Problem: Zmiany mogą nie być wdrożone w produkcji lub może być problem z cache/stylami

### Plan naprawy:
1. **Sprawdzenie czy kod jest wdrożony:**
   - Sprawdzić czy plik `src/app/(dashboard)/admin/page.tsx` jest w repozytorium
   - Sprawdzić czy linki są widoczne w produkcji

2. **Naprawa (jeśli potrzebna):**
   - Jeśli linki nie działają - sprawdzić czy nie ma problemu z Next.js Link
   - Sprawdzić czy nie ma problemu z CSS (hover effects mogą ukrywać linki)
   - Dodać bardziej widoczne style dla linków (jeśli potrzebne)

3. **Weryfikacja:**
   - Sprawdzić czy karty w panelu admin są klikalne
   - Sprawdzić czy przechodzą do odpowiednich stron
   - Sprawdzić czy wszystkie strony admin działają

---

## Problem 3: Brak pól PESEL i REGON w formularzu klienta

### Analiza:
- Kod jest w pliku `src/components/clients/client-form.tsx`:
  - PESEL dla osoby fizycznej (linie 198-208)
  - REGON dla firmy (linie 232-241)
- Zmiany nie zostały wdrożone w produkcji (są w working directory)
- Migracja bazy została wykonana (`20251113130000_add_pesel_and_regon`)
- Problem: Zmiany nie są commitowane i nie są w produkcji

### Plan naprawy:
1. **Sprawdzenie czy kod jest poprawny:**
   - Zweryfikować czy pole PESEL jest w sekcji PERSON (linie 198-208)
   - Zweryfikować czy pole REGON jest w sekcji COMPANY (linie 232-241)
   - Sprawdzić czy pola są dodawane do `formData` (linie 75, 78)
   - Sprawdzić czy pola są wysyłane w `handleSubmit` (linie 118, 122)

2. **Wdrożenie zmian:**
   - Commitować zmiany do git
   - Wypchnąć zmiany do repozytorium
   - Zrestartować aplikację na Railway

3. **Weryfikacja:**
   - Sprawdzić czy pole PESEL jest widoczne dla osoby fizycznej
   - Sprawdzić czy pole REGON jest widoczne dla firmy
   - Sprawdzić czy dane są zapisywane w bazie
   - Sprawdzić czy dane są odczytywane przy edycji

---

## Podsumowanie działań:

### Krok 1: Commit i push wszystkich zmian
- `prisma/schema.prisma` (dodane pesel, regon)
- `src/app/(auth)/signup/signup-form.tsx` (dodane pole organizacji)
- `src/components/clients/client-form.tsx` (dodane PESEL, REGON)
- `src/middleware.ts` (wyjątek dla /api/organizations)
- `src/application/clients/dto/*.ts` (dodane pola do DTO)
- `src/presentation/api/clients/*.ts` (dodane pola do walidacji)
- `src/application/clients/use-cases/*.ts` (dodane zapisywanie pól)
- `prisma/migrations/20251113130000_add_pesel_and_regon/` (nowa migracja)

### Krok 2: Sprawdzenie i naprawa panelu administracyjnego
- Przeczytać pełny kod `src/app/(dashboard)/admin/page.tsx`
- Naprawić brakujące linki (jeśli są)

### Krok 3: Wdrożenie w produkcji
- Railway powinien automatycznie zbudować i wdrożyć po push
- Jeśli nie - ręczny redeploy

### Krok 4: Weryfikacja końcowa
- Sprawdzić wszystkie trzy problemy w produkcji
- Upewnić się że wszystko działa

---

## Uwagi:
- Wszystkie zmiany są już w kodzie lokalnym, ale nie są wdrożone
- Migracja bazy została wykonana (kolumny pesel, regon istnieją)
- Endpoint `/api/organizations` jest publiczny (middleware ma wyjątek)
- Strony admin istnieją i powinny działać

