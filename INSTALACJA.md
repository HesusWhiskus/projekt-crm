# Instalacja Internal CRM

## ⚠️ WYMAGANIA WSTĘPNE

Przed rozpoczęciem instalacji upewnij się, że masz zainstalowane:

1. **Node.js 18+** - Pobierz z: https://nodejs.org/
   - Podczas instalacji zaznacz opcję "Add to PATH"

2. **PostgreSQL** (jedna z opcji):
   - **Opcja A:** Docker Desktop (https://www.docker.com/products/docker-desktop)
   - **Opcja B:** Lokalna instalacja PostgreSQL

## 🚀 SZYBKA INSTALACJA

### Windows (PowerShell/CMD)

1. **Zainstaluj Node.js** (jeśli jeszcze nie masz)

2. **Uruchom skrypt instalacyjny:**
   ```cmd
   install.bat
   ```

3. **Lub wykonaj ręcznie:**
   ```cmd
   npm install
   npm run db:generate
   npm run db:migrate
   ```

4. **Uruchom aplikację:**
   ```cmd
   start.bat
   ```
   lub
   ```cmd
   npm run dev
   ```

### Konfiguracja .env

1. **Utwórz plik `.env`** (jeśli nie istnieje):
   ```cmd
   copy .env.example .env
   ```

2. **Wygeneruj NEXTAUTH_SECRET:**
   ```cmd
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Zaktualizuj `.env`** - wklej wygenerowany klucz jako `NEXTAUTH_SECRET`

## 📋 KROK PO KROKU

### 1. Instalacja zależności
```cmd
npm install
```

### 2. Konfiguracja bazy danych

**Z Docker:**
```cmd
docker-compose up -d postgres
```

**Lub lokalnie:**
- Zainstaluj PostgreSQL
- Utwórz bazę: `CREATE DATABASE internal_crm;`
- Zaktualizuj `DATABASE_URL` w `.env`

### 3. Generowanie Prisma Client i migracje
```cmd
npm run db:generate
npm run db:migrate
```

### 4. Uruchomienie aplikacji
```cmd
npm run dev
```

Aplikacja będzie dostępna pod: **http://localhost:3000**

## 🔐 PIERWSZY UŻYTKOWNIK

### Utworzenie konta administratora

Najprostszy sposób to użycie skryptu:

```cmd
npm run admin:create
```

To utworzy konto administratora z:
- **Email:** `admin@example.com`
- **Hasło:** `Admin123!`
- **Rola:** ADMIN

**Możesz zmienić domyślne wartości** przez zmienne środowiskowe w `.env`:
```env
ADMIN_EMAIL=twoj@email.com
ADMIN_PASSWORD=TwojeSilneHaslo123!
```

### Alternatywnie: Rejestracja przez formularz

1. Otwórz http://localhost:3000
2. Kliknij "Zarejestruj się"
3. Utwórz pierwsze konto (domyślnie jako USER)
4. Aby nadać uprawnienia administratora, użyj:
   ```cmd
   npm run admin:create
   ```
   lub ręcznie przez Prisma Studio:
   ```cmd
   npm run db:studio
   ```
   - Otwórz tabelę `users`
   - Zmień `role` na `ADMIN` dla swojego użytkownika

## ❓ ROZWIĄZYWANIE PROBLEMÓW

### "Node.js nie jest rozpoznany jako polecenie"
- Zainstaluj Node.js z https://nodejs.org/
- Zrestartuj terminal
- Sprawdź: `node --version`

### "Cannot connect to database"
- Sprawdź, czy PostgreSQL jest uruchomiony
- Sprawdź `DATABASE_URL` w `.env`
- Upewnij się, że baza danych istnieje

### "Port 3000 already in use"
- Zmień port w `package.json`: `"dev": "next dev -p 3001"`
- Lub zatrzymaj proces używający portu 3000

## 📝 PRZYDATNE KOMENDY

- `npm run dev` - Serwer deweloperski
- `npm run build` - Budowanie produkcyjne
- `npm run db:studio` - Prisma Studio (GUI bazy danych)
- `npm run db:migrate` - Migracje bazy danych
- `npm run db:generate` - Generowanie Prisma Client


