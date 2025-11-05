# Internal CRM

Wewnętrzny system CRM do zarządzania relacjami z agencjami ubezpieczeniowymi.

## Technologie

- **Framework:** Next.js 14+ (App Router) z TypeScript
- **Baza danych:** PostgreSQL 16+
- **ORM:** Prisma 5+
- **Autoryzacja:** NextAuth.js v5
- **Stylowanie:** Tailwind CSS + shadcn/ui

## Wymagania

- Node.js 18+ 
- PostgreSQL 16+
- Docker i Docker Compose (opcjonalnie, dla łatwego uruchomienia)

## Instalacja

1. Sklonuj repozytorium
2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:
```bash
cp .env.example .env
# Edytuj .env i uzupełnij wymagane wartości
```

4. Skonfiguruj bazę danych:
```bash
# Wygeneruj Prisma Client
npm run db:generate

# Uruchom migracje
npm run db:migrate
```

5. Uruchom serwer deweloperski:
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

## Struktura projektu

```
internal-crm/
├── prisma/              # Schema i migracje Prisma
├── src/
│   ├── app/            # Next.js App Router (routes)
│   ├── components/     # Komponenty React
│   ├── lib/           # Utilities i konfiguracje
│   ├── types/         # Definicje TypeScript
│   └── hooks/         # Custom React hooks
└── public/            # Statyczne pliki
```

## Rozwój

- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Zbuduj aplikację produkcyjną
- `npm run start` - Uruchom aplikację produkcyjną
- `npm run db:studio` - Otwórz Prisma Studio (GUI dla bazy danych)
- `npm run admin:create` - Utwórz konto administratora

## Bezpieczeństwo

Aplikacja wymaga:
- HTTPS w środowisku produkcyjnym
- Dostęp przez VPN (konfiguracja na poziomie infrastruktury)
- Silne hasła i regularne aktualizacje

## Dokumentacja

- [Instrukcja instalacji](INSTALACJA.md)
- [Szybki start](QUICK_START.md)
- [Konfiguracja](SETUP.md)
- [Dokumentacja API](API_DOCUMENTATION.md)

## Funkcjonalności

### ✅ Zaimplementowane

- **Autoryzacja i uwierzytelnianie**
  - Logowanie przez email/hasło (Credentials)
  - Logowanie przez Google OAuth
  - Role: ADMIN i USER
  - Ochrona tras przez middleware

- **Zarządzanie klientami**
  - CRUD klientów
  - Statusy klientów (NEW_LEAD, IN_CONTACT, DEMO_SENT, NEGOTIATION, ACTIVE_CLIENT, LOST)
  - Historia zmian statusu
  - Przypisanie do użytkownika
  - Udostępnianie przez grupy

- **Zarządzanie kontaktami**
  - CRUD kontaktów
  - Typy kontaktów (PHONE_CALL, MEETING, EMAIL, LINKEDIN_MESSAGE, OTHER)
  - Załączniki plików
  - Filtrowanie i wyszukiwanie

- **Zarządzanie zadaniami**
  - CRUD zadań
  - Statusy zadań (TODO, IN_PROGRESS, COMPLETED)
  - Przypisanie do użytkownika i klienta
  - Kalendarz zadań
  - Udostępnianie przez grupy
  - Synchronizacja z Google Calendar

- **Zarządzanie grupami**
  - Tworzenie i zarządzanie grupami (tylko ADMIN)
  - Dodawanie/usuwa użytkowników do/z grup
  - Udostępnianie klientów i zadań grupom

- **Panel administracyjny** (`/admin`)
  - Dashboard administracyjny z przeglądem systemu
  - Zarządzanie użytkownikami (`/admin/users`)
    - Przeglądanie listy użytkowników
    - Zmiana ról (USER/ADMIN)
    - Przeglądanie grup użytkowników
  - Zarządzanie grupami (`/admin/groups`)
    - Tworzenie i edycja grup
    - Dodawanie/usuwa użytkowników do/z grup
    - Przeglądanie członków grup

- **Dashboard**
  - Statystyki (klienci, kontakty, zadania)
  - Nadchodzące zadania (z linkami do szczegółów)

- **Activity Log**
  - Automatyczne logowanie wszystkich akcji (CREATE, UPDATE, DELETE)

## Licencja

Własność firmy - użycie wewnętrzne.

