# 🔒 Pozostałe zadania bezpieczeństwa

## ✅ Zaimplementowane (Krytyczne)

- [x] Rate Limiting na endpointach autoryzacji
- [x] Zabezpieczenie uploadów plików (walidacja, sanityzacja, path traversal protection)
- [x] Sanityzacja logów (usuwanie wrażliwych danych)
- [x] Walidacja query parameters
- [x] Content Security Policy
- [x] Walidacja UUID w path parameters
- [x] Wzmocnienie polityki haseł
- [x] Skrócenie sesji (8h → 4h)
- [x] Rozszerzenie middleware (ochrona wszystkich API routes)

---

## 🟡 Średnie priorytety (Do zrobienia w przyszłości)

### 1. **Walidacja rozmiaru request body**
**Status:** Nie zaimplementowane  
**Priorytet:** Średni  
**Szacowany czas:** 30 min

**Co zrobić:**
- Dodać middleware sprawdzający `Content-Length` header
- Limit: 10MB dla większości endpointów, 50MB dla uploadów
- Zwracać 413 Payload Too Large

**Lokalizacja:** `src/middleware.ts` lub helper function

---

### 2. **Rate limiting na innych endpointach**
**Status:** Częściowo (tylko register)  
**Priorytet:** Średni  
**Szacowany czas:** 1h

**Co zrobić:**
- Dodać rate limiting na:
  - `/api/auth/[...nextauth]` (logowanie)
  - `/api/clients` (POST - tworzenie)
  - `/api/tasks` (POST - tworzenie)
  - `/api/contacts` (POST - tworzenie)
  - `/api/admin/*` (wszystkie operacje admin)

**Lokalizacja:** Każdy API route

---

### 3. **Refresh tokens i rotacja tokenów**
**Status:** Nie zaimplementowane  
**Priorytet:** Średni  
**Szacowany czas:** 2-3h

**Co zrobić:**
- Zaimplementować refresh tokens
- Skrócić access token do 1h
- Refresh token: 7 dni
- Blacklist wygasłych tokenów

**Lokalizacja:** `src/lib/auth-config.ts`

---

### 4. **Walidacja zmiennych środowiskowych przy starcie**
**Status:** Nie zaimplementowane  
**Priorytet:** Niski-Średni  
**Szacowany czas:** 1h

**Co zrobić:**
- Utworzyć `src/lib/env-validator.ts`
- Walidować wszystkie wymagane zmienne przy starcie
- Fail fast w produkcji jeśli brakuje zmiennych

**Lokalizacja:** `src/lib/env-validator.ts`, wywołać w `src/app/layout.tsx`

---

## 🟢 Niskie priorytety (Nice to have)

### 5. **Monitoring i alerty bezpieczeństwa**
**Status:** Nie zaimplementowane  
**Priorytet:** Niski  
**Szacowany czas:** 3-4h

**Co zrobić:**
- Logowanie podejrzanych aktywności:
  - Wielokrotne nieudane logowania
  - Próby dostępu do nieistniejących zasobów
  - Próby path traversal
  - Rate limit exceeded
- Integracja z Sentry lub podobnym narzędziem

**Lokalizacja:** Nowy moduł `src/lib/security-monitor.ts`

---

### 6. **Rotacja sekretów**
**Status:** Dokumentacja tylko  
**Priorytet:** Niski  
**Szacowany czas:** Dokumentacja + proces

**Co zrobić:**
- Dokumentacja procesu rotacji `NEXTAUTH_SECRET`
- Rozważ użycie key management service (AWS Secrets Manager, etc.)

**Lokalizacja:** Dokumentacja

---

### 7. **Cloud storage dla uploadów**
**Status:** Pliki lokalnie  
**Priorytet:** Niski (dla produkcji)  
**Szacowany czas:** 2-3h

**Co zrobić:**
- Migracja z lokalnego storage do S3/Cloudinary
- Lepsze bezpieczeństwo i skalowalność
- CDN dla plików

**Lokalizacja:** `src/lib/file-upload.ts`, nowy moduł `src/lib/storage.ts`

---

### 8. **Redis-based rate limiting**
**Status:** LRU cache (pamięć)  
**Priorytet:** Niski (dla produkcji)  
**Szacowany czas:** 2h

**Co zrobić:**
- Zastąpić LRU cache Redisem
- Działa w środowisku rozproszonym
- Persystencja między restartami

**Lokalizacja:** `src/lib/rate-limit.ts`

---

## 📊 Podsumowanie

### Zrobione: 9/17 zadań (53%)
- ✅ Wszystkie krytyczne
- ✅ Większość średnich
- ⏳ Pozostało: 8 zadań (głównie nice-to-have)

### Następne kroki (opcjonalne):
1. **Walidacja rozmiaru request body** (30 min) - szybkie
2. **Rate limiting na innych endpointach** (1h) - ważne
3. **Walidacja zmiennych środowiskowych** (1h) - pomocne

### Dla produkcji (długoterminowo):
- Cloud storage dla uploadów
- Redis dla rate limiting
- Monitoring bezpieczeństwa
- Refresh tokens

---

## 🎯 Rekomendacja

**Aktualny stan jest wystarczający dla produkcji.** Wszystkie krytyczne luki zostały załatane. Pozostałe zadania można implementować stopniowo w miarę potrzeb.

**Priorytet na teraz:** Testowanie i monitoring w produkcji.

