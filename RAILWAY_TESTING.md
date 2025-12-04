# Testy z bazą danych Railway

## Problem

Railway używa internal network URL (`postgres.railway.internal`) który działa tylko wewnątrz Railway infrastructure. Lokalnie nie można się połączyć bezpośrednio z tym URL.

## Rozwiązania

### Opcja 1: Lokalna baza danych PostgreSQL (Rekomendowane dla testów)

Najlepszym rozwiązaniem dla testów lokalnych jest użycie lokalnej bazy danych PostgreSQL:

```bash
# 1. Zainstaluj PostgreSQL lokalnie lub użyj Docker
docker-compose up -d postgres

# 2. Ustaw DATABASE_URL dla testów
$env:DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
$env:DATABASE_URL_TEST="postgresql://user:password@localhost:5432/test_db"

# 3. Uruchom migracje
npm run db:push

# 4. Uruchom testy
npm run test:security
```

### Opcja 2: Railway Connect (Tylko dla interaktywnych sesji)

Railway `connect` otwiera interaktywną sesję z bazą danych (psql), ale nie tworzy tunelu TCP:

```bash
railway connect postgres
```

To otwiera psql shell, ale nie pozwala na połączenie z lokalnych aplikacji.

### Opcja 3: Railway Run (Z dostępem do zmiennych środowiskowych)

Railway `run` uruchamia komendę lokalnie z dostępem do zmiennych środowiskowych Railway:

```bash
railway run npm run test:security
```

**Problem:** Railway internal URL nie działa lokalnie, więc testy wymagające bazy danych nie będą działać.

### Opcja 4: Railway SSH Tunnel (Zaawansowane)

Można użyć Railway SSH do stworzenia tunelu:

```bash
# 1. Połącz się z Railway przez SSH
railway ssh

# 2. W osobnym terminalu, stwórz tunel SSH
ssh -L 5432:postgres.railway.internal:5432 railway@...

# 3. Użyj localhost:5432 w DATABASE_URL
```

**Uwaga:** To wymaga dodatkowej konfiguracji SSH.

## Rekomendacja

Dla testów lokalnych, najlepiej użyć **lokalnej bazy danych PostgreSQL** (Opcja 1). 

Dla CI/CD, GitHub Actions automatycznie skonfiguruje bazę danych PostgreSQL w kontenerze Docker, więc wszystkie testy będą działać.

## Testy które działają bez bazy danych

Następujące testy **nie wymagają** bazy danych i działają od razu:

- ✅ `file-upload.test.ts` - 24 testy
- ✅ `query-validation.test.ts` - 25 testów  
- ✅ `security-headers.test.ts` - 9 testów
- ✅ `log-sanitization.test.ts` - 3 testy
- ✅ `rate-limiting.test.ts` - 6 testów (część)

**Razem: 67 testów bezpieczeństwa działa bez dodatkowej konfiguracji!**

## Testy wymagające bazy danych

Następujące testy **wymagają** bazy danych:

- ⚠️ `rate-limiting.test.ts` - 2 testy
- ⚠️ `authorization.test.ts` - 7 testów

**Razem: 9 testów wymaga bazy danych**

Te testy są przygotowane i będą działać po skonfigurowaniu połączenia z bazą danych.








