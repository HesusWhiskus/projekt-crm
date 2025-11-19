# Dokumentacja API - Internal CRM

## Wprowadzenie

API Internal CRM umożliwia zarządzanie klientami, kontaktami, zadaniami, użytkownikami i grupami. Wszystkie endpointy wymagają autoryzacji poprzez NextAuth.js.

**Base URL:** `http://localhost:3000/api` (lub odpowiedni URL produkcyjny)

## Dokumentacja Swagger/OpenAPI

Od wersji **0.4.2-beta** API posiada interaktywną dokumentację Swagger/OpenAPI:

- **Swagger UI:** `/api-docs` (wymaga zalogowania)
- **OpenAPI Spec:** `/api/swagger.json`

Dokumentacja Swagger jest generowana automatycznie z JSDoc komentarzy w kodzie źródłowym. Wszystkie endpointy są udokumentowane z opisami, parametrami, schematami request/response i kodami odpowiedzi.

**Weryfikacja dokumentacji:**
```bash
npm run swagger:verify
```

Skrypt weryfikuje, czy wszystkie endpointy są poprawnie udokumentowane i porównuje z tą dokumentacją markdown.

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

### GET /api/clients/search

Wyszukuje klientów po nazwie, emailu lub telefonie. Zwraca maksymalnie 50 wyników.

**Query Parameters:**
- `q` (wymagane) - Fraza wyszukiwania (minimum 2 znaki)

**Response:**
```json
{
  "clients": [
    {
      "id": "string",
      "firstName": "string | null",
      "lastName": "string | null",
      "companyName": "string | null",
      "type": "PERSON | COMPANY",
      "email": "string | null"
    }
  ]
}
```

**Kody odpowiedzi:**
- `200` - Sukces
- `400` - Błąd walidacji (fraza za krótka)
- `401` - Nieautoryzowany
- `500` - Błąd serwera

**Uwagi:**
- Wyszukiwanie wymaga minimum 2 znaków
- Limit wyników: 50
- Wyszukiwanie uwzględnia uprawnienia użytkownika (tylko przypisani klienci lub udostępnieni przez grupy)
- Wyszukiwanie jest case-insensitive

### POST /api/clients/bulk-assign

Masowo przypisuje klientów do użytkownika.

**Request Body:**
```json
{
  "clientIds": ["string"],
  "assignedTo": "string | null"
}
```

**Parametry:**
- `clientIds` (wymagane, array) - Array ID klientów do przypisania (minimum 1)
- `assignedTo` (opcjonalne, string | null) - ID użytkownika do przypisania (null aby usunąć przypisanie)

**Response:**
```json
{
  "success": true,
  "updated": 5
}
```

**Kody odpowiedzi:**
- `200` - Sukces
- `400` - Błąd walidacji
- `401` - Nieautoryzowany
- `403` - Brak uprawnień (tylko ADMIN lub właściciel klientów)
- `500` - Błąd serwera

**Uwagi:**
- ADMIN może przypisać dowolnych klientów
- USER może przypisać tylko swoich klientów
- Operacja wykonywana w transakcji
- Aktualizacja jest atomowa (wszystko lub nic)

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

## Integracje (Pro)

### POST /api/integrations/webhook

Tworzy dynamiczną zakładkę integracji dla klienta. Wymaga planu PRO i funkcji `integration_tabs`.

**Request Body:**
```json
{
  "clientId": "string (wymagane)",
  "title": "string (wymagane, max 200 znaków)",
  "content": {
    "key1": "value1",
    "key2": "value2"
  },
  "order": 0
}
```

**Response:**
- `201 Created`: Zakładka utworzona
- `400 Bad Request`: Błąd walidacji
- `401 Unauthorized`: Brak autoryzacji
- `403 Forbidden`: Funkcja nie dostępna w planie
- `404 Not Found`: Klient nie znaleziony

**Uwagi techniczne:**
- Endpoint wymaga autoryzacji
- Sprawdza dostęp do klienta (przypisany lub ADMIN)
- Wymaga włączonej funkcji `integration_tabs` w planie PRO

### GET /api/clients/[id]/integration-tabs

Pobiera zakładki integracji dla klienta. Wymaga planu PRO.

