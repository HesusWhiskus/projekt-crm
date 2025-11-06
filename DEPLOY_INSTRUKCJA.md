# 🚀 Instrukcja wdrożenia projektu na Railway

## Wygenerowany NEXTAUTH_SECRET:
```
WiziyWuxozwE/zmjJsPVrdhAQKOU9Fegrr6dOj9bAhI=
```

**Zapisz ten klucz - będziesz go potrzebować w Railway!**

---

## Krok po kroku - Wdrożenie na Railway

### 1. Utwórz konto na Railway

1. Wejdź na: **https://railway.app**
2. Kliknij **"Start a New Project"**
3. Zaloguj się przez **GitHub** (użyj konta: HesusWhiskus)

### 2. Utwórz nowy projekt

1. W Railway, kliknij **"New Project"**
2. Wybierz **"Deploy from GitHub repo"**
3. Wybierz repozytorium: **projekt-crm**
4. Railway automatycznie zacznie budować aplikację

### 3. Dodaj bazę danych PostgreSQL

1. W projekcie Railway, kliknij **"+ New"**
2. Wybierz **"Database" → "Add PostgreSQL"**
3. Railway automatycznie utworzy bazę i doda zmienną `DATABASE_URL`

### 4. Ustaw domenę (WAŻNE - zrób to przed dodaniem zmiennych!)

1. W ustawieniach aplikacji, zakładka **"Settings"**
2. W sekcji **"Domains"**, kliknij **"Generate Domain"**
3. **Skopiuj wygenerowany URL** (np. `projekt-crm-production.up.railway.app`)
4. **Zapisz ten URL** - będziesz go potrzebować w następnym kroku

### 5. Skonfiguruj zmienne środowiskowe

1. Kliknij na swoją **aplikację** (nie bazę danych) w Railway
2. Otwórz zakładkę **"Variables"**
3. Dodaj następujące zmienne:

#### Wymagane zmienne:

```
NODE_ENV=production
NEXTAUTH_URL=https://twoja-wygenerowana-domena.railway.app
NEXTAUTH_SECRET=WiziyWuxozwE/zmjJsPVrdhAQKOU9Fegrr6dOj9bAhI=
```

**UWAGA:** 
- Zamień `twoja-wygenerowana-domena.railway.app` na URL z kroku 4!
- `DATABASE_URL` jest automatycznie dodawana przez Railway - NIE dodawaj jej ręcznie!

#### Opcjonalne zmienne (Google OAuth):

```
GOOGLE_CLIENT_ID=<twój-google-client-id>
GOOGLE_CLIENT_SECRET=<twój-google-client-secret>
```

### 6. Poczekaj na zakończenie build

- Railway automatycznie zbuduje aplikację
- Sprawdź zakładkę **"Deployments"** aby zobaczyć postęp
- Poczekaj aż status będzie **"Active"** (zielony)

### 7. Migracja bazy danych

Po pierwszym udanym deploy:

1. W Railway, otwórz swoją **aplikację**
2. Kliknij zakładkę **"Deployments"**
3. Kliknij na najnowszy deployment
4. Kliknij **"View Logs"** lub **"Open Terminal"**
5. W terminalu uruchom:

```bash
npx prisma migrate deploy
```

Lub jeśli migracje nie działają:

```bash
npx prisma db push
```

### 8. Utwórz konto administratora

W tym samym terminalu Railway:

```bash
npm run admin:create
```

Podaj:
- **Email** (np. admin@example.com)
- **Hasło** (zapamiętaj je!)
- **Imię i nazwisko** (np. Admin User)

### 9. Gotowe! 🎉

Twoja aplikacja powinna być dostępna pod adresem:
**`https://twoja-domena.railway.app`**

**Możesz teraz:**
1. ✅ Otworzyć aplikację w przeglądarce
2. ✅ Zalogować się jako administrator
3. ✅ Utworzyć konta dla testerów
4. ✅ Udostępnić link do testów

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

---

## 💰 Koszty

**Darmowy tier Railway:**
- $5 kredytów miesięcznie
- Wystarczy na małe testy
- Automatyczne wyłączenie przy braku kredytów

---

## 📝 Checklist wdrożenia

- [ ] Konto na Railway utworzone
- [ ] Projekt utworzony i połączony z GitHub
- [ ] Baza PostgreSQL dodana
- [ ] Domena wygenerowana
- [ ] Zmienne środowiskowe ustawione (NODE_ENV, NEXTAUTH_URL, NEXTAUTH_SECRET)
- [ ] Build zakończony pomyślnie
- [ ] Migracje bazy danych uruchomione
- [ ] Konto administratora utworzone
- [ ] Aplikacja dostępna i działa

---

**Potrzebujesz pomocy?** Sprawdź logi w Railway lub dokumentację w DEPLOY.md



