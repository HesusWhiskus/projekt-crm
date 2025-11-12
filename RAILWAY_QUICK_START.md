# 🚂 Szybki start - Deploy na Railway

## 📋 Wybór metody wdrożenia

**Masz dwie opcje:**

1. **Interfejs webowy Railway (Rekomendowane - Najprostsze)** ✅
   - Wszystkie kroki poniżej używają interfejsu webowego
   - Nie wymaga instalacji dodatkowych narzędzi
   - Wystarczy przeglądarka

2. **Railway CLI (Opcjonalnie - dla zaawansowanych)**
   - Jeśli chcesz używać komend w terminalu
   - Railway CLI jest już zainstalowane w tym projekcie
   - Zobacz sekcję "Alternatywa: Railway CLI" na końcu

**💡 Dla większości użytkowników wystarczy interfejs webowy!**

---

## Krok 1: Przygotowanie repozytorium GitHub

### Jeśli masz Git zainstalowany:

```bash
# Sprawdź czy repozytorium już istnieje
git status

# Jeśli nie, zainicjuj repozytorium
git init
git add .
git commit -m "Initial commit - ready for Railway deploy"

# Utwórz repozytorium na GitHub (github.com/new)
# Następnie połącz lokalne repozytorium z GitHub:
git remote add origin https://github.com/TWOJA-NAZWA-UZYTKOWNIKA/nazwa-repo.git
git branch -M main
git push -u origin main
```

### Jeśli NIE masz Git zainstalowanego:

1. **Pobierz Git:** https://git-scm.com/download/win
2. **Zainstaluj Git** (domyślne ustawienia są OK)
3. **Utwórz konto na GitHub:** https://github.com/signup
4. **Utwórz nowe repozytorium** na GitHub:
   - Kliknij "+" → "New repository"
   - Nazwa: np. `internal-crm`
   - Public lub Private (dla testów Public jest OK)
   - NIE zaznaczaj "Initialize with README"
   - Kliknij "Create repository"

5. **Wrzuć kod na GitHub:**
   - W folderze projektu, otwórz PowerShell lub Git Bash
   - Wykonaj komendy z sekcji powyżej

---

## Krok 2: Utwórz konto na Railway

1. **Wejdź na:** https://railway.app
2. **Kliknij "Start a New Project"**
3. **Zaloguj się przez GitHub** (użyj tego samego konta co GitHub)

---

## Krok 3: Deploy projektu

Po kliknięciu "New Project" zobaczysz ekran z pytaniem **"What would you like to deploy today?"** i listą opcji:

1. **GitHub Repository** (z ikoną GitHub Octocat) ← **Ta opcja!**
2. Database
3. Template
4. Docker Image
5. Function
6. Empty Project

### Kroki wdrożenia:

1. **Kliknij "GitHub Repository"** (pierwsza opcja na liście, z ikoną GitHub)
2. **Jeśli nie widzisz repozytoriów lub jesteś proszony o autoryzację:**
   - Railway poprosi Cię o połączenie konta GitHub
   - Kliknij "Connect GitHub" lub "Authorize"
   - Zaloguj się do GitHub i autoryzuj dostęp do repozytoriów
3. **Wybierz swoje repozytorium** z listy (szukaj `internal-crm` lub nazwy Twojego repozytorium)
4. Railway automatycznie zacznie budować aplikację

### ⚠️ Jeśli nie widzisz opcji "GitHub Repository":

**Możliwe przyczyny:**
- Twoje konto GitHub nie jest jeszcze połączone z Railway

**Rozwiązanie:**
1. Kliknij na swój profil (ikonka w prawym górnym rogu Railway)
2. Przejdź do **"Settings"** → **"GitHub"** (lub **"Connections"**)
3. Kliknij **"Connect GitHub"** i autoryzuj dostęp
4. Wróć do głównego ekranu i kliknij **"New Project"** ponownie
5. Teraz powinieneś zobaczyć opcję **"GitHub Repository"**

---

## Krok 4: Dodaj bazę danych PostgreSQL

