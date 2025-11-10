# Analiza optymalizacji czasu odpowiedzi

## Data analizy: 2025-11-10

## 🔴 Krytyczne problemy wydajnościowe

### 1. N+1 Query Problem w ListClientsUseCase

**Lokalizacja:** `src/application/clients/use-cases/ListClientsUseCase.ts:48-88`

**Problem:**
```typescript
// Główne zapytanie już ma include assignee i sharedGroups
const clients = await this.clientRepository.findMany(domainFilter, {
  include: {
    assignee: true,
    sharedGroups: true,
  },
})

// ALE potem dla każdego klienta wykonuje się 2 dodatkowe zapytania!
const clientsWithRelations = await Promise.all(
  clients.map(async (client) => {
    const [assignee, sharedGroups] = await Promise.all([
      db.user.findUnique({ ... }),  // ❌ N+1 query
      db.group.findMany({ ... }),   // ❌ N+1 query
    ])
  })
)
```

**Wpływ:** Dla 100 klientów = 1 główne zapytanie + 200 dodatkowych zapytań (2 × 100)

**Rozwiązanie:**
- Usunąć dodatkowe zapytania - dane są już w `include`
- Użyć danych z głównego zapytania bezpośrednio

**Szacowany zysk:** 50-90% redukcja czasu odpowiedzi dla listy klientów

---

### 2. Brak paginacji w endpointach listujących

**Lokalizacja:**
- `src/presentation/api/clients/route.ts` (GET)
- `src/app/api/tasks/route.ts` (GET)
- `src/app/api/contacts/route.ts` (GET)
- `src/app/(dashboard)/clients/page.tsx`
- `src/app/(dashboard)/tasks/page.tsx`
- `src/app/(dashboard)/contacts/page.tsx`

**Problem:**
- Wszystkie endpointy pobierają **wszystkie** rekordy bez limitu
- Brak parametrów `page`, `limit`, `skip`
- Dla dużych zbiorów danych (1000+ rekordów) powoduje:
  - Długie czasy odpowiedzi (2-10+ sekund)
  - Wysokie zużycie pamięci
  - Problemy z transferem danych

**Rozwiązanie:**
- Dodać paginację z domyślnym limitem (np. 50 rekordów)
- Parametry query: `?page=1&limit=50`
- Zwracać metadata: `{ data: [], total, page, limit, totalPages }`

**Szacowany zysk:** 70-95% redukcja czasu odpowiedzi dla dużych zbiorów

---

### 3. Brak indeksów w bazie danych

**Lokalizacja:** `prisma/schema.prisma`

**Problem:**
Brak indeksów na często używanych polach:
- `Client.assignedTo` - używane w każdym zapytaniu filtrującym
- `Client.status` - używane w filtrach
- `Client.lastContactAt` - używane w filtrach noContactDays
- `Client.nextFollowUpAt` - używane w filtrach followUpToday
- `Task.assignedTo` - używane w każdym zapytaniu
- `Task.status` - używane w filtrach
- `Task.dueDate` - używane w sortowaniu
- `Contact.clientId` - używane w relacjach
- `Contact.userId` - używane w filtrach
- `Contact.date` - używane w sortowaniu

**Wpływ:** 
- Pełne skanowanie tabeli zamiast użycia indeksu
- Dla 10,000 rekordów: 100-1000x wolniejsze zapytania

**Rozwiązanie:**
Dodać indeksy w schema.prisma:
```prisma
model Client {
  // ...
  @@index([assignedTo])
  @@index([status])
  @@index([lastContactAt])
  @@index([nextFollowUpAt])
  @@index([assignedTo, status]) // Composite index
}

model Task {
  // ...
  @@index([assignedTo])
  @@index([status])
  @@index([dueDate])
  @@index([assignedTo, status])
}

model Contact {
  // ...
  @@index([clientId])
  @@index([userId])
  @@index([date])
}
```

**Szacowany zysk:** 10-100x szybsze zapytania z filtrami

---

### 4. Nieoptymalne include w GetClientUseCase

