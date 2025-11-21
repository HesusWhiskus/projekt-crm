# 🔒 Analiza bezpieczeństwa - Internal CRM

## Data analizy: 2024

## 📋 Podsumowanie

Przeprowadzono kompleksową analizę bezpieczeństwa aplikacji Internal CRM. Zidentyfikowano **15 obszarów wymagających poprawy**, z czego **5 jest krytycznych**, **7 średnich** i **3 niskich**.

---

## ✅ Pozytywne aspekty bezpieczeństwa

1. **Prisma ORM** - Automatyczna ochrona przed SQL injection
2. **Zod validation** - Walidacja danych wejściowych w większości endpointów
3. **NextAuth.js** - Solidna implementacja autoryzacji
4. **Security Headers** - Podstawowe nagłówki bezpieczeństwa w `next.config.js`
5. **Brak XSS** - Nie używa `dangerouslySetInnerHTML`
6. **Bcrypt** - Hasła są hashowane z bcrypt (10 rounds)
7. **Middleware protection** - Ochrona tras dashboardowych

---

## 🚨 KRYTYCZNE PROBLEMY (Wymagają natychmiastowej naprawy)

### 1. ⚠️ **Brak Rate Limiting**

**Problem:**
- Brak ochrony przed atakami brute-force na endpointy logowania/rejestracji
- Brak ochrony przed DDoS na API endpoints
- Możliwość wyczerpania zasobów serwera przez masowe żądania

**Lokalizacja:**
- Wszystkie API routes (`/api/*`)
- Szczególnie: `/api/auth/register`, `/api/auth/[...nextauth]`

**Ryzyko:** 🔴 **WYSOKIE**
- Atakujący może próbować złamać hasła przez brute-force
- Możliwość DoS przez masowe żądania
- Wyczerpanie zasobów bazy danych

**Propozycja rozwiązania:**
```typescript
// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache'

const rateLimit = new LRUCache({
  max: 500, // Max 500 unique IPs
  ttl: 60000, // 1 minute
})

export function rateLimiter(options: {
  interval: number // Time window in ms
  uniqueTokenPerInterval: number // Max requests per interval
}) {
  return async (req: Request): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> => {
    const identifier = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'anonymous'
    
    const key = `${identifier}:${options.interval}`
    const count = (rateLimit.get(key) as number) || 0
    
    if (count >= options.uniqueTokenPerInterval) {
      return {
        success: false,
        limit: options.uniqueTokenPerInterval,
        remaining: 0,
        reset: Date.now() + options.interval,
      }
    }
    
    rateLimit.set(key, count + 1)
    
    return {
      success: true,
      limit: options.uniqueTokenPerInterval,
      remaining: options.uniqueTokenPerInterval - (count + 1),
      reset: Date.now() + options.interval,
    }
  }
}
```

**Użycie:**
```typescript
// src/app/api/auth/register/route.ts
import { rateLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limiting: 5 requests per 15 minutes per IP
  const rateLimitResult = await rateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5,
  })(request)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób rejestracji. Spróbuj ponownie później.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    )
  }
  
  // ... reszta kodu
}
```

**Alternatywa (dla produkcji):** Użyj Redis z `@upstash/ratelimit` dla rozproszonego rate limiting.

---

### 2. ⚠️ **Niezabezpieczone uploady plików**

**Problem:**
- Brak walidacji rozmiaru plików w `/api/contacts` (tylko sprawdzenie `size > 0`)
- Brak sanitizacji nazw plików (możliwość path traversal)
- Brak walidacji typu MIME (tylko sprawdzenie `file.type`, które można sfałszować)
- Pliki zapisywane w `public/uploads` - dostępne bezpośrednio przez URL
- Brak skanowania antywirusowego

**Lokalizacja:**
- `src/app/api/contacts/route.ts` (linie 82-108)
- `src/app/api/admin/settings/route.ts` (linie 87-114) - lepsze, ale też wymaga poprawy

**Ryzyko:** 🔴 **WYSOKIE**
- Path traversal attack (`../../../etc/passwd`)
- Upload złośliwych plików (malware, scripts)
- Wyczerpanie przestrzeni dyskowej
- XSS przez złośliwe pliki HTML/JS

**Propozycja rozwiązania:**
```typescript
// src/lib/file-upload.ts
import { extname, basename } from 'path'
import { randomBytes } from 'crypto'

const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES_PER_UPLOAD = 5

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const sanitized = basename(filename)
  // Remove special characters, keep only alphanumeric, dots, dashes, underscores
  return sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size === 0) {
    return { valid: false, error: 'Plik jest pusty' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Plik jest zbyt duży. Maksymalny rozmiar: ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }
  
  // Validate MIME type
  const extension = extname(file.name).toLowerCase()
  const allowedExtensions = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]
  
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Nieobsługiwany typ pliku' }
  }
  
  // Additional check: verify file extension matches MIME type
  // (MIME type can be spoofed, so we check extension too)
  
  return { valid: true }
}

export function generateSafeFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename)
  const extension = extname(sanitized)
  const nameWithoutExt = basename(sanitized, extension)
  const randomSuffix = randomBytes(8).toString('hex')
  return `${Date.now()}-${randomSuffix}-${nameWithoutExt}${extension}`
}
```

