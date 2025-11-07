# Dokumentacja API - Internal CRM

## Wprowadzenie

API Internal CRM umożliwia zarządzanie klientami, kontaktami, zadaniami, użytkownikami i grupami. Wszystkie endpointy wymagają autoryzacji poprzez NextAuth.js.

**Base URL:** `http://localhost:3000/api` (lub odpowiedni URL produkcyjny)

## Architektura API

Od wersji **0.4.0-beta** API używa architektury **Domain-Driven Design (DDD)** z podziałem na warstwy:

- **Presentation Layer** (`src/presentation/api/`) - API routes z middleware autoryzacji
- **Application Layer** (`src/application/`) - Use Cases orkiestrujące operacje biznesowe
- **Domain Layer** (`src/domain/`) - Entities, Value Objects, Domain Services z logiką biznesową
- **Infrastructure Layer** (`src/infrastructure/`) - Implementacje repozytoriów (Prisma)

**Korzyści:**
- ✅ Separacja odpowiedzialności (SRP)
- ✅ Walidacja danych w Value Objects
- ✅ Logika biznesowa enkapsulowana w Entities
- ✅ Testowalność każdej warstwy osobno
- ✅ Łatwość utrzymania i rozbudowy

**Uwaga:** API interface pozostaje niezmieniony - wszystkie endpointy działają tak samo jak przed refaktoryzacją.

## Format identyfikatorów (ID)

**Ważne:** System używa formatu **CUID** (Collision-resistant Unique Identifier) dla wszystkich identyfikatorów w bazie danych, **NIE UUID**.

## Strefa czasowa

Od wersji **0.4.1-beta** system obsługuje strefy czasowe użytkowników:

- Użytkownicy mogą wybrać swoją strefę czasową w ustawieniach preferencji
- Domyślnie używana jest strefa czasowa przeglądarki
- Wszystkie daty i godziny są formatowane z uwzględnieniem strefy czasowej przeglądarki
- Funkcje pomocnicze dostępne w `src/lib/timezone.ts`:
  - `getUserTimezone(timezone?)` - pobiera strefę czasową użytkownika lub domyślną
  - `formatDateInTimezone(date, timezone?, options?)` - formatuje datę z uwzględnieniem strefy
  - `formatDateTimeInTimezone(date, timezone?, options?)` - formatuje datę i godzinę z uwzględnieniem strefy
  - `utcDateToLocalDateTime(date, timezone?)` - konwertuje datę UTC na format datetime-local w lokalnej strefie czasowej przeglądarki
  - `localDateTimeToUTC(dateTimeString, timezone?)` - konwertuje datetime-local na UTC Date

**Uwaga:** W formularzach używany jest `datetime-local`, który automatycznie używa strefy czasowej przeglądarki. Daty z bazy danych (zapisane w UTC) są konwertowane na lokalną strefę czasową przeglądarki przy wyświetlaniu w formularzach.

- **CUID** to format używany domyślnie przez Prisma ORM
- Przykład CUID: `cmhnww4wl0001sghcpfrzy507`
- CUID jest walidowany jako niepusty string - nie ma dodatkowej walidacji formatu
- Wszystkie ID w path parameters i query parameters są w formacie CUID

## Autoryzacja

Wszystkie endpointy wymagają autoryzacji. Użyj sesji cookie z NextAuth.js lub tokenu autoryzacyjnego w nagłówku:

```
Authorization: Bearer <token>
```

Lub użyj sesji cookie (dla aplikacji webowej).

## Kody odpowiedzi

- `200` - Sukces
- `201` - Utworzono
- `400` - Błąd walidacji
- `401` - Nieautoryzowany
- `403` - Brak uprawnień
- `404` - Nie znaleziono
- `500` - Błąd serwera

---

## Klienci

### GET /api/clients

Pobiera listę klientów.

**Query Parameters:**
- `status` (opcjonalne) - Filtr statusu (NEW_LEAD, IN_CONTACT, DEMO_SENT, NEGOTIATION, ACTIVE_CLIENT, LOST)
- `search` (opcjonalne) - Wyszukiwanie po nazwie, emailu
- `assignedTo` (opcjonalne) - ID użytkownika przypisanego (CUID format)
- `noContactDays` (opcjonalne) - Liczba dni jako string. Filtruje klientów bez kontaktu przez X dni lub nigdy (lastContactAt < today - X dni lub lastContactAt IS NULL)
- `followUpToday` (opcjonalne) - "true" jako string. Filtruje klientów z follow-up dzisiaj (nextFollowUpAt = today)