**Lokalizacja:** `src/application/clients/use-cases/GetClientUseCase.ts:13-21`

**Problem:**
```typescript
const client = await this.clientRepository.findById(clientId, {
  include: {
    assignee: true,
    sharedGroups: true,
    contacts: true,        // ❌ Może być 100+ kontaktów
    tasks: true,           // ❌ Może być 50+ zadań
    statusHistory: true,   // ❌ Może być 100+ wpisów
  },
})
```

**Wpływ:**
- Pobieranie wszystkich powiązanych danych nawet jeśli nie są potrzebne
- Duże payloady JSON (100KB+)
- Długie czasy odpowiedzi (500ms-2s)

**Rozwiązanie:**
- Użyć opcjonalnych parametrów do kontroli include
- Domyślnie pobierać tylko podstawowe dane
- Dodać osobne endpointy dla szczegółów (np. `/api/clients/{id}/contacts`)

**Szacowany zysk:** 50-80% redukcja czasu odpowiedzi i rozmiaru payloadu

---

## 🟡 Średnie problemy wydajnościowe

### 5. Brak cache'owania getCurrentUser()

**Lokalizacja:** `src/lib/auth.ts:8-11`

**Problem:**
```typescript
export async function getCurrentUser() {
  const session = await getSession()  // ❌ Zapytanie do bazy przy każdym request
  return session?.user
}
```

**Wpływ:**
- `getCurrentUser()` wywoływane w każdym API route
- NextAuth wykonuje zapytanie do bazy dla każdego request
- Dla 100 requestów/sekundę = 100 zapytań do bazy tylko dla autoryzacji

**Rozwiązanie:**
- NextAuth używa JWT, więc sesja jest w tokenie (nie w bazie)
- Sprawdzić czy można użyć `getToken()` zamiast `getServerSession()`
- Rozważyć cache'owanie w Redis dla sesji (jeśli potrzebne)

**Szacowany zysk:** 10-30% redukcja zapytań do bazy

---

### 6. Duplikacja zapytań w page.tsx

**Lokalizacja:**
- `src/app/(dashboard)/clients/page.tsx:123-142`
- `src/app/(dashboard)/tasks/page.tsx:55-95`

**Problem:**
```typescript
// W każdym page.tsx są te same zapytania
const users = await db.user.findMany({ ... })  // ❌ Powtarza się
const groups = await db.group.findMany({ ... }) // ❌ Powtarza się
```

**Wpływ:**
- Te same dane pobierane wielokrotnie
- Można cache'ować (users i groups rzadko się zmieniają)

**Rozwiązanie:**
- Utworzyć shared data fetching w layout
- Użyć React Cache lub Next.js cache
- Rozważyć stale-while-revalidate dla danych rzadko zmieniających się

**Szacowany zysk:** 20-40% redukcja zapytań do bazy

---

### 7. Nieoptymalne zapytania z OR dla grup

**Lokalizacja:** Wszystkie endpointy z filtrowaniem po grupach

**Problem:**
```typescript
where.OR = [
  { assignedTo: user.id },
  { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
]
```

**Wpływ:**
- Złożone zapytania z zagnieżdżonymi relacjami
- Trudne do optymalizacji przez bazę danych
- Może być wolne dla użytkowników w wielu grupach

**Rozwiązanie:**
- Rozważyć denormalizację: dodać pole `accessibleBy` (array user IDs)
- Lub użyć materialized view z dostępnymi klientami/zadaniami
- Lub cache'ować listę dostępnych ID dla użytkownika

**Szacowany zysk:** 30-60% redukcja czasu zapytań z grupami

---

### 8. Brak select() w niektórych zapytaniach

**Lokalizacja:** Różne miejsca

**Problem:**
- Niektóre zapytania używają `include` zamiast `select`
- Pobierają wszystkie pola zamiast tylko potrzebnych

**Przykład:**
```typescript
// ❌ Pobiera wszystkie pola
include: {
  assignee: true,
}

// ✅ Powinno być
select: {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
}
```