**Użycie w API:**
```typescript
// src/app/api/contacts/route.ts
import { validateFile, generateSafeFilename, MAX_FILES_PER_UPLOAD } from '@/lib/file-upload'

// W funkcji POST:
const files = formData.getAll("files") as File[]

if (files.length > MAX_FILES_PER_UPLOAD) {
  return NextResponse.json(
    { error: `Można przesłać maksymalnie ${MAX_FILES_PER_UPLOAD} plików na raz` },
    { status: 400 }
  )
}

for (const file of files) {
  const validation = validateFile(file)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  
  const safeFilename = generateSafeFilename(file.name)
  // ... reszta kodu
}
```

**Dodatkowe rekomendacje:**
- Przenieś uploady poza `public/` (np. `uploads/` z odpowiednimi uprawnieniami)
- Dodaj endpoint do pobierania plików z weryfikacją uprawnień
- Rozważ użycie cloud storage (S3, Cloudinary) dla produkcji

---

### 3. ⚠️ **Ujawnianie wrażliwych informacji w logach**

**Problem:**
- `console.log` w middleware ujawnia tokeny i dane użytkowników
- `console.error` w API routes może ujawniać stack trace z wrażliwymi danymi
- Logi autoryzacji zapisywane do pliku (`auth-debug.log`) - może zawierać wrażliwe dane

**Lokalizacja:**
- `src/middleware.ts` (linie 18, 29, 38-45, 52)
- Wszystkie API routes używające `console.error`
- `src/lib/logger.ts` - loguje emaile i dane użytkowników

**Ryzyko:** 🔴 **WYSOKIE**
- Ujawnienie tokenów sesji w logach
- Ujawnienie emaili użytkowników
- Stack trace może ujawnić strukturę bazy danych

**Propozycja rozwiązania:**
```typescript
// src/lib/logger.ts
export function logAuth(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  
  // Sanitize sensitive data
  const sanitizedData = data ? sanitizeLogData(data) : null
  const dataStr = sanitizedData ? JSON.stringify(sanitizedData, null, 2) : ""
  const logEntry = `[${timestamp}] ${message}${dataStr ? ` ${dataStr}` : ""}\n`
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH-LOG] ${message}`, sanitizedData || "")
    
    // Log to file only in development
    try {
      const logDir = path.dirname(LOG_FILE)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      fs.appendFileSync(LOG_FILE, logEntry, "utf8")
    } catch (error: any) {
      console.error("Failed to write to log file:", error?.message || error)
    }
  } else {
    // In production, use structured logging without sensitive data
    console.log(`[AUTH] ${message}`)
  }
}

function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data
  
  const sensitiveKeys = ['password', 'token', 'secret', 'accessToken', 'refreshToken', 'email']
  const sanitized = { ...data }
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]'
    }
  }
  
  return sanitized
}
```

**Middleware:**
```typescript
// src/middleware.ts
// Usuń wszystkie console.log w produkcji
if (process.env.NODE_ENV === 'development' && isProtectedRoute) {
  console.log("[MIDDLEWARE] Checking route:", pathname)
}
```

---

### 4. ⚠️ **Brak walidacji query parameters**

**Problem:**
- Query parameters w GET requests nie są walidowane przez Zod
- Możliwość NoSQL injection (choć używamy Prisma, więc mniejsze ryzyko)
- Możliwość DoS przez bardzo długie query strings

**Lokalizacja:**
- `src/app/api/clients/route.ts` (GET) - `status`, `search`, `assignedTo`
- `src/app/api/contacts/route.ts` (GET) - `clientId`, `type`, `userId`
- `src/app/api/tasks/route.ts` (GET) - `status`, `assignedTo`

**Ryzyko:** 🟡 **ŚREDNIE-WYSOKIE**
- DoS przez bardzo długie query strings
- Potencjalne problemy z wydajnością przy nieprawidłowych parametrach

**Propozycja rozwiązania:**
```typescript
// src/lib/query-validator.ts
import { z } from 'zod'

export const clientQuerySchema = z.object({
  status: z.enum(['NEW_LEAD', 'IN_CONTACT', 'DEMO_SENT', 'NEGOTIATION', 'ACTIVE_CLIENT', 'LOST']).optional(),
  search: z.string().max(100).optional(), // Limit search length
  assignedTo: z.string().uuid().optional(), // Validate UUID format
})