**Response:**
```json
{
  "tabs": [
    {
      "id": "string",
      "title": "string",
      "content": {},
      "order": 0
    }
  ]
}
```

**Uwagi techniczne:**
- Endpoint wymaga autoryzacji
- Sprawdza dostęp do klienta
- Wymaga włączonej funkcji `integration_tabs` w planie PRO

## Synchronizacja

### POST /api/sync

Synchronizuje dane między klientem a serwerem. Wysyła zmiany z klienta i pobiera najnowsze dane z serwera.

**Request Body:**
```json
{
  "entityType": "clients" | "contacts" | "tasks",
  "lastSyncTimestamp": 1234567890,
  "changes": [
    {
      "id": "string",
      "action": "create" | "update" | "delete",
      "data": {},
      "timestamp": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "synced": [],
    "conflicts": [],
    "errors": []
  },
  "data": [],
  "timestamp": 1234567890
}
```

**Uwagi techniczne:**
- Endpoint wymaga autoryzacji
- Rate limiting: 60 requestów/minutę
- Obsługuje synchronizację dwukierunkową
- Automatycznie filtruje dane według uprawnień użytkownika

## Notatki

### POST /api/notes

Tworzy nową notatkę dla klienta.

**Request:** FormData (multipart/form-data) lub JSON
- `date` (required) - Data i godzina (ISO string)
- `notes` (required) - Treść notatki
- `userId` (required) - ID użytkownika
- `clientId` (required) - ID klienta
- `files` (optional) - Pliki do załączenia (multiple)
- `sharedGroupIds` (optional) - Array ID grup do udostępnienia

**Uwaga:** 
- Notatki **nie aktualizują** pola `lastContactAt` klienta
- Notatki są automatycznie tworzone z `isNote=true` i `type=null`
- Zalecane jest używanie tego endpointu zamiast `/api/contacts` z flagą `isNote=true`

**Response:** `201 Created`

```json
{
  "contact": {
    "id": "string",
    "type": null,
    "date": "2024-01-01T00:00:00.000Z",
    "notes": "string",
    "isNote": true,
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
    "attachments": [...],
    "sharedGroups": [...]
  }
}
```

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
    "lastSeenVersion": "string | null",
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
  },
  "lastSeenVersion": "string (optional, e.g., '0.6.6-beta')"
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
    "lastSeenVersion": "string | null",
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

## Ostatnia zobaczona wersja changelogu

### GET /api/users/last-seen-version

Pobiera ostatnią zobaczoną wersję changelogu dla zalogowanego użytkownika (używane przez komponent "Co nowego").

**Response:**
```json
{
  "lastSeenVersion": "0.6.6-beta | null"
}
```

**Uwagi:**
- Zwraca `null` jeśli użytkownik nie ma zapisanej ostatniej zobaczonej wersji
- Wersja jest zapisywana w polu `lastSeenVersion` w tabeli `user_preferences`

### POST /api/users/last-seen-version

Zapisuje ostatnią zobaczoną wersję changelogu dla zalogowanego użytkownika.

**Request Body:**
```json
{
  "version": "string (required, e.g., '0.6.6-beta')"
}
```

**Response:**
```json
{
  "message": "Ostatnia zobaczona wersja została zaktualizowana",
  "lastSeenVersion": "0.6.6-beta"
}
```

**Uwagi:**
- Endpoint automatycznie tworzy rekord `UserPreferences` jeśli nie istnieje
- Wersja jest używana do wyświetlania znacznika "nowe" w komponencie "Co nowego"
- Każdy użytkownik ma osobny znacznik - kliknięcie przez jednego użytkownika nie znika dla innych

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

## Agenty ubezpieczeniowi (Insurance Agents)

### POST /api/insurance-agents

Tworzy nowego agenta ubezpieczeniowego. (Tylko ADMIN)

**Request Body:**
```json
{
  "userId": "string (required, CUID)",
  "licenseNumber": "string (optional)",
  "isActive": "boolean (optional, default: true)",
  "settings": {
    "showVehicles": "boolean (optional)",
    "showCalculations": "boolean (optional)",
    "showPolicies": "boolean (optional)",
    "showClients": "boolean (optional)",
    "showDashboard": "boolean (optional)",
    "showReports": "boolean (optional)"
  },
  "organizationId": "string (optional, CUID)"
}
```