1. **W projekcie Railway, kliknij "+ New"**
2. **Wybierz "Database" → "Add PostgreSQL"**
3. Railway automatycznie utworzy bazę i doda zmienną `DATABASE_URL`

---

## Krok 5: Skonfiguruj zmienne środowiskowe

1. **Kliknij na swoją aplikację** (nie bazę danych)
2. **Otwórz zakładkę "Variables"**
3. **Dodaj następujące zmienne:**

### Wymagane zmienne:

```
NODE_ENV=production
NEXTAUTH_URL=https://twoja-domena.railway.app
NEXTAUTH_SECRET=<wygeneruj-poniżej>
```

### Wygeneruj NEXTAUTH_SECRET:

**Opcja 1 - Online:**
- Wejdź na: https://generate-secret.vercel.app/32
- Skopiuj wygenerowany klucz

**Opcja 2 - W PowerShell:**
```powershell
# Generowanie losowego klucza
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Opcja 3 - W terminalu Railway:**
- Po deploy, otwórz terminal w Railway
- Uruchom: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Opcjonalne zmienne (Google OAuth):

```
GOOGLE_CLIENT_ID=<twój-google-client-id>
GOOGLE_CLIENT_SECRET=<twój-google-client-secret>
```

**Uwaga:** `DATABASE_URL` jest automatycznie dodawana przez Railway, nie musisz jej dodawać ręcznie.

---

## Krok 6: Ustaw domenę

1. **W ustawieniach aplikacji, zakładka "Settings"**
2. **W sekcji "Domains", kliknij "Generate Domain"**
3. **Skopiuj wygenerowany URL** (np. `internal-crm-production.up.railway.app`)
4. **Zaktualizuj `NEXTAUTH_URL`** w zmiennych środowiskowych:
   ```
   NEXTAUTH_URL=https://twoja-wygenerowana-domena.railway.app
   ```
5. Railway automatycznie zrestartuje aplikację

---

## Krok 7: Migracja bazy danych

**⚠️ WAŻNE:** Migracje są uruchamiane automatycznie przy starcie aplikacji!

### Automatyczne migracje:

**Migracje są uruchamiane automatycznie przy starcie aplikacji** (przed uruchomieniem serwera Next.js). To zapewnia:
- Build nie wymaga połączenia z bazą danych (szybszy i bardziej niezawodny)
- Migracje są zawsze uruchamiane w środowisku produkcyjnym z dostępem do bazy
- Aplikacja nie uruchomi się, jeśli migracje się nie powiodą - zapewnia to spójność bazy danych

### Sprawdź logi:

1. **W Railway, otwórz swoją aplikację**
2. **Kliknij zakładkę "Deployments"**
3. **Kliknij na najnowszy deployment**
4. **Kliknij "View Logs"**
5. **Szukaj sekcji:** `=== Running database migrations (REQUIRED before app start) ===`

### Jeśli migracje się nie powiodły:

**Aplikacja automatycznie się nie uruchomi** - to jest zamierzone zachowanie dla bezpieczeństwa.

**Aby naprawić problem:**

1. **Sprawdź logi** - znajdź dokładny błąd migracji
2. **W terminalu Railway uruchom ręcznie:**

```bash
npx prisma migrate deploy
```

Lub jeśli migracje nie działają:

```bash
npx prisma db push --accept-data-loss
```

3. **Po naprawieniu migracji**, aplikacja automatycznie się zrestartuje

---

## Krok 8: Utwórz konto administratora

W tym samym terminalu Railway:

```bash
npm run admin:create
```

Podaj:
- Email
- Hasło
- Imię i nazwisko

---

## Krok 9: Gotowe! 🎉

Twoja aplikacja powinna być dostępna pod adresem:
`https://twoja-domena.railway.app`

**Możesz teraz:**
1. Otworzyć aplikację w przeglądarce
2. Zalogować się jako administrator
3. Utworzyć konta dla koleżanek i kolegów
4. Udostępnić link do testów

---

## 🔧 Troubleshooting

### Problem: Build się nie powodzi