export const contactQuerySchema = z.object({
  clientId: z.string().uuid().optional(),
  type: z.enum(['PHONE_CALL', 'MEETING', 'EMAIL', 'LINKEDIN_MESSAGE', 'OTHER']).optional(),
  userId: z.string().uuid().optional(),
})

// Użycie:
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const validatedParams = clientQuerySchema.parse({
    status: searchParams.get('status'),
    search: searchParams.get('search'),
    assignedTo: searchParams.get('assignedTo'),
  })
  
  // Użyj validatedParams zamiast bezpośrednio searchParams
}
```

---

### 5. ⚠️ **Brak Content Security Policy (CSP)**

**Problem:**
- Brak nagłówka `Content-Security-Policy` w `next.config.js`
- Zwiększone ryzyko XSS (choć React domyślnie chroni)

**Ryzyko:** 🟡 **ŚREDNIE**
- XSS przez zewnętrzne skrypty
- Clickjacking

**Propozycja rozwiązania:**
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        // ... istniejące nagłówki ...
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' dla Next.js
            "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' dla Tailwind
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://www.googleapis.com", // Dla Google Calendar API
            "frame-ancestors 'self'",
          ].join('; ')
        },
      ],
    },
  ]
}
```

---

## 🟡 ŚREDNIE PROBLEMY

### 6. **Słaba polityka haseł**

**Problem:**
- Minimalne wymagania: tylko 8 znaków
- Brak wymagań dotyczących złożoności (wielkie litery, cyfry, znaki specjalne)
- Brak ochrony przed popularnymi hasłami

**Lokalizacja:**
- `src/app/api/auth/register/route.ts` (linia 9)

**Ryzyko:** 🟡 **ŚREDNIE**

**Propozycja rozwiązania:**
```typescript
// src/lib/password-validator.ts
import zxcvbn from 'zxcvbn' // npm install zxcvbn @types/zxcvbn

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Hasło musi mieć co najmniej 8 znaków' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Hasło jest zbyt długie' }
  }
  
  // Sprawdź złożoność
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      valid: false, 
      error: 'Hasło musi zawierać wielkie litery, małe litery i cyfry' 
    }
  }
  
  // Sprawdź siłę hasła (opcjonalnie)
  const strength = zxcvbn(password)
  if (strength.score < 2) { // 0-4 scale, 2 = weak
    return { 
      valid: false, 
      error: 'Hasło jest zbyt słabe. Użyj bardziej złożonego hasła.' 
    }
  }
  
  return { valid: true }
}
```

---

### 7. **Długie sesje bez rotacji tokenów**

**Problem:**
- Sesje trwają 8 godzin (`maxAge: 8 * 60 * 60`)
- Brak rotacji tokenów JWT
- Brak możliwości unieważnienia sesji

**Lokalizacja:**
- `src/lib/auth-config.ts` (linia 145)

**Ryzyko:** 🟡 **ŚREDNIE**
- W przypadku skradzionego tokenu, atakujący ma dostęp przez 8 godzin

**Propozycja rozwiązania:**
- Skróć `maxAge` do 2-4 godzin
- Dodaj refresh tokens z krótszym czasem życia
- Rozważ blacklistę tokenów przy wylogowaniu

---

### 8. **Brak walidacji rozmiaru request body**

**Problem:**
- Brak limitu rozmiaru request body
- Możliwość DoS przez bardzo duże żądania

**Ryzyko:** 🟡 **ŚREDNIE**

**Propozycja rozwiązania:**
```typescript
// src/middleware.ts lub w każdym API route
const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body jest zbyt duży' },
      { status: 413 }
    )
  }
  // ... reszta kodu
}
```

---

### 9. **Brak ochrony przed CSRF dla API**

**Problem:**
- NextAuth chroni formularze, ale API routes mogą być podatne
- Brak weryfikacji origin/referer dla API

**Ryzyko:** 🟡 **ŚREDNIE** (NextAuth częściowo chroni)

**Propozycja rozwiązania:**
- NextAuth domyślnie chroni przed CSRF, ale warto dodać dodatkową weryfikację dla wrażliwych operacji

---

### 10. **Brak walidacji UUID w parametrach ścieżki**

**Problem:**
- Parametry `[id]` w routes nie są walidowane jako UUID
- Możliwość błędów bazy danych przy nieprawidłowych ID

**Lokalizacja:**
- Wszystkie routes z `[id]` (np. `/api/clients/[id]`)

**Ryzyko:** 🟡 **NISKIE-ŚREDNIE**

**Propozycja rozwiązania:**
```typescript
import { z } from 'zod'

const uuidSchema = z.string().uuid()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const validatedId = uuidSchema.parse(params.id)
    // ... reszta kodu
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy ID' }, { status: 400 })
  }
}
```

