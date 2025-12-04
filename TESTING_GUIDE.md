# Przewodnik po testach - Jak uruchomić testy i sprawdzić raporty

## Dostępne komendy testowe

### 1. Wszystkie testy jednostkowe
```bash
npm test
# lub
npm run test
```
Uruchamia wszystkie testy jednostkowe (Vitest) i wyświetla wyniki w konsoli.

### 2. Testy jednostkowe (tylko src/__tests__)
```bash
npm run test:unit
```
Uruchamia testy jednostkowe z katalogu `src/__tests__`.

### 3. Testy bezpieczeństwa
```bash
npm run test:security
```
Uruchamia tylko testy bezpieczeństwa z `src/__tests__/security`.

### 4. Testy z pokryciem kodu (coverage)
```bash
npm run test:coverage
```
Uruchamia testy i generuje raport pokrycia kodu. Raporty są zapisywane w:
- **Tekstowy:** Wyświetlany w konsoli
- **JSON:** `coverage/coverage-final.json`
- **HTML:** `coverage/index.html` (otwórz w przeglądarce)

### 5. Testy w trybie watch (automatyczne uruchamianie przy zmianach)
```bash
npm run test:watch
```
Uruchamia testy w trybie watch - automatycznie uruchamia testy przy zmianie plików.

### 6. Testy z interfejsem graficznym (Vitest UI)
```bash
npm run test:ui
```
Uruchamia interfejs graficzny Vitest w przeglądarce (domyślnie http://localhost:51204).

### 7. Testy E2E (Playwright)
```bash
npm run test:e2e
```
Uruchamia testy end-to-end z Playwright. Wymaga uruchomionej aplikacji (`npm run dev`).

**Uwaga:** Przed pierwszym uruchomieniem zainstaluj przeglądarki:
```bash
npm run playwright:install
```

### 8. Testy wydajnościowe (k6)
```bash
npm run test:performance
```
Uruchamia testy wydajnościowe z k6. Wymaga zainstalowanego k6.

## Raporty z testów

### Raport pokrycia kodu (Coverage)

Po uruchomieniu `npm run test:coverage`:

1. **Raport HTML (najlepszy do przeglądania):**
   ```bash
   # Otwórz w przeglądarce:
   coverage/index.html
   ```
   Pokazuje szczegółowe pokrycie kodu z możliwością nawigacji po plikach.

2. **Raport JSON:**
   ```bash
   # Sprawdź plik:
   coverage/coverage-final.json
   ```
   Używany przez narzędzia CI/CD (np. Codecov).

3. **Raport tekstowy:**
   Wyświetlany bezpośrednio w konsoli po uruchomieniu testów.

### Raporty Playwright (E2E)

Po uruchomieniu `npm run test:e2e`:

1. **Raport HTML:**
   ```bash
   # Otwórz w przeglądarce:
   playwright-report/index.html
   ```
   Zawiera szczegóły testów E2E, screenshots, trace'y.

2. **Screenshots:**
   Zapisane w `test-results/` dla failed testów.

### Raporty w Railway

W Railway możesz sprawdzić logi testów:

```bash
# Uruchom testy w Railway
railway run --service projekt-crm npm test

# Sprawdź logi z ostatniego deploymentu
railway logs --deployment

# Sprawdź logi na żywo
railway logs --tail
```

## Przykłady użycia

### Uruchomienie konkretnego pliku testowego
```bash
npm test -- src/__tests__/security/malicious-payloads.test.ts
```

### Uruchomienie testów z konkretnym patternem
```bash
npm test -- --grep "security"
```

### Uruchomienie testów z verbose output
```bash
npm test -- --reporter=verbose
```

### Uruchomienie testów w Railway
```bash
railway run --service projekt-crm npm test
```

### Sprawdzenie pokrycia kodu dla konkretnego pliku
```bash
npm run test:coverage -- src/__tests__/security
```

## Struktura raportów

```
projekt-crm/
├── coverage/              # Raporty pokrycia kodu
│   ├── index.html        # HTML raport (otwórz w przeglądarce)
│   ├── coverage-final.json # JSON raport
│   └── ...
├── playwright-report/     # Raporty Playwright E2E
│   └── index.html        # HTML raport E2E
└── test-results/          # Screenshots i trace'y z Playwright
```

## Najlepsze praktyki

1. **Przed commitem:** Uruchom `npm test` aby upewnić się że wszystko działa
2. **Przed release:** Uruchom `npm run test:coverage` i sprawdź pokrycie
3. **W CI/CD:** Testy są automatycznie uruchamiane w GitHub Actions
4. **W Railway:** Użyj `railway run npm test` do testowania przed deploymentem

## Troubleshooting

### Testy failują z błędami bazy danych
- Testy automatycznie używają mocków gdy baza nie jest dostępna
- Jeśli potrzebujesz prawdziwej bazy, ustaw `DATABASE_URL` przed uruchomieniem

### Brakuje raportów coverage
- Upewnij się że uruchomiłeś `npm run test:coverage` (nie tylko `npm test`)
- Sprawdź czy folder `coverage/` istnieje

### Testy E2E nie działają
- Upewnij się że aplikacja jest uruchomiona (`npm run dev`)
- Zainstaluj przeglądarki: `npm run playwright:install`

