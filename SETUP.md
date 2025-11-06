# Konfiguracja Internal CRM

> **💡 Szybki start:** Zobacz [QUICK_START.md](QUICK_START.md) dla najszybszego uruchomienia lub [INSTALACJA.md](INSTALACJA.md) dla szczegółowej instrukcji instalacji.

## Instrukcja uruchomienia aplikacji Internal CRM

## Wymagania wstępne

1. **Node.js 18+** - Pobierz i zainstaluj z [nodejs.org](https://nodejs.org/)
2. **Docker Desktop** (opcjonalnie, jeśli chcesz użyć Docker Compose dla PostgreSQL)
   - Lub zainstaluj PostgreSQL lokalnie

## Instalacja i uruchomienie

### Opcja 1: Z Docker Compose (Rekomendowane)

1. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

2. **Skonfiguruj zmienne środowiskowe:**
   ```bash
   # Skopiuj plik .env.example do .env
   cp .env.example .env
   # Edytuj .env i uzupełnij wymagane wartości
   ```

3. **Uruchom PostgreSQL w Docker:**
   ```bash
   docker-compose up -d postgres
   ```

4. **Skonfiguruj bazę danych:**
   ```bash
   # Wygeneruj Prisma Client
   npm run db:generate
   
   # Uruchom migracje
   npm run db:migrate
   ```

5. **Uruchom serwer deweloperski:**
   ```bash
   npm run dev
   ```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

### Opcja 2: Bez Docker (Lokalny PostgreSQL)

1. **Zainstaluj PostgreSQL lokalnie** (jeśli jeszcze nie masz)

2. **Utwórz bazę danych:**
   ```sql
   CREATE DATABASE internal_crm;
   ```

3. **Zaktualizuj DATABASE_URL w pliku .env:**
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/internal_crm?schema=public"
   ```

4. **Wykonaj kroki 1, 4 i 5 z Opcji 1**

## Konfiguracja zmiennych środowiskowych (.env)

Najważniejsze zmienne do skonfigurowania:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/internal_crm?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="wygeneruj-sekret-klucz"  # Użyj: openssl rand -base64 32

# Google OAuth (opcjonalnie)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (dla powiadomień - opcjonalnie)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@internal-crm.com"
```

## Generowanie NEXTAUTH_SECRET

W PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Lub użyj OpenSSL:
```bash
openssl rand -base64 32
```

## Pierwszy użytkownik

### Utworzenie konta administratora

Najprostszy sposób:

```bash
npm run admin:create
```

To utworzy konto administratora z:
- **Email:** `admin@example.com` (lub `ADMIN_EMAIL` z `.env`)
- **Hasło:** `Admin123!` (lub `ADMIN_PASSWORD` z `.env`)

### Alternatywnie

1. Otwórz aplikację: http://localhost:3000
2. Kliknij "Zarejestruj się"
3. Utwórz pierwsze konto
4. Aby nadać uprawnienia administratora, użyj:
   ```bash
   npm run admin:create
   ```
   lub ręcznie przez Prisma Studio:
   ```bash
   npm run db:studio
   ```

## Rozwiązywanie problemów

### Błąd: "Cannot find module"
- Uruchom `npm install` ponownie

### Błąd połączenia z bazą danych
- Sprawdź, czy PostgreSQL jest uruchomiony
- Sprawdź DATABASE_URL w pliku .env
- Upewnij się, że baza danych istnieje

### Błąd: "Port 3000 already in use"
- Zmień port w package.json: `"dev": "next dev -p 3001"`
- Lub zatrzymaj proces używający portu 3000

## Użyteczne komendy

- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Zbuduj aplikację produkcyjną
- `npm run db:studio` - Otwórz Prisma Studio (GUI dla bazy danych)
- `npm run db:migrate` - Uruchom migracje bazy danych
- `npm run db:generate` - Wygeneruj Prisma Client

