# Analiza integracji Auth0

## 1. Obecna architektura autoryzacji

### 1.1 System autoryzacji

Obecny system używa **NextAuth.js** do zarządzania autoryzacją i sesjami:

- **Providerzy:**
  - Credentials (email/password)
  - Google OAuth (z dodatkowymi scope'ami dla Google Calendar)
  
- **Strategia sesji:** JWT (JSON Web Tokens)
  - Max age: 4 godziny
  - Update age: 24 godziny
  
- **Role:** Prosty model z enum `UserRole` (ADMIN, USER)

### 1.2 Punkty integracji

#### 1.2.1 Middleware autoryzacji

**Plik:** `src/presentation/api/middleware/auth.ts`

- `requireAuth()` - wymaga zalogowanego użytkownika
- `requireRole(role)` - wymaga konkretnej roli

**Plik:** `src/middleware.ts`

- Next.js middleware do ochrony tras
- Sprawdza token JWT z NextAuth
- Przekierowuje nieautoryzowanych użytkowników

#### 1.2.2 Konfiguracja NextAuth

**Plik:** `src/lib/auth-config.ts`

- Definiuje providerów (Credentials, Google)
- Callbacki: `signIn`, `jwt`, `session`
- Zarządza tworzeniem/aktualizacją użytkowników OAuth
- Przechowuje tokeny OAuth dla Google Calendar

#### 1.2.3 Baza danych

**Plik:** `prisma/schema.prisma`

- Model `User` z polem `role: UserRole`
- Relacje z klientami, zadaniami, kontaktami
- Brak zewnętrznego ID dla Auth0

### 1.3 Tokeny i sesje

- **JWT tokens** przechowywane w cookies (NextAuth)
- **OAuth tokens** (Google) przechowywane w JWT tokenie
- **Sesje** zarządzane przez NextAuth (JWT strategy)

## 2. Analiza możliwości współistnienia Auth0 i NextAuth

### 2.1 Scenariusz współistnienia

**Auth0 dla API (Machine-to-Machine, Client Credentials):**
- API endpoints mogą przyjmować tokeny Auth0 (Access Tokens)
- Machine-to-Machine aplikacje używają Client Credentials flow
- Tokeny weryfikowane przez Auth0 Management API

**NextAuth dla aplikacji webowej:**
- Sesje użytkowników zarządzane przez NextAuth
- Możliwość użycia Auth0 jako providera w NextAuth
- Zachowanie obecnej funkcjonalności (Google OAuth, Credentials)

### 2.2 Architektura hybrydowa - propozycja

```
┌─────────────────────────────────────────────────────────────┐
│                    Aplikacja Webowa (Next.js)                │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │   NextAuth.js    │         │   Auth0 Provider│           │
│  │   (Sesje Web)    │◄────────┤   (Opcjonalnie) │           │
│  └──────────────────┘         └──────────────────┘           │
│         │                                                      │
│         │ JWT Session                                         │
│         ▼                                                      │
│  ┌──────────────────┐                                         │
│  │  API Middleware   │                                         │
│  │  (Dual Auth)     │                                         │
│  └──────────────────┘                                         │
└──────────┬────────────────────────────────────────────────────┘
           │
           │
┌──────────▼────────────────────────────────────────────────────┐
│                    API Endpoints                                │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │  NextAuth Token  │         │  Auth0 Token     │           │
│  │  (Cookie/Bearer) │         │  (Bearer)        │           │
│  └──────────────────┘         └──────────────────┘           │
│         │                                                      │
│         └──────────┬──────────────────────────┘               │
│                    │                                           │
│                    ▼                                           │
│         ┌──────────────────────┐                              │
│         │  Auth Middleware     │                              │
│         │  (Weryfikacja obu)   │                              │
│         └──────────────────────┘                              │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 Wyzwania i rozwiązania

#### 2.3.1 Zarządzanie dwoma źródłami prawdy

**Problem:**
- Auth0 przechowuje użytkowników w swojej bazie
- Lokalna baza danych również przechowuje użytkowników
- Synchronizacja danych między systemami

**Rozwiązanie:**
- **Synchronizacja przez webhook:** Auth0 wysyła webhook przy zmianach użytkownika
- **Scheduled job:** Okresowa synchronizacja (np. co godzinę)
- **Lokalna baza jako źródło prawdy:** Auth0 ID przechowywane w lokalnej bazie jako `auth0Id`

#### 2.3.2 Synchronizacja ról i permissions

**Problem:**
- Auth0 ma własny system ról i permissions
- Lokalna baza ma enum `UserRole` (ADMIN, USER)
- Trzeba zsynchronizować role między systemami

**Rozwiązanie:**
- **Mapowanie ról:** Auth0 Roles → lokalne Role
- **Synchronizacja przez webhook:** Auth0 wysyła webhook przy zmianie roli
- **Fallback:** Jeśli synchronizacja nie działa, używać lokalnej roli

#### 2.3.3 Migracja istniejących użytkowników

**Problem:**
- Istniejący użytkownicy mają konta w lokalnej bazie
- Trzeba utworzyć konta w Auth0 lub zsynchronizować

**Rozwiązanie:**
- **Opcja 1:** Import użytkowników do Auth0 (jednorazowa migracja)
- **Opcja 2:** Stopniowa migracja - nowi użytkownicy przez Auth0, istniejący pozostają w NextAuth
- **Opcja 3:** Użycie Auth0 tylko dla API, NextAuth dla web (bez migracji użytkowników)

#### 2.3.4 Obsługa SSO i federacji

**Problem:**
- Auth0 obsługuje SSO i federację (SAML, OIDC)
- NextAuth również obsługuje OAuth, ale w ograniczonym zakresie

**Rozwiązanie:**
- **Auth0 jako Identity Provider:** Wszystkie logowania przez Auth0
- **NextAuth jako wrapper:** NextAuth używa Auth0 jako providera
- **Korzyści:** Centralne zarządzanie użytkownikami, SSO, MFA

### 2.4 Propozycja implementacji

#### 2.4.1 Faza 1: Współistnienie (Coexistence)

**Cel:** Auth0 dla API, NextAuth dla web

**Zmiany:**
1. Dodanie middleware do weryfikacji tokenów Auth0
2. Rozszerzenie `requireAuth()` o obsługę tokenów Auth0
3. Synchronizacja użytkowników (webhook lub scheduled job)
4. Mapowanie ról Auth0 → lokalne Role

**Pliki do modyfikacji:**
- `src/presentation/api/middleware/auth.ts` - dodanie weryfikacji Auth0
- `src/lib/auth-config.ts` - opcjonalnie dodanie Auth0 jako providera
- `prisma/schema.prisma` - dodanie pola `auth0Id` do modelu User
- Nowy plik: `src/lib/auth0-verifier.ts` - weryfikacja tokenów Auth0

#### 2.4.2 Faza 2: Pełna integracja (opcjonalnie)

**Cel:** Auth0 jako główny Identity Provider

**Zmiany:**
1. Migracja wszystkich użytkowników do Auth0
2. NextAuth używa Auth0 jako jedynego providera
3. Usunięcie Credentials providera (lub pozostawienie jako fallback)
4. Centralne zarządzanie użytkownikami w Auth0

## 3. Wymagania i zależności

### 3.1 Wymagania Auth0

- **Konto Auth0:** Tenant Auth0 (darmowy plan dostępny)
- **Aplikacja Auth0:** Machine-to-Machine aplikacja dla API
- **Aplikacja Auth0:** Single Page Application dla web (opcjonalnie)
- **API w Auth0:** Zdefiniowane API z odpowiednimi scope'ami

### 3.2 Zależności npm

```json
{
  "dependencies": {
    "auth0": "^3.0.0",
    "jwks-rsa": "^3.0.0"
  }
}
```

### 3.3 Zmienne środowiskowe

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-identifier

# Auth0 Management API (dla synchronizacji)
AUTH0_MANAGEMENT_CLIENT_ID=your-management-client-id
AUTH0_MANAGEMENT_CLIENT_SECRET=your-management-client-secret
```

## 4. Plan migracji (jeśli będzie wdrożone)

### 4.1 Przygotowanie

1. **Utworzenie konta Auth0:**
   - Założenie konta Auth0
   - Konfiguracja tenant'a
   - Utworzenie aplikacji (M2M i SPA)

2. **Konfiguracja API w Auth0:**
   - Utworzenie API z identifier
   - Definicja scope'ów (np. `read:clients`, `write:clients`)
   - Konfiguracja permissions

3. **Konfiguracja ról w Auth0:**
   - Utworzenie ról: ADMIN, MANAGER, USER, VIEWER
   - Przypisanie permissions do ról
   - Mapowanie ról Auth0 → lokalne Role

### 4.2 Implementacja

1. **Dodanie weryfikacji Auth0:**
   - Implementacja `auth0-verifier.ts`
   - Rozszerzenie middleware autoryzacji
   - Testy weryfikacji tokenów

2. **Synchronizacja użytkowników:**
   - Implementacja webhook handlera
   - Implementacja scheduled job (opcjonalnie)
   - Testy synchronizacji

3. **Migracja danych:**
   - Skrypt migracji użytkowników (jeśli potrzebny)
   - Weryfikacja danych po migracji

### 4.3 Wdrożenie

1. **Faza testowa:**
   - Testy w środowisku deweloperskim
   - Testy integracyjne z Auth0
   - Testy wydajnościowe

2. **Faza produkcyjna:**
   - Wdrożenie w środowisku produkcyjnym
   - Monitoring synchronizacji
   - Rollback plan (jeśli potrzebny)

## 5. Estymacja wysiłku

### 5.1 Faza 1: Współistnienie

- **Implementacja weryfikacji Auth0:** 2-3 dni
- **Rozszerzenie middleware:** 1 dzień
- **Synchronizacja użytkowników:** 2-3 dni
- **Testy:** 2 dni
- **Razem:** ~8-10 dni roboczych

### 5.2 Faza 2: Pełna integracja (opcjonalnie)

- **Migracja użytkowników:** 2-3 dni
- **Refaktoryzacja NextAuth:** 2-3 dni
- **Testy:** 2 dni
- **Razem:** ~6-8 dni roboczych

## 6. Zalety i wady

### 6.1 Zalety

✅ **Centralne zarządzanie użytkownikami:** Wszystkie konta w jednym miejscu  
✅ **SSO i federacja:** Obsługa SAML, OIDC, social logins  
✅ **MFA:** Multi-factor authentication out of the box  
✅ **Audit logs:** Auth0 przechowuje logi autoryzacji  
✅ **Skalowalność:** Auth0 obsługuje dużą liczbę użytkowników  
✅ **API Authorization:** Machine-to-Machine flow dla API  

### 6.2 Wady

❌ **Koszt:** Auth0 płatne dla większej liczby użytkowników  
❌ **Złożoność:** Dodatkowa warstwa abstrakcji  
❌ **Zależność zewnętrzna:** Zależność od serwisu Auth0  
❌ **Synchronizacja:** Trzeba synchronizować dane między systemami  
❌ **Migracja:** Trzeba zmigrować istniejących użytkowników  

## 7. Rekomendacja

### 7.1 Dla obecnego stanu projektu

**Rekomendacja:** **NIE wdrażać Auth0 na tym etapie**

**Uzasadnienie:**
- Obecny system NextAuth działa dobrze dla potrzeb aplikacji
- Prosty model ról (ADMIN, USER) jest wystarczający
- Brak potrzeby SSO lub federacji w obecnej fazie
- Koszt i złożoność nie są uzasadnione

### 7.2 Kiedy rozważyć Auth0

**Rozważyć Auth0 gdy:**
- Potrzeba SSO lub federacji z innymi systemami
- Potrzeba MFA (Multi-Factor Authentication)
- Potrzeba Machine-to-Machine autoryzacji dla API
- Wzrost liczby użytkowników wymaga centralnego zarządzania
- Potrzeba bardziej zaawansowanego modelu ról i permissions

### 7.3 Alternatywa: Rozbudowa obecnego systemu

Zamiast Auth0, można rozbudować obecny system:
- Dodać bardziej zaawansowany model ról i permissions (patrz `ROLES_PERMISSIONS_MODEL.md`)
- Dodać MFA przez NextAuth (możliwe z dodatkowymi providerami)
- Dodać API keys dla Machine-to-Machine autoryzacji

## 8. Podsumowanie

Analiza pokazuje, że **współistnienie Auth0 i NextAuth jest możliwe**, ale **nie jest konieczne** na obecnym etapie projektu. 

**Rekomendacja:** Skupić się na rozbudowie modelu ról i permissions w obecnym systemie, a Auth0 rozważyć w przyszłości, gdy pojawią się konkretne potrzeby (SSO, MFA, federacja).

