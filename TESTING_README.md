# Instrukcja uruchamiania testów

## Wymagania

1. **Node.js 20+** i **npm 10+**
2. **Baza danych PostgreSQL** (dla testów wymagających bazy danych)
3. **Zmienne środowiskowe** w pliku `.env`:
   - `DATABASE_URL` - połączenie z bazą danych
   - `DATABASE_URL_TEST` (opcjonalnie) - osobna baza dla testów
   - `NEXTAUTH_SECRET` - sekret dla NextAuth
   - `NEXTAUTH_URL` - URL aplikacji

## Instalacja zależności

```bash
npm install
```

## Uruchamianie testów

### Wszystkie testy
```bash
npm run test
```

### Tylko testy bezpieczeństwa
```bash
npm run test:security
```

### Tylko testy jednostkowe
```bash
npm run test:unit
```

### Testy z raportem pokrycia
```bash
npm run test:coverage
```

### Watch mode (automatyczne uruchamianie przy zmianach)
```bash
npm run test:watch
```

### UI mode (interaktywny interfejs)
```bash
npm run test:ui
```

## Testy E2E (Playwright)

### Instalacja przeglądarek
```bash
npm run playwright:install
```

### Uruchomienie testów E2E
```bash
npm run test:e2e
```

**Uwaga:** Testy E2E wymagają uruchomionej aplikacji (`npm run dev`)

## Testy wydajnościowe (k6)

### Instalacja k6
- Windows: Pobierz z https://k6.io/docs/getting-started/installation/
- Lub użyj: `choco install k6` (jeśli masz Chocolatey)

### Uruchomienie testów wydajnościowych
```bash
npm run test:performance
```

Lub bezpośrednio:
```bash
k6 run tests/performance/api-load-tests.js
```

## Struktura testów

```
src/__tests__/
  ├── security/          # Testy bezpieczeństwa API
  │   ├── rate-limiting.test.ts
  │   ├── file-upload.test.ts
  │   ├── query-validation.test.ts
  │   ├── authorization.test.ts
  │   ├── security-headers.test.ts
  │   └── log-sanitization.test.ts
  ├── helpers/           # Helpery testowe
  │   ├── auth.ts
  │   ├── db.ts
  │   └── mocks.ts
  └── fixtures/          # Dane testowe
      └── test-data.ts

e2e/
  └── security/          # Testy E2E bezpieczeństwa
      ├── auth-flow.spec.ts
      ├── file-upload.spec.ts
      └── xss-csrf.spec.ts

tests/
  └── performance/       # Testy wydajnościowe k6
      ├── api-load-tests.js
      ├── stress-tests.js
      └── optimization-verification.js
```

## Uwagi

### Testy wymagające bazy danych

Następujące testy wymagają działającej bazy danych PostgreSQL:
- `rate-limiting.test.ts` (część testów)
- `authorization.test.ts` (wszystkie testy)

Przed uruchomieniem tych testów upewnij się, że:
1. Baza danych jest uruchomiona
2. Zmienna `DATABASE_URL` jest ustawiona
3. Migracje Prisma są wykonane: `npm run db:push`

### Testy które działają bez bazy danych

Następujące testy **nie wymagają** bazy danych:
- `file-upload.test.ts` - testy walidacji plików
- `query-validation.test.ts` - testy walidacji parametrów
- `security-headers.test.ts` - testy nagłówków bezpieczeństwa
- `log-sanitization.test.ts` - testy sanityzacji logów

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions:
- **test-unit.yml** - przy każdym PR (testy jednostkowe)
- **test-e2e.yml** - przy merge do main (testy E2E)
- **test-security.yml** - tygodniowo (testy bezpieczeństwa)
- **test-performance.yml** - codziennie o 2:00 (testy wydajnościowe)

## Rozwiązywanie problemów

### Błąd: "Can't reach database server"
- Sprawdź czy PostgreSQL jest uruchomiony
- Sprawdź czy `DATABASE_URL` jest poprawnie ustawione
- Uruchom migracje: `npm run db:push`

### Błąd: "NextRequest is not defined"
- Upewnij się, że wszystkie zależności są zainstalowane: `npm install`
- Sprawdź czy `next` jest w `node_modules`

### Testy E2E nie działają
- Upewnij się, że aplikacja jest uruchomiona: `npm run dev`
- Zainstaluj przeglądarki: `npm run playwright:install`
- Sprawdź czy `PLAYWRIGHT_BASE_URL` jest ustawione (domyślnie: http://localhost:3000)











