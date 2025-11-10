# Model ról i permissions

## 1. Definicja ról

System używa **4 podstawowych ról** z możliwością rozbudowy:

### 1.1 ADMIN

**Opis:** Pełny dostęp do systemu, zarządzanie użytkownikami i konfiguracją.

**Domyślne permissions:**
- `*:*` (wszystkie permissions)

### 1.2 MANAGER

**Opis:** Zarządzanie klientami, zadaniami i kontaktami w zespole. Może przypisywać zadania innym użytkownikom.

**Domyślne permissions:**
- `clients:read`
- `clients:write`
- `clients:delete`
- `contacts:read`
- `contacts:write`
- `contacts:delete`
- `tasks:read`
- `tasks:write`
- `tasks:delete`
- `tasks:assign`
- `users:read` (tylko użytkownicy w swoich grupach)
- `groups:read`
- `reports:read`

### 1.3 USER

**Opis:** Standardowy użytkownik z dostępem do własnych klientów, zadań i kontaktów.

**Domyślne permissions:**
- `clients:read` (tylko własne i udostępnione)
- `clients:write` (tylko własne)
- `contacts:read` (tylko własne i udostępnione)
- `contacts:write` (tylko własne)
- `tasks:read` (tylko własne i udostępnione)
- `tasks:write` (tylko własne)
- `profile:read`
- `profile:write`

### 1.4 VIEWER

**Opis:** Tylko do odczytu - może przeglądać dane, ale nie może ich modyfikować.

**Domyślne permissions:**
- `clients:read` (tylko udostępnione)
- `contacts:read` (tylko udostępnione)
- `tasks:read` (tylko udostępnione)
- `profile:read`

## 2. Lista permissions

### 2.1 Clients (Klienci)

- `clients:read` - Odczyt klientów
- `clients:write` - Tworzenie i edycja klientów
- `clients:delete` - Usuwanie klientów
- `clients:assign` - Przypisywanie klientów do użytkowników

### 2.2 Contacts (Kontakty)

- `contacts:read` - Odczyt kontaktów
- `contacts:write` - Tworzenie i edycja kontaktów
- `contacts:delete` - Usuwanie kontaktów

### 2.3 Tasks (Zadania)

- `tasks:read` - Odczyt zadań
- `tasks:write` - Tworzenie i edycja zadań
- `tasks:delete` - Usuwanie zadań
- `tasks:assign` - Przypisywanie zadań do użytkowników

### 2.4 Users (Użytkownicy)

- `users:read` - Odczyt użytkowników
- `users:write` - Tworzenie i edycja użytkowników
- `users:delete` - Usuwanie użytkowników
- `users:manage_roles` - Zarządzanie rolami użytkowników

### 2.5 Groups (Grupy)

- `groups:read` - Odczyt grup
- `groups:write` - Tworzenie i edycja grup
- `groups:delete` - Usuwanie grup
- `groups:manage_members` - Zarządzanie członkami grup

### 2.6 Profile (Profil)

- `profile:read` - Odczyt własnego profilu
- `profile:write` - Edycja własnego profilu

### 2.7 Reports (Raporty)

- `reports:read` - Odczyt raportów
- `reports:export` - Eksport raportów

### 2.8 Settings (Ustawienia)

- `settings:read` - Odczyt ustawień systemowych
- `settings:write` - Edycja ustawień systemowych

### 2.9 Calendar (Kalendarz)

- `calendar:read` - Odczyt kalendarza
- `calendar:sync` - Synchronizacja z Google Calendar

## 3. Diagram relacji

```
┌─────────────┐
│    User     │
│             │
│  - id       │
│  - email    │
│  - roleId   │──┐
└─────────────┘  │
                 │
                 │ 1:N
                 │
┌─────────────┐  │
│    Role     │◄─┘
│             │
│  - id       │
│  - name     │
│  - desc     │
└─────────────┘
      │
      │ N:M
      │
      ▼
┌─────────────┐      ┌──────────────┐
│  Permission │◄─────┤ RolePermission│
│             │      │              │
│  - id       │      │  - roleId    │
│  - name     │      │  - permId    │
│  - resource │      └──────────────┘
│  - action   │
└─────────────┘
      │
      │ N:M (override)
      │
      ▼
┌─────────────┐
│UserPermission│
│             │
│  - userId   │
│  - permId   │
└─────────────┘
```

## 4. Przykłady użycia

### 4.1 Sprawdzanie permissions w middleware

```typescript
import { requirePermission } from '@/presentation/api/middleware/auth'

export async function POST(request: Request) {
  const authResult = await requirePermission('clients:write')
  if ('response' in authResult) {
    return authResult.response
  }
  
  const { user } = authResult
  // User ma permission clients:write
}
```

### 4.2 Sprawdzanie permissions w komponencie

```typescript
import { usePermissions } from '@/hooks/use-permissions'

function ClientList() {
  const { hasPermission } = usePermissions()
  
  return (
    <div>
      {hasPermission('clients:write') && (
        <button>Dodaj klienta</button>
      )}
    </div>
  )
}
```

### 4.3 Przypisanie override permission

```typescript
// ADMIN przypisuje użytkownikowi dodatkowe permission
await db.userPermission.create({
  data: {
    userId: 'user-id',
    permissionId: 'clients:delete', // USER normalnie nie może usuwać
  }
})
```

## 5. Migracja z obecnego systemu

### 5.1 Mapowanie obecnych ról

- **ADMIN** → ADMIN (bez zmian)
- **USER** → USER (bez zmian)

### 5.2 Nowe role

- **MANAGER** → Nowa rola (dla przyszłej rozbudowy)
- **VIEWER** → Nowa rola (dla przyszłej rozbudowy)

### 5.3 Plan migracji

1. **Dodanie schema Prisma** (bez migracji bazy)
2. **Utworzenie danych seedowych** (role i permissions)
3. **Aktualizacja middleware** (obsługa permissions)
4. **Migracja istniejących użytkowników** (przypisanie ról)
5. **Testy** (weryfikacja permissions)

## 6. Rozbudowa w przyszłości

### 6.1 Dodatkowe role

- **SALES** - Specjalna rola dla sprzedawców
- **SUPPORT** - Rola dla wsparcia klienta
- **ANALYST** - Rola dla analityków (tylko odczyt + raporty)

### 6.2 Dodatkowe permissions

- `clients:export` - Eksport klientów
- `contacts:export` - Eksport kontaktów
- `tasks:export` - Eksport zadań
- `api:read` - Dostęp do API
- `api:write` - Zapisywanie przez API

### 6.3 Context-based permissions

- Permissions zależne od kontekstu (np. użytkownik może edytować tylko swoich klientów)
- Permissions zależne od czasu (np. użytkownik może edytować tylko w godzinach pracy)
- Permissions zależne od lokalizacji (np. użytkownik może edytować tylko klientów z określonego regionu)