**Sprawdź:**
- Logi w Railway (Deployments → View Logs)
- Czy wszystkie zmienne środowiskowe są ustawione
- Czy `NEXTAUTH_URL` ma poprawny URL (z https://)
- Sprawdź logi build w Railway - szukaj błędów kompilacji, brakujących zależności

**Jeśli build się nie powodzi:**
1. **Build NIE wymaga bazy danych** - Prisma Client jest generowany bez połączenia z bazą
2. Sprawdź logi build w Railway - szukaj błędów kompilacji TypeScript, brakujących zależności, itp.
3. Jeśli build się powiódł, ale aplikacja nie startuje - sprawdź logi startu aplikacji (migracje)

### Problem: Błąd połączenia z bazą danych

**Sprawdź:**
- Czy baza PostgreSQL jest uruchomiona (powinna być zielona)
- Czy `DATABASE_URL` jest automatycznie dodana przez Railway
- W logach aplikacji szukaj błędów połączenia
- **Czy migracje się powiodły** - aplikacja nie uruchomi się, jeśli migracje się nie powiodły
- W logach szukaj: `ERROR: Database migration failed! App cannot start.`

### Problem: NextAuth nie działa

**Sprawdź:**
- `NEXTAUTH_URL` musi być dokładnie URL aplikacji (z https://)
- `NEXTAUTH_SECRET` musi być ustawiony
- W logach szukaj błędów NextAuth

### Problem: Strona nie ładuje się

**Sprawdź:**
- Czy deployment się zakończył (status: "Active")
- Czy wszystkie zmienne są ustawione
- Sprawdź logi w Railway

---

## 📊 Monitorowanie

**W Railway możesz:**
- Oglądać logi w czasie rzeczywistym
- Sprawdzać użycie zasobów
- Zobaczyć historię deploymentów
- Zarządzać zmiennymi środowiskowymi

---

## 💰 Koszty

**Darmowy tier Railway:**
- $5 kredytów miesięcznie
- Wystarczy na małe testy
- Automatyczne wyłączenie przy braku kredytów

**Po wyczerpaniu kredytów:**
- Możesz dodać kartę kredytową (bezpłatny okres próbny)
- Lub użyć alternatywy: Vercel + Supabase (całkowicie darmowe)

---

## 🎯 Następne kroki

Po udanym deploy:
1. ✅ Przetestuj wszystkie funkcje
2. ✅ Utwórz konta dla testerów
3. ✅ Skonfiguruj Google OAuth (opcjonalnie)
4. ✅ Skonfiguruj email (dla powiadomień, opcjonalnie)

---

**Potrzebujesz pomocy?** Sprawdź logi w Railway lub dokumentację w DEPLOY.md

---

## 🔧 Alternatywa: Railway CLI (Opcjonalnie)

Jeśli wolisz używać komend w terminalu zamiast interfejsu webowego:

### Instalacja Railway CLI (jeśli nie jest zainstalowane):

```bash
npm install -g @railway/cli
```

### Podstawowe komendy CLI:

```bash
# Zaloguj się do Railway
railway login

# Połącz projekt z Railway (w folderze projektu)
railway link

# Dodaj zmienne środowiskowe
railway variables set NODE_ENV=production
railway variables set NEXTAUTH_SECRET=<twój-secret>
railway variables set NEXTAUTH_URL=https://twoja-domena.railway.app

# Uruchom migracje bazy danych
railway run npx prisma migrate deploy

# Utwórz konto administratora
railway run npm run admin:create

# Otwórz logi
railway logs

# Otwórz terminal w Railway
railway shell
```

### Deploy przez CLI:

```bash
# Railway automatycznie wykryje zmiany w Git
# Po push do GitHub, Railway zbuduje i wdroży aplikację
git add .
git commit -m "Ready for deployment"
git push
```

**Uwaga:** Nawet z CLI, Railway wymaga repozytorium GitHub do automatycznego deploy.

---

## ✅ Status instalacji

- ✅ **Railway CLI:** Zainstalowane (wersja 4.11.0)
- ✅ **npm:** Dostępne (wersja 11.4.1)
- ✅ **Konfiguracja Railway:** `railway.json` gotowe

**Możesz teraz używać zarówno interfejsu webowego, jak i CLI!**