**Response:** `201 Created`
```json
{
  "agent": {
    "id": "string",
    "userId": "string",
    "licenseNumber": "string | null",
    "isActive": true,
    "settings": {},
    "organizationId": "string | null",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/insurance-agents/[id]

Pobiera szczegóły agenta ubezpieczeniowego.

**Response:**
```json
{
  "agent": {
    "id": "string",
    "userId": "string",
    "licenseNumber": "string | null",
    "isActive": true,
    "settings": {},
    "user": {
      "id": "string",
      "name": "string | null",
      "email": "string"
    },
    "organizationId": "string | null"
  }
}
```

### PUT /api/insurance-agents/[id]

Aktualizuje agenta ubezpieczeniowego. (Tylko ADMIN)

**Request Body:** (wszystkie pola opcjonalne)
```json
{
  "licenseNumber": "string",
  "isActive": "boolean",
  "settings": {}
}
```

### PUT /api/insurance-agents/[id]/visibility

Aktualizuje ustawienia widoczności elementów UI dla agenta.

**Request Body:**
```json
{
  "settings": {
    "showVehicles": "boolean",
    "showCalculations": "boolean",
    "showPolicies": "boolean",
    "showClients": "boolean",
    "showDashboard": "boolean",
    "showReports": "boolean"
  }
}
```

**Response:**
```json
{
  "message": "Ustawienia widoczności zostały zaktualizowane",
  "agent": {
    "id": "string",
    "settings": {}
  }
}
```

---

## Pojazdy (Vehicles)

### POST /api/vehicles

Tworzy nowy pojazd. Wymaga feature flag `INSURANCE_AGENTS` i aktywnego agenta ubezpieczeniowego.

**Request Body:**
```json
{
  "vin": "string (optional, min 17 znaków)",
  "registrationNumber": "string (optional)",
  "firstRegistrationDate": "string (optional, ISO datetime)",
  "importedFromAbroad": "boolean (optional)",
  "hasValidInspection": "boolean (optional)",
  "hasLpgInstallation": "boolean (optional)",
  "purchaseYear": "number (optional, 1900-2100)",
  "currentMileage": "number (optional, min 0)",
  "eurotaxData": "object (optional)",
  "infoEkspertData": "object (optional)",
  "clientIds": ["string"] (optional, array CUID) - Array ID klientów-właścicieli
}
```

**Uwagi:**
- Wymagany jest VIN lub numer rejestracyjny (przynajmniej jedno)
- `clientIds` - opcjonalna lista ID klientów do przypisania jako właściciele

**Response:** `201 Created`
```json
{
  "vehicle": {
    "id": "string",
    "vin": "string | null",
    "registrationNumber": "string | null",
    "firstRegistrationDate": "2024-01-01T00:00:00.000Z | null",
    "importedFromAbroad": false,
    "hasValidInspection": true,
    "hasLpgInstallation": false,
    "purchaseYear": 2015,
    "currentMileage": 220000,
    "eurotaxData": {},
    "infoEkspertData": {},
    "organizationId": "string",
    "owners": [
      {
        "id": "string",
        "clientId": "string",
        "vehicleId": "string",
        "client": {
          "id": "string",
          "firstName": "string",
          "lastName": "string"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/vehicles

Pobiera listę pojazdów z filtrowaniem.

**Query Parameters:**
- `clientId` (opcjonalne, CUID) - Filtr po kliencie-właścicielu
- `vin` (opcjonalne) - Filtr po numerze VIN
- `registrationNumber` (opcjonalne) - Filtr po numerze rejestracyjnym
- `page` (opcjonalne, default: 1) - Numer strony
- `limit` (opcjonalne, default: 20) - Liczba wyników na stronę

**Response:**
```json
{
  "vehicles": [
    {
      "id": "string",
      "vin": "string | null",
      "registrationNumber": "string | null",
      "owners": [
        {
          "client": {
            "id": "string",
            "firstName": "string",
            "lastName": "string"
          }
        }
      ]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### GET /api/vehicles/[id]

Pobiera szczegóły pojazdu.

**Response:**
```json
{
  "vehicle": {
    "id": "string",
    "vin": "string | null",
    "registrationNumber": "string | null",
    "firstRegistrationDate": "2024-01-01T00:00:00.000Z | null",
    "importedFromAbroad": false,
    "hasValidInspection": true,
    "hasLpgInstallation": false,
    "purchaseYear": 2015,
    "currentMileage": 220000,
    "eurotaxData": {},
    "infoEkspertData": {},
    "owners": [...],
    "calculations": [...],
    "policies": [...]
  }
}
```

### PUT /api/vehicles/[id]

Aktualizuje pojazd.

**Request Body:** (wszystkie pola opcjonalne)
```json
{
  "vin": "string",
  "registrationNumber": "string",
  "firstRegistrationDate": "string (ISO datetime)",
  "importedFromAbroad": "boolean",
  "hasValidInspection": "boolean",
  "hasLpgInstallation": "boolean",
  "purchaseYear": "number",
  "currentMileage": "number",
  "eurotaxData": {},
  "infoEkspertData": {}
}
```

### POST /api/vehicles/[id]/owners

Przypisuje klienta jako właściciela pojazdu.

**Request Body:**
```json
{
  "clientId": "string (required, CUID)"
}
```

**Response:** `201 Created`

### DELETE /api/vehicles/[id]/owners/[clientId]

Usuwa klienta z listy właścicieli pojazdu.

**Response:** `200 OK`

### POST /api/vehicles/[id]/enrich

Wzbogaca dane pojazdu z zewnętrznych źródeł (Eurotax, Info-Ekspert).

**Response:**
```json
{
  "message": "Dane pojazdu zostały wzbogacone",
  "vehicle": {
    "id": "string",
    "eurotaxData": {},
    "infoEkspertData": {}
  }
}
```

---

## Kalkulacje (Calculations)

### POST /api/calculations

Tworzy nową kalkulację ubezpieczeniową. Wymaga feature flag `INSURANCE_AGENTS` i aktywnego agenta ubezpieczeniowego.

**Request Body:**
```json
{
  "pesel": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "previousLastName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional, email format)",
  "postalCode": "string (optional)",
  "city": "string (optional)",
  "street": "string (optional)",
  "houseNumber": "string (optional)",
  "apartmentNumber": "string (optional)",
  "correspondenceAddress": "object (optional)",
  "hasDrivingLicense": "boolean (optional)",
  "drivingLicenseDate": "string (optional, ISO datetime)",
  "occupation": "string (optional)",
  "maritalStatus": "string (optional)",
  "hasChildUnder26": "boolean (optional)",
  "clientId": "string (optional, CUID)",
  "vehicleId": "string (optional, CUID)",
  "status": "DRAFT | SENT | ACCEPTED | REJECTED (optional, default: DRAFT)",
  "value": "number (optional)",
  "validUntil": "string (optional, ISO datetime)",
  "variant": "MINIMAL | OPTIMAL | MAXIMAL (optional)",
  "scopes": ["OC", "AC", "NNW", "ASS"] (optional, array)
}
```

**Response:** `201 Created`
```json
{
  "calculation": {
    "id": "string",
    "pesel": "string | null",
    "firstName": "string | null",
    "lastName": "string | null",
    "status": "DRAFT",
    "value": 1500.00,
    "variant": "OPTIMAL",
    "scopes": ["OC", "AC"],
    "clientId": "string | null",
    "vehicleId": "string | null",
    "agentId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/calculations

Pobiera listę kalkulacji z filtrowaniem.

**Query Parameters:**
- `clientId` (opcjonalne, CUID) - Filtr po kliencie
- `vehicleId` (opcjonalne, CUID) - Filtr po pojeździe
- `status` (opcjonalne) - Filtr po statusie (DRAFT, SENT, ACCEPTED, REJECTED)
- `page` (opcjonalne, default: 1) - Numer strony
- `limit` (opcjonalne, default: 20) - Liczba wyników

**Response:**
```json
{
  "calculations": [
    {
      "id": "string",
      "status": "DRAFT",
      "value": 1500.00,
      "client": {
        "id": "string",
        "firstName": "string",
        "lastName": "string"
      },
      "vehicle": {
        "id": "string",
        "registrationNumber": "string"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### GET /api/calculations/[id]

Pobiera szczegóły kalkulacji.

**Response:**
```json
{
  "calculation": {
    "id": "string",
    "pesel": "string | null",
    "firstName": "string | null",
    "lastName": "string | null",
    "status": "DRAFT",
    "value": 1500.00,
    "variant": "OPTIMAL",
    "scopes": ["OC", "AC"],
    "client": {...},
    "vehicle": {...},
    "agentId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/calculations/[id]

Aktualizuje kalkulację.

**Request Body:** (wszystkie pola opcjonalne, takie same jak POST)

### POST /api/calculations/[id]/status

Zmienia status kalkulacji.

**Request Body:**
```json
{
  "status": "SENT | ACCEPTED | REJECTED (required)"
}
```

**Response:**
```json
{
  "message": "Status kalkulacji został zaktualizowany",
  "calculation": {
    "id": "string",
    "status": "SENT"
  }
}
```

### POST /api/calculations/[id]/sync

Synchronizuje kalkulację z systemem zewnętrznym.

**Response:**
```json
{
  "message": "Kalkulacja została zsynchronizowana",
  "syncId": "string",
  "externalId": "string"
}
```

---

## Polisy (Policies)

### POST /api/policies

Tworzy nową polisę ubezpieczeniową. Wymaga feature flag `INSURANCE_AGENTS` i aktywnego agenta ubezpieczeniowego.

**Request Body:**
```json
{
  "policyNumber": "string (required, min 1 znak)",
  "issueDate": "string (required, ISO datetime)",
  "validFrom": "string (required, ISO datetime)",
  "validTo": "string (required, ISO datetime)",
  "status": "ACTIVE | EXPIRED | CANCELLED | RENEWED (optional, default: ACTIVE)",
  "calculationId": "string (optional, CUID)",
  "clientId": "string (optional, CUID)",
  "vehicleId": "string (optional, CUID)",
  "insuranceCompanyId": "string (required, CUID)",
  "agentId": "string (optional, CUID)",
  "externalId": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "policy": {
    "id": "string",
    "policyNumber": "POL-2025-001",
    "issueDate": "2025-01-19T00:00:00.000Z",
    "validFrom": "2025-01-20T00:00:00.000Z",
    "validTo": "2026-01-20T00:00:00.000Z",
    "status": "ACTIVE",
    "insuranceCompany": {
      "id": "string",
      "name": "string",
      "logoUrl": "string | null"
    },
    "client": {...},
    "vehicle": {...}
  }
}
```

### GET /api/policies

Pobiera listę polis z filtrowaniem.

**Query Parameters:**
- `clientId` (opcjonalne, CUID) - Filtr po kliencie
- `vehicleId` (opcjonalne, CUID) - Filtr po pojeździe
- `status` (opcjonalne) - Filtr po statusie (ACTIVE, EXPIRED, CANCELLED, RENEWED)
- `insuranceCompanyId` (opcjonalne, CUID) - Filtr po Towarzystwie Ubezpieczeniowym
- `page` (opcjonalne, default: 1) - Numer strony
- `limit` (opcjonalne, default: 20) - Liczba wyników

**Response:**
```json
{
  "policies": [
    {
      "id": "string",
      "policyNumber": "POL-2025-001",
      "status": "ACTIVE",
      "validTo": "2026-01-20T00:00:00.000Z",
      "insuranceCompany": {
        "name": "string"
      },
      "client": {...},
      "vehicle": {...}
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 20
}
```

### GET /api/policies/[id]

Pobiera szczegóły polisy.

**Response:**
```json
{
  "policy": {
    "id": "string",
    "policyNumber": "POL-2025-001",
    "issueDate": "2025-01-19T00:00:00.000Z",
    "validFrom": "2025-01-20T00:00:00.000Z",
    "validTo": "2026-01-20T00:00:00.000Z",
    "status": "ACTIVE",
    "insuranceCompany": {...},
    "client": {...},
    "vehicle": {...},
    "documents": [
      {
        "id": "string",
        "name": "string",
        "type": "string",
        "size": 1024,
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### PUT /api/policies/[id]

Aktualizuje polisę.

**Request Body:** (wszystkie pola opcjonalne, takie same jak POST)

### POST /api/policies/[id]/documents

Przesyła dokument polisy.

**Request:** FormData (multipart/form-data)
- `file` (required) - Plik dokumentu
- `name` (optional) - Nazwa dokumentu
- `type` (optional) - Typ dokumentu

**Response:** `201 Created`
```json
{
  "message": "Dokument został przesłany",
  "document": {
    "id": "string",
    "name": "string",
    "type": "string",
    "size": 1024,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/policies/[id]/documents/[docId]/download

Pobiera dokument polisy.

**Response:** Plik binarny z odpowiednimi nagłówkami Content-Type i Content-Disposition

---

## Walidacja danych (Validation)

### POST /api/validation/pesel

Waliduje numer PESEL.

**Request Body:**
```json
{
  "pesel": "string (required)"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Numer PESEL jest poprawny"
}
```

**Kody odpowiedzi:**
- `200` - Walidacja zakończona (valid: true/false)
- `400` - Błąd walidacji (brak pola pesel)

### POST /api/validation/vin

Waliduje numer VIN pojazdu.

**Request Body:**
```json
{
  "vin": "string (required, min 17 znaków)"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Numer VIN jest poprawny"
}
```

### POST /api/validation/registration-number

Waliduje numer rejestracyjny pojazdu.

**Request Body:**
```json
{
  "registrationNumber": "string (required)"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Numer rejestracyjny jest poprawny"
}
```

### POST /api/validation/postal-code

Waliduje kod pocztowy (format polski: XX-XXX).

**Request Body:**
```json
{
  "postalCode": "string (required)"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Kod pocztowy jest poprawny"
}
```

---

## Integracja zewnętrzna (External Integration)

### GET /api/external/sync/status

Pobiera status synchronizacji z systemem zewnętrznym.

**Query Parameters:**
- `entityType` (opcjonalne) - Typ encji (CALCULATION, POLICY, VEHICLE)
- `entityId` (opcjonalne, CUID) - ID encji
- `direction` (opcjonalne) - Kierunek synchronizacji (IN, OUT)

**Response:**
```json
{
  "syncs": [
    {
      "id": "string",
      "entityType": "CALCULATION",
      "entityId": "string",
      "direction": "OUT",
      "status": "SUCCESS",
      "externalId": "string",
      "syncedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/external/webhook

Webhook do odbierania danych z systemu zewnętrznego.

**Request Body:**
```json
{
  "event": "string (required, np. 'calculation.created', 'policy.updated')",
  "data": {
    ...
  },
  "signature": "string (optional, dla weryfikacji)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Webhook został przetworzony",
  "processed": true
}
```

---

## Audyt (Audit)

### GET /api/audit/calculations/[id]/history

Pobiera historię zmian kalkulacji.

**Response:**
```json
{
  "history": [
    {
      "id": "string",
      "calculationId": "string",
      "changedBy": "string",
      "field": "status",
      "oldValue": "DRAFT",
      "newValue": "SENT",
      "changedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/audit/policies/[id]/history

Pobiera historię zmian polisy.

**Response:** (podobny format jak dla kalkulacji)

### GET /api/audit/personal-data

Pobiera logi dostępu do danych osobowych (RODO).

**Query Parameters:**
- `clientId` (opcjonalne, CUID) - Filtr po kliencie
- `userId` (opcjonalne, CUID) - Filtr po użytkowniku
- `page` (opcjonalne, default: 1)
- `limit` (opcjonalne, default: 20)

**Response:**
```json
{
  "logs": [
    {
      "id": "string",
      "userId": "string",
      "clientId": "string",
      "action": "EXPORT_DATA | DELETE_DATA | VIEW_DATA",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "details": {}
    }
  ],
  "total": 100
}
```

### GET /api/audit/sync

Pobiera logi synchronizacji z systemem zewnętrznym.

**Query Parameters:**
- `entityType` (opcjonalne) - Typ encji
- `direction` (opcjonalne) - Kierunek (IN, OUT)
- `page` (opcjonalne, default: 1)
- `limit` (opcjonalne, default: 20)

**Response:**
```json
{
  "logs": [
    {
      "id": "string",
      "entityType": "CALCULATION",
      "entityId": "string",
      "direction": "OUT",
      "status": "SUCCESS",
      "error": "string | null",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50
}
```

---

## Konfiguracja organizacji (Organization Settings)

### GET /api/organizations/[id]/insurance-settings

Pobiera ustawienia ubezpieczeń dla organizacji.

**Response:**
```json
{
  "settings": {
    "id": "string",
    "organizationId": "string",
    "externalSystemUrl": "string | null",
    "externalSystemApiKey": "string | null",
    "enableBidirectionalSync": false,
    "validationLevel": "STRICT | RELAXED",
    "enableDataEncryption": false,
    "auditRetentionDays": 365,
    "cacheEnabled": true,
    "cacheTtl": 3600
  }
}
```

### PUT /api/organizations/[id]/insurance-settings

Aktualizuje ustawienia ubezpieczeń dla organizacji. (Tylko ADMIN)

**Request Body:**
```json
{
  "externalSystemUrl": "string (optional)",
  "externalSystemApiKey": "string (optional)",
  "enableBidirectionalSync": "boolean (optional)",
  "validationLevel": "STRICT | RELAXED (optional)",
  "enableDataEncryption": "boolean (optional)",
  "auditRetentionDays": "number (optional)",
  "cacheEnabled": "boolean (optional)",
  "cacheTtl": "number (optional)"
}
```

**Response:**
```json
{
  "message": "Ustawienia zostały zaktualizowane",
  "settings": {...}
}
```

---

## Bezpieczeństwo i RODO (Security & GDPR)

### GET /api/clients/[id]/export-data

Eksportuje dane osobowe klienta zgodnie z RODO.

**Response:**
```json
{
  "data": {
    "client": {...},
    "contacts": [...],
    "tasks": [...],
    "vehicles": [...],
    "calculations": [...],
    "policies": [...]
  },
  "exportedAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/clients/[id]/personal-data

Usuwa dane osobowe klienta zgodnie z RODO (prawo do bycia zapomnianym).

**Response:** `200 OK`
```json
{
  "message": "Dane osobowe zostały usunięte",
  "deletedAt": "2024-01-01T00:00:00.000Z"
}
```

**Uwaga:** Operacja jest nieodwracalna. Usuwa tylko dane osobowe, zachowuje strukturalne dane biznesowe.

### GET /api/clients/[id]/consents

Pobiera listę zgód klienta.

**Response:**
```json
{
  "consents": [
    {
      "id": "string",
      "clientId": "string",
      "type": "MARKETING | DATA_PROCESSING | COMMUNICATION",
      "granted": true,
      "grantedAt": "2024-01-01T00:00:00.000Z",
      "revokedAt": "2024-01-01T00:00:00.000Z | null"
    }
  ]
}
```

### POST /api/clients/[id]/consents

Dodaje zgodę klienta.

**Request Body:**
```json
{
  "type": "MARKETING | DATA_PROCESSING | COMMUNICATION (required)",
  "granted": "boolean (required)"
}
```

**Response:** `201 Created`

### DELETE /api/clients/[id]/consents/[consentId]

Odwołuje zgodę klienta.

**Response:** `200 OK`

---

## Wersjonowanie

Obecna wersja API: **v1** (domyślna)

W przyszłości można dodać wersjonowanie poprzez prefiks `/api/v1/...`

---

## Uwagi dotyczące feature flags

Niektóre endpointy wymagają włączonych feature flags:

- **Agenty ubezpieczeniowi:** Wymaga `INSURANCE_AGENTS` (plan PRO)
- **Walidacja danych:** Wymaga `INSURANCE_DATA_VALIDATION` (core feature - zawsze dostępne)
- **Bezpieczeństwo:** Wymaga `GDPR_COMPLIANCE`, `DATA_ENCRYPTION`, `AUDIT_LOGGING` (core features - zawsze dostępne)

**Core features** (zawsze dostępne niezależnie od planu):
- `GDPR_COMPLIANCE` - Zgodność z RODO
- `DATA_ENCRYPTION` - Szyfrowanie danych
- `INSURANCE_DATA_VALIDATION` - Walidacja danych ubezpieczeniowych
- `AUDIT_LOGGING` - Logowanie audytu

**PRO features** (wymagają planu PRO):
- `INSURANCE_AGENTS` - Moduł agentów ubezpieczeniowych
- `INSURANCE_SECURITY_ENHANCED` - Zaawansowane zabezpieczenia

---

## Kontakt

W przypadku pytań lub problemów z API, skontaktuj się z administratorem systemu.