**Response:**
```json
{
  "clients": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "agencyName": "string | null",
      "email": "string | null",
      "phone": "string | null",
      "website": "string | null",
      "address": "string | null",
      "source": "string | null",
      "status": "NEW_LEAD | IN_CONTACT | DEMO_SENT | NEGOTIATION | ACTIVE_CLIENT | LOST",
      "priority": "LOW | MEDIUM | HIGH | null",
      "lastContactAt": "2024-01-01T00:00:00.000Z | null",
      "nextFollowUpAt": "2024-01-01T00:00:00.000Z | null",
      "assignedTo": "string | null",
      "assignee": {
        "id": "string",
        "name": "string | null",
        "email": "string"
      },
      "sharedGroups": [
        {
          "id": "string",
          "name": "string"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/clients

Tworzy nowego klienta.

**Request Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "agencyName": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "website": "string (optional)",
  "address": "string (optional)",
  "source": "string (optional)",
  "status": "NEW_LEAD | IN_CONTACT | DEMO_SENT | NEGOTIATION | ACTIVE_CLIENT | LOST (default: NEW_LEAD)",
  "priority": "LOW | MEDIUM | HIGH (optional)",
  "nextFollowUpAt": "string (optional)" - Data w formacie ISO string (np. "2024-01-01T10:00:00.000Z")
  "assignedTo": "string (optional)",
  "sharedGroupIds": ["string"] (optional) - Array ID grup do udostępnienia
}
```

**Response:** `201 Created`
```json
{
  "client": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    ...
  }
}
```

### GET /api/clients/[id]

Pobiera szczegóły klienta.

**Response:**
```json
{
  "client": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "agencyName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "website": "string | null",
    "address": "string | null",
    "source": "string | null",
    "status": "string",
    "assignedTo": "string | null",
    "assignee": {...},
    "sharedGroups": [...],
    "contacts": [...],
    "tasks": [...],
    "statusHistory": [...]
  }
}
```

### PATCH /api/clients/[id]

Aktualizuje klienta.

**Request Body:** (wszystkie pola opcjonalne)
```json
{
  "firstName": "string",
  "lastName": "string",
  "agencyName": "string",
  "email": "string",
  "phone": "string",
  "website": "string",
  "address": "string",
  "source": "string",
  "status": "string",
  "assignedTo": "string",
  "sharedGroupIds": ["string"] - Array ID grup (zastępuje istniejące)
}
```

### DELETE /api/clients/[id]

Usuwa klienta. (Tylko ADMIN)

---

## Kontakty

### GET /api/contacts

Pobiera listę kontaktów.

**Query Parameters:**
- `type` (opcjonalne) - Typ kontaktu (PHONE_CALL, MEETING, EMAIL, LINKEDIN_MESSAGE, OTHER)
- `clientId` (opcjonalne) - ID klienta
- `userId` (opcjonalne) - ID użytkownika

**Response:**
```json
{
  "contacts": [
    {
      "id": "string",
      "type": "PHONE_CALL | MEETING | EMAIL | LINKEDIN_MESSAGE | OTHER | null",
      "date": "2024-01-01T00:00:00.000Z",
      "notes": "string",
      "isNote": "boolean",
      "userId": "string",
      "clientId": "string",
      "client": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "agencyName": "string | null"
      },
      "user": {
        "id": "string",
        "name": "string | null",
        "email": "string"
      },
      "attachments": [
        {
          "id": "string",
          "filename": "string",
          "path": "string",
          "size": "number",
          "mimeType": "string | null"
        }
      ]
    }
  ]
}
```

### POST /api/contacts

Tworzy nowy kontakt lub notatkę.

