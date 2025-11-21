# Plan realizacji optymalizacji wydajnościowych

## Data utworzenia: 2025-11-10

## 📋 Spis treści

1. [Strategia wdrożenia](#strategia-wdrożenia)
2. [Faza 1: Krytyczne optymalizacje](#faza-1-krytyczne-optymalizacje)
3. [Faza 2: Wysokie optymalizacje](#faza-2-wysokie-optymalizacje)
4. [Faza 3: Średnie optymalizacje](#faza-3-średnie-optymalizacje)
5. [Faza 4: Drobne optymalizacje](#faza-4-drobne-optymalizacje)
6. [Plan testów](#plan-testów)
7. [Plan rollbacku](#plan-rollbacku)
8. [Harmonogram](#harmonogram)

---

## 🎯 Strategia wdrożenia

### Zasady ogólne

1. **Backward Compatibility**: Wszystkie zmiany API muszą być kompatybilne wstecz
2. **Feature Flags**: Użycie flag do stopniowego włączania nowych funkcji
3. **Incremental Deployment**: Wdrażanie krok po kroku z możliwością rollbacku
4. **Testing First**: Każda zmiana musi być przetestowana przed wdrożeniem
5. **Monitoring**: Monitorowanie wydajności przed i po każdej zmianie

### Strategia migracji

- **Dual Mode**: Nowe i stare API działają równolegle przez okres przejściowy
- **Versioning**: Opcjonalne versioning API dla większych zmian
- **Gradual Migration**: Migracja frontendu krok po kroku

---

## 🔴 Faza 1: Krytyczne optymalizacje (Priorytet 1)

### 1.1 Naprawa N+1 queries w ListClientsUseCase

#### Analiza wpływu

**Pliki do modyfikacji:**
- `src/application/clients/use-cases/ListClientsUseCase.ts`

**Wpływ na istniejący kod:**
- ✅ **Brak wpływu na API** - struktura odpowiedzi pozostaje taka sama
- ✅ **Brak wpływu na frontend** - dane zwracane w tym samym formacie
- ✅ **Tylko optymalizacja wewnętrzna** - nie zmienia interfejsu

**Konflikty:**
- ❌ Brak konfliktów - zmiana jest wewnętrzna

#### Plan implementacji

**Krok 1: Analiza obecnego kodu**
```typescript
// Obecny kod wykonuje dodatkowe zapytania mimo że dane są już w include
const clients = await this.clientRepository.findMany(domainFilter, {
  include: {
    assignee: true,      // ✅ Dane już są tutaj
    sharedGroups: true,  // ✅ Dane już są tutaj
  },
})

// ❌ NIE POTRZEBNE - dane już są w clients
const clientsWithRelations = await Promise.all(
  clients.map(async (client) => {
    const [assignee, sharedGroups] = await Promise.all([...])
  })
)
```

**Krok 2: Implementacja**
- Usunąć blok `clientsWithRelations` (linie 47-88)
- Użyć danych bezpośrednio z `clients` Entity
- Mapować Entity do DTO używając danych z `include`

**Krok 3: Testy**
- Unit testy dla ListClientsUseCase
- Integration testy dla endpointu GET /api/clients
- Sprawdzenie że dane są identyczne jak przed zmianą

**Szacowany czas:** 2-3 godziny

---

### 1.2 Dodanie paginacji do endpointów listujących

#### Analiza wpływu

**Pliki do modyfikacji:**
- `src/presentation/api/clients/route.ts` (GET)
- `src/app/api/tasks/route.ts` (GET)
- `src/app/api/contacts/route.ts` (GET)
- `src/application/clients/use-cases/ListClientsUseCase.ts`
- `src/infrastructure/persistence/prisma/PrismaClientRepository.ts`
- `src/components/clients/clients-list.tsx`
- `src/components/tasks/tasks-list.tsx`
- `src/components/contacts/contacts-list.tsx`
- `src/app/(dashboard)/clients/page.tsx`
- `src/app/(dashboard)/tasks/page.tsx`
- `src/app/(dashboard)/contacts/page.tsx`

**Wpływ na istniejący kod:**
- ⚠️ **Zmiana formatu odpowiedzi API** - wymaga aktualizacji frontendu
- ⚠️ **Zmiana w page.tsx** - Server Components wymagają zmian
- ⚠️ **Zmiana w komponentach list** - wymagają obsługi paginacji

**Konflikty:**
- ⚠️ **Format odpowiedzi API** - obecnie: `{ clients: [] }`, nowy: `{ clients: [], pagination: {...} }`
- ⚠️ **Frontend components** - nie obsługują paginacji

#### Rozwiązanie konfliktów

**Strategia: Backward Compatible Pagination**

1. **Dual Mode Response** (okres przejściowy):
```typescript
// Nowy format (z paginacją)
{
  clients: [...],
  pagination: {
    page: 1,
    limit: 50,
    total: 150,
    totalPages: 3,
    hasMore: true
  }
}

// Stary format (dla kompatybilności)
// Jeśli nie podano page/limit, zwracamy wszystkie rekordy jak dotychczas
```

2. **Feature Flag**:
```typescript
// .env
ENABLE_PAGINATION=true  // Domyślnie false dla bezpieczeństwa
```

3. **Gradual Migration**:
- Faza 1: API obsługuje paginację, ale domyślnie zwraca wszystkie rekordy (backward compatible)
- Faza 2: Frontend używa paginacji, ale API nadal wspiera stary format
- Faza 3: Usunięcie starego formatu (po pełnej migracji)

#### Plan implementacji

**Krok 1: Rozszerzenie DTO i Use Cases**

Utworzyć nowe typy:
```typescript
// src/application/shared/types/Pagination.ts
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
```

**Krok 2: Modyfikacja Use Cases**

```typescript
// ListClientsUseCase - rozszerzyć o paginację
async execute(
  filter: ClientFilterDTO, 
  user: UserContext,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ClientDTO>> {
  const limit = pagination?.limit || 50
  const page = pagination?.page || 1
  const skip = (page - 1) * limit

  // Zapytanie z limit i skip
  const [clients, total] = await Promise.all([
    this.clientRepository.findMany(domainFilter, {
      include: { assignee: true, sharedGroups: true },
      skip,
      take: limit,
    }),
    this.clientRepository.count(domainFilter),
  ])

  return {
    data: clients.map(...),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
}
```

**Krok 3: Modyfikacja API Routes**

```typescript
// src/presentation/api/clients/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Backward compatible - jeśli nie ma page/limit, zwracamy wszystkie
  const enablePagination = process.env.ENABLE_PAGINATION === 'true'
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
  
  const pagination = enablePagination && page && limit 
    ? { page, limit } 
    : undefined

  const result = await listClientsUseCase.execute(validatedParams, user, pagination)
  
  // Backward compatible response
  if (pagination) {
    return NextResponse.json(result) // { data: [], pagination: {...} }
  } else {
    return NextResponse.json({ clients: result.data }) // Stary format
  }
}
```

**Krok 4: Modyfikacja Frontend Components**

```typescript
// src/components/clients/clients-list.tsx
export function ClientsList({ 
  clients,  // Może być Client[] lub PaginatedResponse
  // ...
}: ClientsListProps) {
  // Obsługa obu formatów
  const clientsList = Array.isArray(clients) 
    ? clients 
    : clients.data
  
  const pagination = Array.isArray(clients) 
    ? undefined 
    : clients.pagination

  // Komponent paginacji
  return (
    <>
      {/* Lista klientów */}
      {clientsList.map(...)}
      
      {/* Paginacja (jeśli dostępna) */}
      {pagination && <PaginationControls {...pagination} />}
    </>
  )
}
```

**Krok 5: Utworzenie komponentu PaginationControls**

```typescript
// src/components/ui/pagination-controls.tsx
export function PaginationControls({ 
  page, 
  totalPages, 
  hasMore 
}: PaginationMeta) {
  // Implementacja kontrolek paginacji
}
```

**Krok 6: Modyfikacja Server Components (page.tsx)**

```typescript
// src/app/(dashboard)/clients/page.tsx
export default async function ClientsPage({ searchParams }) {
  // Jeśli paginacja włączona, użyj API z paginacją
  if (process.env.ENABLE_PAGINATION === 'true') {
    const page = parseInt(searchParams.page || '1')
    const limit = parseInt(searchParams.limit || '50')
    
    // Fetch z API z paginacją
    const response = await fetch(`/api/clients?page=${page}&limit=${limit}...`)
    const { data: clients, pagination } = await response.json()
    
    return <ClientsList clients={{ data: clients, pagination }} ... />
  } else {
    // Stary sposób - bezpośrednie zapytanie do bazy
    const clients = await db.client.findMany({...})
    return <ClientsList clients={clients} ... />
  }
}
```

**Szacowany czas:** 1-2 dni

---

### 1.3 Dodanie indeksów do bazy danych

#### Analiza wpływu

**Pliki do modyfikacji:**
- `prisma/schema.prisma`

**Wpływ na istniejący kod:**
- ✅ **Brak wpływu na kod aplikacji** - tylko zmiana struktury bazy
- ⚠️ **Migracja bazy danych** - wymaga uruchomienia migracji
- ⚠️ **Czas migracji** - dla dużych tabel może zająć czas (ale nie blokuje aplikacji)

**Konflikty:**
- ❌ Brak konfliktów - indeksy nie zmieniają interfejsu

#### Plan implementacji

**Krok 1: Dodanie indeksów do schema.prisma**

```prisma
model Client {
  // ... istniejące pola ...
  
  @@index([assignedTo])
  @@index([status])
  @@index([lastContactAt])
  @@index([nextFollowUpAt])
  @@index([assignedTo, status]) // Composite index dla częstych filtrów
  @@map("clients")
}

model Task {
  // ... istniejące pola ...
  
  @@index([assignedTo])
  @@index([status])
  @@index([dueDate])
  @@index([assignedTo, status])
  @@map("tasks")
}

model Contact {
  // ... istniejące pola ...
  
  @@index([clientId])
  @@index([userId])
  @@index([date])
  @@map("contacts")
}
```

**Krok 2: Utworzenie migracji**

```bash
npx prisma migrate dev --name add_performance_indexes
```

**Krok 3: Weryfikacja indeksów**

```sql
-- Sprawdzenie utworzonych indeksów
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('clients', 'tasks', 'contacts');
```

**Krok 4: Testy wydajności**

- Porównanie czasu zapytań przed i po dodaniu indeksów
- Testy z różnymi rozmiarami danych

**Szacowany czas:** 2-3 godziny (plus czas migracji w zależności od rozmiaru danych)

---

## 🟡 Faza 2: Wysokie optymalizacje (Priorytet 2)

### 2.1 Optymalizacja include w GetClientUseCase

#### Analiza wpływu

**Pliki do modyfikacji:**
- `src/application/clients/use-cases/GetClientUseCase.ts`
- `src/presentation/api/clients/[id]/route.ts`
- `src/app/(dashboard)/clients/[id]/page.tsx`

**Wpływ na istniejący kod:**
- ⚠️ **Zmiana struktury odpowiedzi** - może brakować niektórych danych
- ⚠️ **Frontend może wymagać zmian** - jeśli używa contacts/tasks/statusHistory

**Konflikty:**
- ⚠️ **Frontend oczekuje pełnych danych** - contacts, tasks, statusHistory

#### Rozwiązanie konfliktów

**Strategia: Opcjonalne include z query parameters**

```typescript
// API: GET /api/clients/{id}?include=contacts,tasks,statusHistory
// Domyślnie: tylko podstawowe dane
// Z parametrem: dodatkowe dane na żądanie
```

**Plan implementacji:**

**Krok 1: Rozszerzenie GetClientUseCase**

```typescript
interface GetClientOptions {
  include?: {
    contacts?: boolean
    tasks?: boolean
    statusHistory?: boolean
  }
}

async execute(
  clientId: string, 
  user: UserContext,
  options?: GetClientOptions
): Promise<ClientDTO> {
  const include: any = {
    assignee: true,
    sharedGroups: true,
  }
  
  if (options?.include?.contacts) include.contacts = true
  if (options?.include?.tasks) include.tasks = true
  if (options?.include?.statusHistory) include.statusHistory = true
  
  const client = await this.clientRepository.findById(clientId, { include })
  // ...
}
```

**Krok 2: Modyfikacja API Route**

```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const includeParam = searchParams.get('include')
  
  const include = includeParam 
    ? {
        contacts: includeParam.includes('contacts'),
        tasks: includeParam.includes('tasks'),
        statusHistory: includeParam.includes('statusHistory'),
      }
    : undefined
  
  const client = await getClientUseCase.execute(params.id, user, { include })
  // ...
}
```

**Krok 3: Modyfikacja Frontend**

```typescript
// src/app/(dashboard)/clients/[id]/page.tsx
// Jeśli potrzebne są wszystkie dane, użyj z parametrem
const client = await fetch(`/api/clients/${id}?include=contacts,tasks,statusHistory`)
```

**Szacowany czas:** 1 dzień

---

### 2.2 Optymalizacja getCurrentUser()

#### Analiza wpływu

**Pliki do modyfikacji:**
- `src/lib/auth.ts`

**Wpływ na istniejący kod:**
- ✅ **Brak wpływu** - tylko optymalizacja wewnętrzna

**Konflikty:**
- ❌ Brak konfliktów

#### Plan implementacji

**Krok 1: Sprawdzenie czy NextAuth używa JWT**

```typescript
// NextAuth z JWT strategy nie wymaga zapytań do bazy dla sesji
// Sprawdzić czy getServerSession wykonuje zapytania
```

**Krok 2: Optymalizacja (jeśli potrzebna)**

```typescript
// Jeśli NextAuth używa JWT, getToken() jest szybsze niż getServerSession()
import { getToken } from 'next-auth/jwt'

export async function getCurrentUser() {
  const token = await getToken({ req: request })
  // Token zawiera user data, nie potrzeba zapytania do bazy
  return token?.user
}
```

**Szacowany czas:** 2-3 godziny

---

### 2.3 Cache dla users i groups w page.tsx

#### Analiza wpływu

**Pliki do modyfikacji:**
- `src/app/(dashboard)/clients/page.tsx`
- `src/app/(dashboard)/tasks/page.tsx`
- `src/app/(dashboard)/contacts/page.tsx`

**Wpływ na istniejący kod:**
- ⚠️ **Cache może zwracać stare dane** - wymaga invalidation

**Konflikty:**
- ⚠️ **Stale data** - jeśli użytkownik/grupa zostanie zmieniony, cache może być nieaktualny

#### Rozwiązanie konfliktów

**Strategia: Stale-While-Revalidate**

```typescript
// Next.js 14+ ma wbudowany cache
import { unstable_cache } from 'next/cache'

const getCachedUsers = unstable_cache(
  async () => {
    return db.user.findMany({...})
  },
  ['users'],
  {
    revalidate: 300, // 5 minut
    tags: ['users'], // Tag do invalidation
  }
)
```

**Plan implementacji:**

**Krok 1: Utworzenie cached functions**

```typescript
// src/lib/cache.ts
export const getCachedUsers = unstable_cache(
  async () => db.user.findMany({...}),
  ['users'],
  { revalidate: 300, tags: ['users'] }
)

export const getCachedGroups = unstable_cache(
  async () => db.group.findMany({...}),
  ['groups'],
  { revalidate: 300, tags: ['groups'] }
)
```

**Krok 2: Invalidation przy zmianach**

```typescript
// W API routes które modyfikują users/groups
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  // ... modyfikacja ...
  revalidateTag('users') // Invalidate cache
}
```

**Szacowany czas:** 1 dzień

---

## 🟢 Faza 3: Średnie optymalizacje (Priorytet 3)

### 3.1 Optymalizacja zapytań z OR dla grup

**Szacowany czas:** 2-3 dni

### 3.2 Zastąpienie include przez select

**Szacowany czas:** 1-2 dni

---

## 🔵 Faza 4: Drobne optymalizacje (Priorytet 4)

### 4.1 Connection pooling

**Szacowany czas:** 1-2 godziny

### 4.2 Kompresja odpowiedzi

**Szacowany czas:** 1-2 godziny

---

## 🧪 Plan testów

### Testy jednostkowe
- [ ] ListClientsUseCase - testy bez N+1 queries
- [ ] Pagination - testy różnych scenariuszy
- [ ] GetClientUseCase - testy z różnymi opcjami include

### Testy integracyjne
- [ ] API endpoints - testy z paginacją i bez
- [ ] Backward compatibility - testy starego formatu
- [ ] Performance tests - porównanie przed/po

### Testy E2E
- [ ] Frontend flows - wszystkie ścieżki użytkownika
- [ ] Paginacja w UI - nawigacja między stronami
- [ ] Filtry z paginacją - kombinacje różnych filtrów

---

## 🔄 Plan rollbacku

### Rollback dla każdej fazy

**Faza 1:**
- N+1 queries: Git revert (zmiana wewnętrzna)
- Paginacja: Feature flag OFF (powrót do starego formatu)
- Indeksy: Nie można rollback (ale nie psują danych)

**Faza 2-4:**
- Feature flags dla każdej optymalizacji
- Git revert jeśli potrzeba
- Database rollback tylko dla migracji (indeksy można usunąć)

---

## 📅 Harmonogram

### Tydzień 1: Faza 1 (Krytyczne)
- **Dzień 1-2**: N+1 queries + Indeksy
- **Dzień 3-5**: Paginacja (backend + frontend)

### Tydzień 2: Faza 2 (Wysokie)
- **Dzień 1-2**: Optymalizacja GetClientUseCase
- **Dzień 3**: Optymalizacja getCurrentUser()
- **Dzień 4-5**: Cache dla users/groups

### Tydzień 3: Faza 3 (Średnie)
- **Dzień 1-3**: Optymalizacja zapytań z OR
- **Dzień 4-5**: Zastąpienie include przez select

### Tydzień 4: Faza 4 (Drobne) + Testy
- **Dzień 1**: Connection pooling + Kompresja
- **Dzień 2-5**: Testy, optymalizacja, dokumentacja

---

## ✅ Checklist wdrożenia

### Przed wdrożeniem
- [ ] Backup bazy danych
- [ ] Testy na środowisku deweloperskim
- [ ] Code review
- [ ] Dokumentacja zmian

### Podczas wdrożenia
- [ ] Feature flags ustawione na OFF
- [ ] Monitoring włączony
- [ ] Rollback plan gotowy

### Po wdrożeniu
- [ ] Weryfikacja wydajności
- [ ] Monitoring przez 24h
- [ ] Stopniowe włączanie feature flags
- [ ] Dokumentacja wyników

---

## 📊 Metryki sukcesu

### Przed optymalizacją (baseline)
- Lista klientów (100 rekordów): ~500-1000ms
- Lista zadań (50 rekordów): ~300-600ms
- Szczegóły klienta: ~200-500ms

### Po optymalizacji (cel)
- Lista klientów (100 rekordów): ~50-150ms (5-10x szybciej)
- Lista zadań (50 rekordów): ~30-100ms (5-10x szybciej)
- Szczegóły klienta: ~50-100ms (4-5x szybciej)

### Monitoring
- APM tools (np. Sentry, Datadog)
- Prisma query logging
- Next.js performance metrics
- Database query performance

