# 🚂 Szybki start - Deploy na Railway

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

1. **W Railway, kliknij "New Project"**
2. **Wybierz "Deploy from GitHub repo"**
3. **Wybierz swoje repozytorium** (internal-crm)
4. Railway automatycznie zacznie budować aplikację

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

Po pierwszym udanym deploy:

1. **W Railway, otwórz swoją aplikację**
2. **Kliknij zakładkę "Deployments"**
3. **Kliknij na najnowszy deployment**
4. **Kliknij "View Logs"** lub **"Open Terminal"**
5. **W terminalu uruchom:**

```bash
npx prisma migrate deploy
```

Lub jeśli migracje nie działają:

```bash
npx prisma db push
```

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

### Problem: Błąd połączenia z bazą danych

**Sprawdź:**
- Czy baza PostgreSQL jest uruchomiona (powinna być zielona)
- Czy `DATABASE_URL` jest automatycznie dodana przez Railway
- W logach aplikacji szukaj błędów połączenia

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

