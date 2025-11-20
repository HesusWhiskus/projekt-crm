# Przewodnik wdrożenia Internal CRM

Ten przewodnik opisuje różne opcje wdrożenia aplikacji Internal CRM do środowiska produkcyjnego.

> **💡 Szybki start:** Jeśli chcesz szybko wdrożyć na Railway, zobacz [RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md) lub [DEPLOY_INSTRUKCJA.md](DEPLOY_INSTRUKCJA.md) dla szczegółowej instrukcji krok po kroku.

## 🚀 Opcje wdrożenia

### 1. Railway (Rekomendowane - Najłatwiejsze)

**Dlaczego Railway:**
- ✅ Darmowy tier ($5 kredytów miesięcznie)
- ✅ Automatyczny deploy z GitHub
- ✅ Wbudowana obsługa PostgreSQL
- ✅ Automatyczne SSL/HTTPS
- ✅ Prosta konfiguracja zmiennych środowiskowych
- ✅ Idealne dla testów

**Kroki:**

1. **Przygotuj repozytorium GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <twoj-repo-url>
   git push -u origin main
   ```

2. **Utwórz konto na Railway:**
   - Wejdź na [railway.app](https://railway.app)
   - Zaloguj się przez GitHub

3. **Utwórz nowy projekt:**
   - Kliknij "New Project"
   - Wybierz "Deploy from GitHub repo"
   - Wybierz swoje repozytorium

4. **Dodaj bazę danych PostgreSQL:**
   - W projekcie, kliknij "+ New"
   - Wybierz "Database" → "PostgreSQL"
   - Railway automatycznie utworzy zmienną `DATABASE_URL`

5. **Skonfiguruj zmienne środowiskowe:**
   W ustawieniach projektu (Variables), dodaj:
   ```
   NODE_ENV=production
   NEXTAUTH_URL=https://twoja-domena.railway.app
   NEXTAUTH_SECRET=<wygeneruj-klucz>
   ```
   
   Wygeneruj NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

6. **Dodaj Google OAuth (opcjonalnie):**
   ```
   GOOGLE_CLIENT_ID=<twoj-google-client-id>
   GOOGLE_CLIENT_SECRET=<twoj-google-client-secret>
   ```

7. **Konfiguracja build:**
   Railway automatycznie wykryje Next.js. W ustawieniach projektu:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `/` (domyślne)

8. **Deploy:**
   - Railway automatycznie zbuduje i wdroży aplikację
   - Po zakończeniu, kliknij "Generate Domain" dla darmowej domeny

9. **Migracja bazy danych:**
   Migracje są automatycznie wykonywane przy starcie aplikacji przez Dockerfile (start.sh).
   Jeśli migracje nie zostały wykonane automatycznie, możesz je uruchomić ręcznie:
   - W Railway, otwórz terminal dla aplikacji
   - Uruchom: `npx prisma migrate deploy`

10. **Utwórz konto administratora:**
   - W terminalu Railway: `npm run admin:create`

**Koszt:** Darmowe dla testów (do $5/miesiąc kredytów)

---

### 2. Vercel + Supabase (Alternatywa)

**Dlaczego Vercel + Supabase:**
- ✅ Vercel - najlepszy dla Next.js (twórcy Next.js)
- ✅ Supabase - darmowa baza PostgreSQL (do 500MB)
- ✅ Automatyczne SSL/HTTPS
- ✅ Darmowe tier bardzo hojny

**Kroki:**

1. **Utwórz bazę Supabase:**
   - Wejdź na [supabase.com](https://supabase.com)
   - Utwórz nowy projekt
   - Skopiuj connection string (Settings → Database → Connection string)

2. **Wdróż na Vercel:**
   - Wejdź na [vercel.com](https://vercel.com)
   - Kliknij "Import Project"
   - Połącz z GitHub repozytorium

3. **Skonfiguruj zmienne środowiskowe w Vercel:**
   ```
   DATABASE_URL=<supabase-connection-string>
   NODE_ENV=production
   NEXTAUTH_URL=https://twoja-domena.vercel.app
   NEXTAUTH_SECRET=<wygeneruj-klucz>
   GOOGLE_CLIENT_ID=<opcjonalnie>
   GOOGLE_CLIENT_SECRET=<opcjonalnie>
   ```

4. **Deploy:**
   - Vercel automatycznie zbuduje i wdroży
   - Po deploy, uruchom migracje w terminalu Vercel:
     ```bash
     npx prisma migrate deploy
     ```

5. **Utwórz konto administratora:**
   ```bash
   npm run admin:create
   ```

**Koszt:** Darmowe (Vercel Hobby plan + Supabase Free tier)

---

### 3. Render (Podobne do Railway)

**Kroki:**

1. Wejdź na [render.com](https://render.com)
2. Utwórz konto
3. "New" → "Blueprint" (lub ręcznie Web Service + PostgreSQL)
4. Połącz z GitHub
5. Skonfiguruj zmienne środowiskowe (jak w Railway)
6. Deploy

**Koszt:** Darmowe tier dostępny

---

## 🔧 Wymagane zmienne środowiskowe

Wszystkie platformy wymagają tych zmiennych:

```env
# Database (automatycznie w Railway/Supabase)
DATABASE_URL=postgresql://...