**Request:** FormData (multipart/form-data) lub JSON
- `type` (opcjonalne) - Typ kontaktu (PHONE_CALL, MEETING, EMAIL, LINKEDIN_MESSAGE, OTHER). **Opcjonalne dla notatek** (isNote=true)
- `date` (required) - Data i godzina (ISO string)
- `notes` (required) - Notatka/treść kontaktu
- `isNote` (opcjonalne, default: false) - Flaga rozróżniająca notatki od kontaktów
  - `false` - Kontakt (faktyczna interakcja) - wymaga typu, aktualizuje `lastContactAt` klienta
  - `true` - Notatka (wewnętrzna notatka) - typ opcjonalny, nie aktualizuje `lastContactAt`
- `userId` (required) - ID użytkownika
- `clientId` (required) - ID klienta
- `files` (optional) - Pliki do załączenia (multiple)
- `sharedGroupIds` (optional) - Array ID grup do udostępnienia

**Uwaga:** Przy tworzeniu kontaktu (isNote=false), system automatycznie aktualizuje pole `lastContactAt` klienta na datę kontaktu.

**Response:** `201 Created`

---

## Zadania

### GET /api/tasks

Pobiera listę zadań.

**Query Parameters:**
- `status` (opcjonalne) - Status zadania (TODO, IN_PROGRESS, COMPLETED)
- `assignedTo` (opcjonalne) - ID użytkownika