---

### 11. **Brak rate limiting na endpointach autoryzacji**

**Problem:**
- Brak rate limiting na `/api/auth/register` i `/api/auth/[...nextauth]`
- Możliwość brute-force ataków

**Ryzyko:** 🟡 **ŚREDNIE-WYSOKIE**

**Propozycja:** Zobacz punkt 1 (Rate Limiting)

---

### 12. **Middleware nie chroni wszystkich API routes**

**Problem:**
- Middleware chroni tylko `/api/protected/*`
- Większość API routes (`/api/clients`, `/api/tasks`, etc.) nie jest chroniona przez middleware
- Każdy route musi sam sprawdzać autoryzację

**Ryzyko:** 🟡 **ŚREDNIE** (każdy route sprawdza, ale brak centralnej ochrony)

**Propozycja rozwiązania:**
```typescript
// src/middleware.ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/contacts/:path*",
    "/tasks/:path*",
    "/calendar/:path*",
    "/admin/:path*",
    "/api/((?!auth|_next|favicon.ico).*)", // Chroni wszystkie API oprócz auth i Next.js
  ],
}
```

---

## 🟢 NISKIE PROBLEMY (Warto poprawić)

### 13. **Brak walidacji zmiennych środowiskowych przy starcie**

**Problem:**
- `validateAuthConfig()` sprawdza tylko niektóre zmienne
- Brak walidacji `DATABASE_URL`, `SMTP_*`, etc.

**Propozycja rozwiązania:**
```typescript
// src/lib/env-validator.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // ... inne zmienne
})

export function validateEnv() {
  try {
    envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Błąd walidacji zmiennych środowiskowych:')
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      }
    }
  }
}
```

---

### 14. **Brak monitoringu i alertów bezpieczeństwa**

**Problem:**
- Brak logowania podejrzanych aktywności
- Brak alertów przy wielokrotnych nieudanych logowaniach

**Propozycja rozwiązania:**
- Dodaj logowanie nieudanych prób logowania
- Dodaj alerty przy wykryciu podejrzanych wzorców

---

### 15. **Brak rotacji sekretów**

**Problem:**
- `NEXTAUTH_SECRET` nie jest rotowany
- W przypadku wycieku, wszystkie sesje są zagrożone

**Propozycja rozwiązania:**
- Dokumentacja procesu rotacji sekretów
- Rozważ użycie key management service (np. AWS Secrets Manager)

---

## 📊 Priorytetyzacja napraw

### Priorytet 1 (Krytyczne - natychmiast):
1. ✅ Rate Limiting (punkt 1)
2. ✅ Zabezpieczenie uploadów plików (punkt 2)
3. ✅ Sanityzacja logów (punkt 3)

### Priorytet 2 (Wysokie - w ciągu tygodnia):
4. ✅ Walidacja query parameters (punkt 4)
5. ✅ Content Security Policy (punkt 5)
6. ✅ Wzmocnienie polityki haseł (punkt 6)

### Priorytet 3 (Średnie - w ciągu miesiąca):
7. ✅ Skrócenie sesji (punkt 7)
8. ✅ Walidacja UUID (punkt 10)
9. ✅ Rozszerzenie middleware (punkt 12)

### Priorytet 4 (Niskie - gdy będzie czas):
10. ✅ Walidacja zmiennych środowiskowych (punkt 13)
11. ✅ Monitoring (punkt 14)

---

## 🛠️ Narzędzia do wdrożenia

### Zależności do dodania:
```json
{
  "dependencies": {
    "lru-cache": "^10.0.0",
    "zxcvbn": "^4.4.2"
  },
  "devDependencies": {
    "@types/zxcvbn": "^4.4.2"
  }
}
```

### Alternatywy dla produkcji:
- **Rate Limiting:** `@upstash/ratelimit` (Redis-based)
- **File Upload:** Cloudinary, AWS S3
- **Monitoring:** Sentry, LogRocket
- **Security Headers:** `next-safe` package

---

## 📝 Checklist przed wdrożeniem

- [ ] Przetestować rate limiting na środowisku testowym
- [ ] Przetestować walidację plików z różnymi typami
- [ ] Sprawdzić czy logi nie zawierają wrażliwych danych
- [ ] Przetestować CSP w przeglądarce
- [ ] Zaktualizować dokumentację API z nowymi limitami
- [ ] Dodać testy jednostkowe dla nowych funkcji bezpieczeństwa

---

## 🔗 Przydatne zasoby

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#security)

---

**Uwaga:** Ta analiza nie zastępuje profesjonalnego audytu bezpieczeństwa. Dla aplikacji produkcyjnych zalecane jest przeprowadzenie audytu przez zewnętrzną firmę specjalizującą się w bezpieczeństwie.