# NextAuth (WYMAGANE)
NEXTAUTH_URL=https://twoja-domena.com
NEXTAUTH_SECRET=<wygeneruj-klucz-32-znaki>

# Google OAuth (opcjonalnie)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (opcjonalnie, dla powiadomień)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

## 📝 Post-deploy checklist

Po wdrożeniu wykonaj:

- [ ] Uruchom migracje bazy danych
- [ ] Utwórz konto administratora
- [ ] Sprawdź czy HTTPS działa
- [ ] Przetestuj logowanie
- [ ] Przetestuj Google OAuth (jeśli skonfigurowane)
- [ ] Sprawdź czy wszystkie funkcje działają
- [ ] Skonfiguruj monitoring (opcjonalnie)

## 🛠️ Komendy do uruchomienia po deploy

### Migracja bazy danych:
```bash
npx prisma migrate deploy
```

### Utworzenie administratora:
```bash
npm run admin:create
```

### Sprawdzenie połączenia z bazą:
```bash
npx prisma studio
```

## 🔐 Bezpieczeństwo

1. **Nigdy nie commituj `.env` do Git**
2. **Używaj silnych sekretów** (NEXTAUTH_SECRET)
3. **Włącz HTTPS** (automatyczne na Railway/Vercel)
4. **Regularnie aktualizuj zależności**
5. **Ogranicz dostęp do bazy danych** (tylko z aplikacji)

## 💰 Szacunkowe koszty

- **Railway:** $0-5/miesiąc (darmowy tier)
- **Vercel + Supabase:** $0/miesiąc (darmowe tier dla testów)
- **Render:** $0-7/miesiąc (darmowy tier)

## 🆘 Troubleshooting

### Problem: Baza danych nie łączy się
- Sprawdź `DATABASE_URL` w zmiennych środowiskowych
- Upewnij się, że baza jest uruchomiona
- Sprawdź firewall/whitelist

### Problem: NextAuth nie działa
- Sprawdź `NEXTAUTH_URL` (musi być dokładnie URL aplikacji)
- Sprawdź `NEXTAUTH_SECRET` (musi być ustawiony)
- W logach szukaj błędów NextAuth

### Problem: Build się nie powodzi
- Sprawdź logi build w platformie
- Upewnij się, że wszystkie zależności są w `package.json`
- Sprawdź czy `prisma generate` działa

## 📞 Wsparcie

Jeśli masz problemy:
1. Sprawdź logi w platformie deploy
2. Sprawdź dokumentację platformy
3. Sprawdź logi aplikacji

---

**Rekomendacja:** Dla szybkich testów użyj **Railway** - najprostszy setup i wszystko w jednym miejscu.