**Rozwiązanie:**
- Zastąpić `include: true` przez `select` z konkretnymi polami
- Zwłaszcza w listach (nie potrzebujemy wszystkich pól)

**Szacowany zysk:** 20-40% redukcja rozmiaru payloadu

---

## 🟢 Drobne optymalizacje

### 9. Brak connection pooling configuration

**Problem:**
- Brak jawnej konfiguracji connection pool dla Prisma
- Domyślne ustawienia mogą nie być optymalne

**Rozwiązanie:**
Dodać do `DATABASE_URL`:
```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

---

### 10. Brak kompresji odpowiedzi

**Problem:**
- Next.js domyślnie kompresuje, ale warto sprawdzić konfigurację
- Duże payloady JSON mogą być kompresowane

**Rozwiązanie:**
- Sprawdzić czy kompresja jest włączona w Next.js
- Rozważyć kompresję na poziomie reverse proxy (Nginx)

---

## 📊 Priorytetyzacja optymalizacji

### Priorytet 1 (Krytyczne - natychmiastowa implementacja):
1. ✅ **N+1 queries w ListClientsUseCase** - największy wpływ
2. ✅ **Brak paginacji** - konieczne dla skalowalności
3. ✅ **Brak indeksów** - łatwe do dodania, duży zysk

### Priorytet 2 (Wysokie - w ciągu tygodnia):
4. ✅ **Nieoptymalne include w GetClientUseCase**
5. ✅ **Brak cache'owania getCurrentUser()**
6. ✅ **Duplikacja zapytań w page.tsx**

### Priorytet 3 (Średnie - w ciągu miesiąca):
7. ✅ **Nieoptymalne zapytania z OR dla grup**
8. ✅ **Brak select() w niektórych zapytaniach**

### Priorytet 4 (Niskie - gdy będzie czas):
9. ✅ **Connection pooling**
10. ✅ **Kompresja odpowiedzi**

---

## 📈 Szacowany wpływ optymalizacji

### Przed optymalizacją (obecny stan):
- Lista klientów (100 rekordów): ~500-1000ms
- Lista zadań (50 rekordów): ~300-600ms
- Szczegóły klienta: ~200-500ms
- API z filtrami: ~400-800ms

### Po optymalizacji (Priorytet 1):
- Lista klientów (100 rekordów): ~50-150ms (5-10x szybciej)
- Lista zadań (50 rekordów): ~30-100ms (5-10x szybciej)
- Szczegóły klienta: ~100-200ms (2-3x szybciej)
- API z filtrami: ~50-150ms (5-10x szybciej)

### Po wszystkich optymalizacjach:
- Lista klientów: ~30-80ms (10-20x szybciej)
- Lista zadań: ~20-60ms (10-20x szybciej)
- Szczegóły klienta: ~50-100ms (4-5x szybciej)
- API z filtrami: ~30-80ms (10-20x szybciej)

---

## 🛠️ Plan implementacji

### Faza 1: Krytyczne optymalizacje (1-2 dni)
1. Naprawić N+1 queries w ListClientsUseCase
2. Dodać paginację do wszystkich endpointów listujących
3. Dodać indeksy do schema.prisma i uruchomić migrację

### Faza 2: Wysokie optymalizacje (2-3 dni)
4. Zoptymalizować include w GetClientUseCase
5. Zoptymalizować getCurrentUser() (sprawdzić JWT)
6. Dodać cache dla users i groups w page.tsx

### Faza 3: Średnie optymalizacje (3-5 dni)
7. Zoptymalizować zapytania z OR dla grup
8. Zastąpić include przez select gdzie możliwe

### Faza 4: Drobne optymalizacje (1 dzień)
9. Skonfigurować connection pooling
10. Sprawdzić kompresję odpowiedzi

---

## 📝 Uwagi

- Wszystkie optymalizacje powinny być przetestowane przed wdrożeniem
- Monitorować wydajność przed i po optymalizacjach
- Rozważyć dodanie APM (Application Performance Monitoring) do śledzenia wydajności
- Regularnie przeglądać logi wolnych zapytań (Prisma query logging)

