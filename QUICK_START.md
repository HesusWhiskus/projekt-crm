# Szybki start - Internal CRM

## Krok 1: Zainstaluj Node.js

1. Pobierz Node.js 18+ z https://nodejs.org/
2. Zainstaluj Node.js (zaznacz opcję "Add to PATH" podczas instalacji)
3. Zrestartuj terminal/PowerShell

## Krok 2: Zainstaluj zależności

```bash
npm install
```

## Krok 3: Skonfiguruj środowisko

1. Utwórz plik `.env` (skopiuj z `.env.example`)
2. Wygeneruj NEXTAUTH_SECRET:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. Skopiuj wygenerowany klucz do `.env` jako `NEXTAUTH_SECRET`

## Krok 4: Uruchom PostgreSQL

### Opcja A: Docker (jeśli masz Docker Desktop)
```bash
docker-compose up -d postgres
```

### Opcja B: Lokalny PostgreSQL
- Zainstaluj PostgreSQL
- Utwórz bazę: `CREATE DATABASE internal_crm;`
- Zaktualizuj `DATABASE_URL` w `.env`

## Krok 5: Uruchom migracje

```bash
npm run db:generate
npm run db:migrate
```

## Krok 6: Uruchom aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna pod: **http://localhost:3000**

## Pierwszy użytkownik

### Utworzenie konta administratora

```bash
npm run admin:create
```

To utworzy konto administratora:
- **Email:** `admin@example.com`
- **Hasło:** `Admin123!`

Możesz zmienić wartości przez zmienne środowiskowe `ADMIN_EMAIL` i `ADMIN_PASSWORD` w `.env`

### Alternatywnie

1. Zarejestruj się przez formularz rejestracji
2. Aby nadać uprawnienia admina, użyj:
   ```bash
   npm run admin:create
   ```
   lub ręcznie przez `npm run db:studio`

## Gotowe! 🎉

Aplikacja jest gotowa do testowania.