**Response:**
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "dueDate": "2024-01-01T00:00:00.000Z | null",
      "status": "TODO | IN_PROGRESS | COMPLETED",
      "assignedTo": "string | null",
      "clientId": "string | null",
      "assignee": {
        "id": "string",
        "name": "string | null",
        "email": "string"
      },
      "client": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "agencyName": "string | null"
      },
      "sharedGroups": [
        {
          "id": "string",
          "name": "string"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/tasks

Tworzy nowe zadanie.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "dueDate": "string (optional, ISO datetime)",
  "status": "TODO | IN_PROGRESS | COMPLETED (default: TODO)",
  "assignedTo": "string (optional)",
  "clientId": "string (optional)",
  "sharedGroupIds": ["string"] (optional) - Array ID grup do udostępnienia
}
```

**Response:** `201 Created`

### GET /api/tasks/[id]

Pobiera szczegóły zadania.

### PATCH /api/tasks/[id]

Aktualizuje zadanie.

**Request Body:** (wszystkie pola opcjonalne)
```json
{
  "title": "string",
  "description": "string",
  "dueDate": "string",
  "status": "string",
  "assignedTo": "string",
  "clientId": "string",
  "sharedGroupIds": ["string"] - Array ID grup (zastępuje istniejące)
}
```

### DELETE /api/tasks/[id]

Usuwa zadanie. (Tylko ADMIN lub właściciel)

---

## Użytkownicy (Admin)

### GET /api/admin/users

Pobiera listę użytkowników. (Tylko ADMIN)

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string | null",
      "position": "string | null",
      "role": "USER | ADMIN",
      "groups": [
        {
          "group": {
            "id": "string",
            "name": "string"
          }
        }
      ]
    }
  ]
}
```

### PATCH /api/admin/users/[id]

Aktualizuje użytkownika. (Tylko ADMIN)

**Request Body:**
```json
{
  "role": "USER | ADMIN"
}
```

---

## Grupy (Admin)

### GET /api/admin/groups

Pobiera listę grup. (Tylko ADMIN)

### POST /api/admin/groups

Tworzy nową grupę. (Tylko ADMIN)

**Request Body:**
```json
{
  "name": "string (required, min 2 znaki)",
  "description": "string (optional)"
}
```

**Response:** `201 Created`

### POST /api/admin/groups/[id]/users

Dodaje użytkownika do grupy. (Tylko ADMIN)

**Request Body:**
```json
{
  "userId": "string (required)"
}
```

**Response:** `201 Created`

### DELETE /api/admin/groups/[id]/users/[userId]

Usuwa użytkownika z grupy. (Tylko ADMIN)

**Response:** `200 OK`

---

## Deale (Deals)

### GET /api/deals

Pobiera listę deali.

**Query Parameters:**
- `clientId` (opcjonalne) - ID klienta (CUID format)
- `stage` (opcjonalne) - Filtr etapu (INITIAL_CONTACT, PROPOSAL, NEGOTIATION, CLOSING, WON, LOST)
- `search` (opcjonalne) - Wyszukiwanie po notatkach lub nazwie klienta

**Response:**
```json
{
  "deals": [
    {
      "id": "string",
      "clientId": "string",
      "value": 10000.00,
      "currency": "PLN",
      "probability": 75,
      "stage": "NEGOTIATION",
      "expectedCloseDate": "2024-12-31T00:00:00.000Z",
      "notes": "string | null",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Autoryzacja:** Wymagana. Użytkownik widzi tylko deali przypisane do swoich klientów lub udostępnione przez grupy.

### POST /api/deals

Tworzy nowy deal.

**Request Body:**
```json
{
  "clientId": "string (required)",
  "value": 10000.00,
  "currency": "PLN (optional, default: PLN)",
  "probability": 50,
  "stage": "INITIAL_CONTACT (optional, default: INITIAL_CONTACT)",
  "expectedCloseDate": "2024-12-31T00:00:00.000Z (optional)",
  "notes": "string (optional)",
  "sharedGroupIds": ["group-id-1", "group-id-2"] (optional)
}
```

**Response:** `201 Created`
```json
{
  "deal": {
    "id": "string",
    "clientId": "string",
    "value": 10000.00,
    "currency": "PLN",
    "probability": 50,
    "stage": "INITIAL_CONTACT",
    "expectedCloseDate": "2024-12-31T00:00:00.000Z",
    "notes": "string | null",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Autoryzacja:** Wymagana. Użytkownik musi mieć dostęp do klienta (przypisany lub przez grupę).

### GET /api/deals/[id]

Pobiera szczegóły deala.

**Response:**
```json
{
  "deal": {
    "id": "string",
    "clientId": "string",
    "value": 10000.00,
    "currency": "PLN",
    "probability": 75,
    "stage": "NEGOTIATION",
    "expectedCloseDate": "2024-12-31T00:00:00.000Z",
    "notes": "string | null",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Autoryzacja:** Wymagana. Użytkownik musi mieć dostęp do deala (przez klienta lub grupę).

### PATCH /api/deals/[id]

Aktualizuje deal.

**Request Body:**
```json
{
  "value": 15000.00 (optional),
  "currency": "EUR (optional)",
  "probability": 80 (optional),
  "stage": "CLOSING (optional)",
  "expectedCloseDate": "2024-12-31T00:00:00.000Z (optional)",
  "notes": "string (optional)",
  "sharedGroupIds": ["group-id-1"] (optional)
}
```

**Response:**
```json
{
  "deal": {
    "id": "string",
    "clientId": "string",
    "value": 15000.00,
    "currency": "EUR",
    "probability": 80,
    "stage": "CLOSING",
    "expectedCloseDate": "2024-12-31T00:00:00.000Z",
    "notes": "string | null",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Autoryzacja:** Wymagana. Użytkownik musi mieć dostęp do deala.

**Uwagi:**
- Zmiana etapu (stage) jest walidowana przez DealPipelineService
- Nie można zmienić etapu z WON/LOST na inny (deale zamknięte)
- Nie można zmienić etapu na WON z INITIAL_CONTACT lub PROPOSAL (musi przejść przez NEGOTIATION/CLOSING)

### POST /api/deals/[id]/close

Zamyka deal (WON lub LOST).

**Request Body:**
```json
{
  "won": true
}
```

**Response:**
```json
{
  "deal": {
    "id": "string",
    "clientId": "string",
    "value": 10000.00,
    "currency": "PLN",
    "probability": 100,
    "stage": "WON",
    "expectedCloseDate": "2024-12-31T00:00:00.000Z",
    "notes": "string | null",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Autoryzacja:** Wymagana. Użytkownik musi mieć dostęp do deala.

**Uwagi:**
- Jeśli `won: true`, deal przechodzi na etap WON i automatycznie aktualizuje status klienta na ACTIVE_CLIENT
- Jeśli `won: false`, deal przechodzi na etap LOST
- Operacja jest atomowa (transakcja) - jeśli aktualizacja statusu klienta się nie powiedzie, cała operacja jest wycofywana
- Deal musi być w etapie NEGOTIATION lub CLOSING, aby mógł być wygrany

### DELETE /api/deals/[id]

Usuwa deal.

**Response:** `200 OK`
```json
{
  "message": "Deal został usunięty"
}
```

**Autoryzacja:** Wymagana. Użytkownik musi mieć dostęp do deala.

**Etapy pipeline (DealStage):**
- `INITIAL_CONTACT` - Pierwszy kontakt
- `PROPOSAL` - Oferta
- `NEGOTIATION` - Negocjacje
- `CLOSING` - Zamykanie
- `WON` - Wygrany (zamknięty)
- `LOST` - Przegrany (zamknięty)

**Walidacja przejść między etapami:**
- Można przejść do przodu przez pipeline: INITIAL_CONTACT → PROPOSAL → NEGOTIATION → CLOSING → WON
- Można cofnąć się w pipeline (np. z NEGOTIATION do PROPOSAL)
- Można przeskoczyć etapy (np. z PROPOSAL do CLOSING)
- Nie można zmienić etapu z WON/LOST na inny (deale zamknięte)
- Można zawsze przejść do LOST z dowolnego etapu (deal może być przegrany w każdym momencie)
- Nie można przejść do WON z INITIAL_CONTACT lub PROPOSAL (musi przejść przez NEGOTIATION/CLOSING)

---

## Kalendarz

### POST /api/calendar/sync

Synchronizuje zadanie z Google Calendar. Tworzy wydarzenie w kalendarzu Google użytkownika na podstawie danych zadania.

**Wymagania:**
- Użytkownik musi być zalogowany (sesja NextAuth)
- Użytkownik musi być zalogowany **przez Google OAuth** (nie przez email/hasło)
- Aplikacja musi mieć skonfigurowane Google OAuth (zobacz `GOOGLE_OAUTH_SETUP.md`)
- Wymagane uprawnienia: `https://www.googleapis.com/auth/calendar` i `https://www.googleapis.com/auth/calendar.events`

**Request Body:**
```json
{
  "taskId": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "message": "Zadanie zostało zsynchronizowane z kalendarzem Google",
  "eventId": "string"
}
```

**Błędy:**

**401 Unauthorized - Brak autoryzacji Google:**
```json
{
  "error": "Brak dostępu do Google Calendar. Zaloguj się przez Google, aby włączyć synchronizację kalendarza.",
  "requiresGoogleAuth": true
}
```
**Rozwiązanie:** Użytkownik musi zalogować się przez Google OAuth (nie przez email/hasło).

**401 Unauthorized - Sesja wygasła:**
```json
{
  "error": "Sesja Google wygasła. Zaloguj się ponownie przez Google.",
  "requiresReauth": true
}
```
**Rozwiązanie:** Użytkownik musi ponownie zalogować się przez Google, aby odświeżyć tokeny.

**403 Forbidden - Brak uprawnień:**
```json
{
  "error": "Brak uprawnień do Google Calendar. Sprawdź ustawienia aplikacji w Google Cloud Console.",
  "requiresScope": true
}
```
**Rozwiązanie:** Sprawdź czy w Google Cloud Console aplikacja ma włączone odpowiednie zakresy (scopes) dla Google Calendar API.

**400 Bad Request - Błąd walidacji:**
```json
{
  "error": "taskId is required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Wystąpił błąd podczas synchronizacji z kalendarzem",
  "details": "Szczegóły błędu (tylko w trybie development)"
}
```

**Przykład użycia:**

```javascript
// Synchronizuj zadanie z Google Calendar
const response = await fetch('/api/calendar/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    taskId: 'task-id-123'
  })
});

const data = await response.json();

if (!response.ok) {
  if (data.requiresGoogleAuth || data.requiresReauth) {
    // Przekieruj użytkownika do logowania przez Google
    alert('Musisz zalogować się przez Google, aby synchronizować z kalendarzem');
    window.location.href = '/signin';
  } else {
    alert(data.error);
  }
} else {
  console.log('Zadanie zsynchronizowane:', data.eventId);
}
```

**Uwagi:**
- Tokeny OAuth są automatycznie odświeżane, jeśli są dostępne
- Wydarzenie w Google Calendar zawiera tytuł zadania, opis i datę wykonania
- Każde zadanie może być zsynchronizowane tylko raz (nie tworzy duplikatów)

---

## Profil użytkownika

### GET /api/users/profile

Pobiera profil zalogowanego użytkownika.

### PATCH /api/users/profile

Aktualizuje profil użytkownika.

**Request Body:**
```json
{
  "name": "string (optional)",
  "position": "string (optional)"
}
```

---

## Preferencje użytkownika

### GET /api/users/preferences

Pobiera preferencje zalogowanego użytkownika.

**Response:**
```json
{
  "preferences": {
    "id": "string",
    "userId": "string",
    "theme": "light | dark | null",
    "language": "pl | en | null",
    "timezone": "string | null",
    "primaryColor": "string | null",
    "themeName": "blue | green | purple | red | custom | system | null",
    "emailTasks": true,
    "emailContacts": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PATCH /api/users/preferences

Aktualizuje preferencje użytkownika.

**Request Body:**
```json
{
  "theme": "light | dark (optional)",
  "language": "pl | en (optional)",
  "timezone": "string (optional, IANA timezone, e.g., 'Europe/Warsaw')",
  "colorScheme": {
    "primaryColor": "string (optional, hex color, e.g., '#3b82f6')",
    "themeName": "blue | green | purple | red | custom | system (optional)"
  },
  "notifications": {
    "emailTasks": "boolean (optional)",
    "emailContacts": "boolean (optional)"
  }
}
```

**Response:**
```json
{
  "message": "Preferencje zostały zaktualizowane",
  "preferences": {
    "id": "string",
    "userId": "string",
    "theme": "light | dark | null",
    "language": "pl | en | null",
    "timezone": "string | null",
    "primaryColor": "string | null",
    "themeName": "blue | green | purple | red | custom | system | null",
    "emailTasks": true,
    "emailContacts": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Uwagi:**
- Pole `timezone` przyjmuje wartości IANA timezone (np. "Europe/Warsaw", "America/New_York")
- Jeśli `timezone` nie jest podane, system używa domyślnej strefy czasowej przeglądarki
- Wszystkie pola są opcjonalne - można aktualizować tylko wybrane preferencje

---

## Uwagi dotyczące uprawnień

- **ADMIN** - Pełny dostęp do wszystkich zasobów
- **USER** - Dostęp tylko do:
  - Przypisanych klientów/zadań
  - Klientów/zadań udostępnionych przez grupy, do których należy
  - Własnych kontaktów

## Limity i limity

- Maksymalny rozmiar pliku załącznika: zależy od konfiguracji serwera
- Rate limiting: nie zaimplementowany (do dodania w produkcji)

## Obsługa błędów

Wszystkie błędy zwracają odpowiedź w formacie:

```json
{
  "error": "Opis błędu"
}
```

Przy błędach walidacji (400):
```json
{
  "error": "Komunikat błędu walidacji"
}
```

## Przykłady użycia

### cURL

```bash
# Pobierz klientów
curl -X GET "http://localhost:3000/api/clients" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Utwórz klienta
curl -X POST "http://localhost:3000/api/clients" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "firstName": "Jan",
    "lastName": "Kowalski",
    "agencyName": "Agencja Testowa",
    "email": "jan@example.com",
    "status": "NEW_LEAD",
    "sharedGroupIds": ["group-id-1", "group-id-2"]
  }'

# Utwórz kontakt z załącznikiem
curl -X POST "http://localhost:3000/api/contacts" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "type=MEETING" \
  -F "date=2024-01-15T10:00:00Z" \
  -F "notes=Spotkanie z klientem" \
  -F "userId=user-id" \
  -F "clientId=client-id" \
  -F "files=@document.pdf"
```

### JavaScript (Fetch)

```javascript
// Pobierz zadania
const response = await fetch('/api/tasks', {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Wysyła cookies
});

const data = await response.json();
console.log(data.tasks);

// Utwórz zadanie
const newTask = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Nowe zadanie',
    description: 'Opis zadania',
    dueDate: '2024-12-31T23:59:59Z',
    status: 'TODO',
    sharedGroupIds: ['group-1', 'group-2'],
  }),
});
```

---

## Wersjonowanie

Obecna wersja API: **v1** (domyślna)

W przyszłości można dodać wersjonowanie poprzez prefiks `/api/v1/...`

---

## Kontakt

W przypadku pytań lub problemów z API, skontaktuj się z administratorem systemu.

