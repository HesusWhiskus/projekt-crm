# Przegląd konfiguracji bezpieczeństwa

**Data:** 2025-01-27  
**SECURITY-FIX: [CONFIG-22, CONFIG-25] Przegląd konfiguracji CORS i CSRF**
**Data: 2025-01-27**

## CORS (Cross-Origin Resource Sharing)

### Status: ✅ Poprawnie skonfigurowane

**Analiza:**
- Next.js domyślnie nie wymaga konfiguracji CORS dla samej aplikacji (same-origin)
- API routes są dostępne tylko z tej samej domeny (same-origin policy)
- Brak potrzeby konfiguracji CORS dla aplikacji webowej

**Rekomendacje:**
- ✅ Jeśli w przyszłości będzie potrzeba API dla zewnętrznych aplikacji, użyj middleware CORS z konkretnymi originami
- ✅ NIE używaj `Access-Control-Allow-Origin: *` w produkcji
- ✅ Jeśli dodasz publiczne API, użyj whitelist konkretnych domen

**Przykład bezpiecznej konfiguracji CORS (jeśli będzie potrzebna):**
```typescript
// src/middleware.ts lub w API route
const allowedOrigins = [
  'https://twoja-domena.com',
  'https://app.twoja-domena.com',
]

const origin = request.headers.get('origin')
if (origin && allowedOrigins.includes(origin)) {
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
}
```

## CSRF (Cross-Site Request Forgery)

### Status: ✅ Poprawnie skonfigurowane

**Analiza:**
- NextAuth.js domyślnie ma wbudowaną ochronę CSRF
- CSRF tokens są automatycznie generowane i weryfikowane
- Cookies są konfigurowane z `sameSite: 'lax'` i `secure: true` w produkcji

**Konfiguracja cookies:**
- ✅ `httpOnly: true` - cookies nie są dostępne przez JavaScript
- ✅ `sameSite: 'lax'` - ochrona przed CSRF, ale pozwala na normalne linki
- ✅ `secure: true` w produkcji - cookies tylko przez HTTPS
- ✅ `__Secure-` prefix w produkcji - wymusza HTTPS
- ✅ `__Host-` prefix dla CSRF token - wymusza HTTPS i ścisłą domenę

**Dodatkowe zabezpieczenia:**
- ✅ Wszystkie formularze używają POST/PUT/DELETE (nie GET dla operacji zmieniających stan)
- ✅ API endpoints wymagają autoryzacji (NextAuth token)
- ✅ Rate limiting zapobiega automatycznym atakom

## Content Security Policy (CSP)

### Status: ✅ Skonfigurowane w next.config.js

**Obecna konfiguracja:**
- ✅ `default-src 'self'` - domyślnie tylko własna domena
- ✅ `script-src 'self' 'unsafe-eval' 'unsafe-inline'` - wymagane dla Next.js
- ✅ `style-src 'self' 'unsafe-inline'` - wymagane dla Tailwind CSS
- ✅ `img-src 'self' data: https: blob:` - obrazy z różnych źródeł
- ✅ `connect-src 'self' https://www.googleapis.com https://accounts.google.com` - Google API
- ✅ `frame-ancestors 'self'` - zapobiega clickjacking
- ✅ `base-uri 'self'` - zapobiega base tag injection
- ✅ `form-action 'self'` - formularze tylko do własnej domeny

## Security Headers

### Status: ✅ Skonfigurowane w next.config.js

**Obecne nagłówki:**
- ✅ `Strict-Transport-Security` - wymusza HTTPS (max-age=63072000, includeSubDomains, preload)
- ✅ `X-Frame-Options: SAMEORIGIN` - zapobiega clickjacking
- ✅ `X-Content-Type-Options: nosniff` - zapobiega MIME sniffing
- ✅ `X-XSS-Protection: 1; mode=block` - dodatkowa ochrona XSS (przestarzałe, ale nie szkodzi)
- ✅ `Referrer-Policy: origin-when-cross-origin` - kontroluje referrer
- ✅ `Permissions-Policy` - wyłącza niepotrzebne funkcje (camera, microphone, geolocation)

## Podsumowanie

✅ **CORS:** Poprawnie skonfigurowane (same-origin, brak potrzeby CORS)
✅ **CSRF:** Poprawnie skonfigurowane (NextAuth + secure cookies)
✅ **CSP:** Poprawnie skonfigurowane (next.config.js)
✅ **Security Headers:** Poprawnie skonfigurowane (next.config.js)

**Rekomendacje:**
- Monitorować logi pod kątem prób CSRF (NextAuth loguje nieudane próby)
- Regularnie aktualizować NextAuth.js dla najnowszych poprawek bezpieczeństwa
- Rozważyć dodanie `report-to` header dla CSP violation reporting (opcjonalnie)

