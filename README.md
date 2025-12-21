# Internal CRM

> Wewnętrzny system CRM do zarządzania relacjami z agencjami ubezpieczeniowymi

[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748)](https://www.prisma.io/)

## 📋 Opis

Internal CRM to nowoczesny system zarządzania relacjami z klientami (CRM) przeznaczony do wewnętrznego użytku w organizacjach współpracujących z agencjami ubezpieczeniowymi. System umożliwia kompleksowe zarządzanie klientami, kontaktami, zadaniami oraz integrację z Google Calendar.

## ✨ Funkcjonalności

### 🏢 Obsługa agentów ubezpieczeniowych 🆕
- Zarządzanie agentami ubezpieczeniowymi z konfigurowalną widocznością elementów UI
- Zarządzanie pojazdami z relacją N:M do klientów (współwłasność)
- Kalkulacje ubezpieczeniowe jako szanse sprzedaży z pełnymi danymi z formularza
- Polisy ubezpieczeniowe z dokumentami i informacją o TU
- Integracja dwukierunkowa z systemem zewnętrznym (REST API + Webhooks)
- Audyt i zgodność RODO dla danych osobowych
- **Redesign nawigacji** - dropdown menu dla agentów ubezpieczeniowych z lepszą organizacją
- **Integracja dashboardów** - sekcja agentów w głównym dashboardzie z pełnymi statystykami
- **Rozszerzenie formularza klienta** - sekcja powiązań ubezpieczeniowych z linkami do tworzenia kalkulacji/polis/pojazdów

### 🔐 Autoryzacja i uwierzytelnianie
- Logowanie przez email/hasło (Credentials)
- Logowanie przez Google OAuth
- System ról: ADMIN i USER
- Ochrona tras przez middleware

### 👥 Zarządzanie klientami
- Pełny CRUD klientów
- Statusy klientów (NEW_LEAD, IN_CONTACT, DEMO_SENT, NEGOTIATION, ACTIVE_CLIENT, LOST)
- Historia zmian statusu
- Przypisanie do użytkownika
- Udostępnianie przez grupy

### 📞 Zarządzanie kontaktami
- CRUD kontaktów
- Typy kontaktów (PHONE_CALL, MEETING, EMAIL, LINKEDIN_MESSAGE, OTHER)
- Załączniki plików
- Filtrowanie i wyszukiwanie

### ✅ Zarządzanie zadaniami
- CRUD zadań
- Statusy zadań (TODO, IN_PROGRESS, COMPLETED)
- Przypisanie do użytkownika i klienta
- Kalendarz zadań z możliwością kliknięcia
- Udostępnianie przez grupy
- **Synchronizacja z Google Calendar** 📅

### 👨‍💼 Panel administracyjny
- Dashboard administracyjny z przeglądem systemu
- Zarządzanie użytkownikami i rolami
- Zarządzanie grupami
- Import danych z plików Excel

### 📊 Dashboard
- Statystyki (klienci, kontakty, zadania)
- Nadchodzące zadania z linkami do szczegółów
- **Integracja dashboardów agentów ubezpieczeniowych** 🆕
  - Sekcja "Agenci ubezpieczeniowi" w głównym dashboardzie (dla aktywnych agentów)
  - Statystyki kalkulacji według statusu (DRAFT, SENT, ACCEPTED, REJECTED)
  - Statystyki polis (aktywne, wygasające wkrótce)
  - Lista ostatnich kalkulacji i nadchodzących odnowień polis
  - Linki do szczegółowych widoków agenta

### ⚙️ Ustawienia użytkownika
- Preferencje wyświetlania (jasny/ciemny motyw)
- Wybór strefy czasowej dla formatowania dat i godzin
- Kolorystyka interfejsu
- Powiadomienia email

### 📚 Dokumentacja API
- Interaktywna dokumentacja Swagger/OpenAPI dostępna pod `/api-docs`
- Automatyczne generowanie specyfikacji z JSDoc komentarzy
- Endpoint `/api/swagger.json` zwracający pełną specyfikację OpenAPI 3.0
- Weryfikacja dokumentacji: `npm run swagger:verify`

## 🛠️ Technologie

- **Framework:** Next.js 14+ (App Router) z TypeScript
- **Baza danych:** PostgreSQL 16+
- **ORM:** Prisma 5+
- **Autoryzacja:** NextAuth.js v4
- **Stylowanie:** Tailwind CSS + shadcn/ui
- **Integracje:** Google Calendar API

## 📦 Wymagania

- Node.js 20+
- PostgreSQL 16+
- npm 10+
- Docker i Docker Compose (opcjonalnie, dla łatwego uruchomienia)

## 🚀 Szybki start

### Instalacja

1. **Sklonuj repozytorium:**
   ```bash
   git clone <repository-url>
   cd "Projekt CRM"
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Skonfiguruj zmienne środowiskowe:**
   ```bash
   cp .env.example .env
   # Edytuj .env i uzupełnij wymagane wartości
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

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

### Utworzenie konta administratora

```bash
npm run admin:create
```

## 📚 Dokumentacja

- **[Instrukcja instalacji](INSTALACJA.md)** - Szczegółowa instrukcja instalacji i konfiguracji
- **[Szybki start](QUICK_START.md)** - Szybki przewodnik uruchomienia
- **[Wdrożenie](DEPLOY.md)** - Przewodnik wdrożenia na Railway/Vercel
- **[Konfiguracja Google OAuth](GOOGLE_OAUTH_SETUP.md)** - Instrukcja konfiguracji Google OAuth i Calendar API
- **[Dokumentacja API](API_DOCUMENTATION.md)** - Pełna dokumentacja endpointów API

## 🏗️ Struktura projektu

Projekt używa architektury **Domain-Driven Design (DDD)** z podziałem na warstwy:

```
internal-crm/
├── prisma/              # Schema i migracje Prisma
├── src/
│   ├── domain/         # Warstwa domenowa (DDD)
│   │   ├── clients/    # Bounded Context: Klienci
│   │   │   ├── entities/      # Client Entity
│   │   │   ├── value-objects/ # Email, Phone, Website, etc.
│   │   │   ├── repositories/  # IClientRepository (interface)
│   │   │   └── services/      # ClientStatusChangeService
│   │   ├── contacts/   # Bounded Context: Kontakty
│   │   └── tasks/      # Bounded Context: Zadania
│   ├── application/    # Warstwa aplikacyjna
│   │   ├── clients/    # Use Cases i DTO
│   │   └── shared/     # Wspólne typy (UserContext)
│   ├── infrastructure/ # Warstwa infrastruktury
│   │   ├── persistence/ # Implementacje repozytoriów Prisma
│   │   └── logging/    # ActivityLogger
│   ├── presentation/   # Warstwa prezentacji
│   │   └── api/        # API routes (delegacja do Use Cases)
│   ├── app/            # Next.js App Router (routes)
│   │   ├── (auth)/     # Trasy autoryzacji
│   │   ├── (dashboard)/ # Trasy dashboardu
│   │   └── api/        # API endpoints (delegacja do presentation/)
│   ├── components/     # Komponenty React
│   ├── lib/           # Utilities i konfiguracje
│   └── types/         # Definicje TypeScript
├── public/            # Statyczne pliki
└── scripts/             # Skrypty pomocnicze
```

### Architektura DDD

Projekt implementuje **Domain-Driven Design** z następującymi warstwami:

- **Domain Layer** (`src/domain/`) - Logika biznesowa, Entities, Value Objects, Domain Services
- **Application Layer** (`src/application/`) - Use Cases, DTO, orkiestracja operacji biznesowych
- **Infrastructure Layer** (`src/infrastructure/`) - Implementacje repozytoriów, integracje zewnętrzne
- **Presentation Layer** (`src/presentation/`) - API routes, middleware, obsługa HTTP

**Korzyści:**
- ✅ Separacja odpowiedzialności (SRP)
- ✅ Testowalność każdej warstwy osobno
- ✅ Łatwość utrzymania i rozbudowy
- ✅ Enkapsulacja logiki biznesowej

## 🔧 Dostępne skrypty

### Rozwój
- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Zbuduj aplikację produkcyjną
- `npm run start` - Uruchom aplikację produkcyjną
- `npm run lint` - Sprawdź kod linterem

### Baza danych
- `npm run db:generate` - Wygeneruj Prisma Client
- `npm run db:push` - Wypchnij zmiany do bazy (dev)
- `npm run db:migrate` - Uruchom migracje
- `npm run db:studio` - Otwórz Prisma Studio (GUI dla bazy danych)
- `npm run db:seed` - Zasiej towarzystwa ubezpieczeniowe
- `npm run db:clear` - Wyczyść bazę danych (ostrożnie!)

### Administracja
- `npm run admin:create` - Utwórz konto administratora

### Generowanie danych testowych
- `npm run generate:insurance-data` - Wygeneruj dane testowe dla funkcjonalności agencyjnych (200 klientów, 300 pojazdów, 400 kalkulacji, 200 polis)

### Git (wrapper)
- `npm run git:status` - Sprawdź status repozytorium
- `npm run git:add:all` - Dodaj wszystkie pliki
- `npm run git:push` - Wyślij zmiany do repozytorium
- `npm run git -- <komenda>` - Wykonaj dowolną komendę Git

## 🔐 Bezpieczeństwo

Aplikacja wymaga:
- HTTPS w środowisku produkcyjnym
- Dostęp przez VPN (konfiguracja na poziomie infrastruktury)
- Silne hasła i regularne aktualizacje
- **Nigdy nie commituj** `.env` do Git

## 📝 Zmienne środowiskowe

Wymagane zmienne środowiskowe (zobacz `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/internal_crm?schema=public"

# NextAuth (WYMAGANE)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="wygeneruj-sekret-klucz"

# Google OAuth (opcjonalnie, wymagane dla integracji z Calendar)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (opcjonalnie, dla powiadomień)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
```

## 🚢 Wdrożenie

System można wdrożyć na:
- **Railway** (rekomendowane) - zobacz [DEPLOY.md](DEPLOY.md)
- **Vercel + Supabase** - zobacz [DEPLOY.md](DEPLOY.md)
- **Render** - zobacz [DEPLOY.md](DEPLOY.md)

## 📄 Licencja

Własność firmy - użycie wewnętrzne.

## 🤝 Wsparcie

W przypadku pytań lub problemów:
1. Sprawdź dokumentację w folderze projektu
2. Sprawdź logi aplikacji
3. Skontaktuj się z administratorem systemu

---

**Wersja:** 0.10.34-beta  
**Ostatnia aktualizacja:** 21.12.2025
