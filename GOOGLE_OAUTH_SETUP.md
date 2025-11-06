# 🔐 Konfiguracja Google OAuth - Krok po kroku

Google OAuth jest **wymagane** dla integracji z Google Calendar. Poniżej znajdziesz szczegółową instrukcję konfiguracji.

## 📋 Wymagania

- Konto Google
- Dostęp do Google Cloud Console
- Aplikacja wdrożona na Railway (lub innej platformie)

## 🚀 Krok 1: Utwórz projekt w Google Cloud Console

1. **Wejdź na:** https://console.cloud.google.com/
2. **Zaloguj się** swoim kontem Google
3. **Kliknij** na wybór projektu (góra ekranu) → **"New Project"**
4. **Nazwa projektu:** np. `Projekt CRM` lub `Internal CRM`
5. **Kliknij** "Create"

## 🔑 Krok 2: Włącz Google+ API

1. W menu po lewej stronie wybierz **"APIs & Services"** → **"Library"**
2. Wyszukaj **"Google+ API"** (lub "Google Calendar API" jeśli potrzebujesz tylko kalendarza)
3. **Kliknij** na wynik
4. **Kliknij** "Enable" (Włącz)

**Uwaga:** Dla integracji z kalendarzem potrzebujesz również:
- **Google Calendar API** - włącz również tę API

## 🔐 Krok 3: Utwórz OAuth 2.0 Client ID

1. W menu po lewej wybierz **"APIs & Services"** → **"Credentials"**
2. **Kliknij** "Create Credentials" → **"OAuth client ID"**
3. Jeśli widzisz komunikat o konfiguracji ekranu zgody:
   - **Wybierz** "External" (dla testów) lub "Internal" (jeśli masz Google Workspace)
   - **Wypełnij** wymagane pola:
     - **App name:** `Projekt CRM` (lub dowolna nazwa)
     - **User support email:** Twój email
     - **Developer contact information:** Twój email
   - **Kliknij** "Save and Continue"
   - **W kroku "Scopes"** - kliknij "Save and Continue" (scopes są już skonfigurowane w kodzie)
   - **W kroku "Test users"** - **DODAJ EMAILE UŻYTKOWNIKÓW TESTOWYCH:**
     - **Kliknij** "Add Users"
     - **Wpisz** email każdego użytkownika, który będzie mógł się zalogować (np. `twoj@email.com`)
     - **Kliknij** "Add" dla każdego użytkownika
     - **Kliknij** "Save and Continue"
   - **Kliknij** "Back to Dashboard"

4. **Wybierz** typ aplikacji: **"Web application"**
5. **Nazwa:** np. `Projekt CRM Web Client`
6. **Authorized JavaScript origins:**
   - Dodaj: `https://projekt-crm-production.up.railway.app`
   - (Zastąp na swoją domenę z Railway)

7. **Authorized redirect URIs:**
   - Dodaj: `https://projekt-crm-production.up.railway.app/api/auth/callback/google`
   - (Zastąp na swoją domenę z Railway)

8. **Kliknij** "Create"

## 📝 Krok 4: Skopiuj Client ID i Client Secret

Po utworzeniu OAuth Client zobaczysz:
- **Client ID** - długi ciąg znaków
- **Client Secret** - kliknij "Show" aby zobaczyć

**Zapisz oba wartości!**

## ⚙️ Krok 5: Dodaj zmienne do Railway

1. **Wejdź** do swojego projektu na Railway
2. **Kliknij** na aplikację (nie bazę danych)
3. **Otwórz** zakładkę **"Variables"**
4. **Dodaj** następujące zmienne:

```
GOOGLE_CLIENT_ID=<wklej-tutaj-client-id>
GOOGLE_CLIENT_SECRET=<wklej-tutaj-client-secret>
```

5. **Zapisz** zmienne

## 🔄 Krok 6: Restart aplikacji

Railway automatycznie zrestartuje aplikację po dodaniu zmiennych. Jeśli nie:
1. **Kliknij** na aplikację
2. **Menu** (trzy kropki) → **"Restart"**

## ✅ Krok 7: Dodaj użytkowników testowych (WAŻNE dla trybu testowego!)

Jeśli aplikacja jest w trybie testowym, **tylko użytkownicy z listy testowych mogą się zalogować**:

### Opcja A: Podczas konfiguracji ekranu zgody (jeśli jeszcze nie skończyłeś)

1. W Google Cloud Console → **"APIs & Services"** → **"OAuth consent screen"**
2. Jeśli widzisz kroki konfiguracji (App information, Scopes, Test users, Summary):
   - Przejdź do kroku **"Test users"**
   - **Kliknij** "Add Users"
   - **Wpisz** email użytkownika (np. `uzytkownik@example.com`)
   - **Kliknij** "Add"
   - **Powtórz** dla każdego użytkownika
   - **Kliknij** "Save and Continue"

### Opcja B: Jeśli ekran zgody jest już skonfigurowany

1. W Google Cloud Console → **"APIs & Services"** → **"OAuth consent screen"**
2. **Kliknij** na zakładkę **"EDIT APP"** (Edytuj aplikację) na górze strony
3. Przewiń w dół do sekcji **"Test users"** (lub kliknij na krok "Test users" w menu po lewej)
4. **Kliknij** przycisk **"+ ADD USERS"** (lub "Add Users")
5. **Wpisz** email użytkownika w polu tekstowym (np. `uzytkownik@example.com`)
6. **Kliknij** "Add" (lub naciśnij Enter)
7. **Powtórz** kroki 5-6 dla każdego użytkownika
8. **Kliknij** "SAVE AND CONTINUE" (lub "Save") na dole strony

**Uwaga:** 
- Możesz dodać maksymalnie 100 użytkowników testowych
- Jeśli nie widzisz sekcji "Test users", upewnij się że wybrałeś "External" jako typ aplikacji (nie "Internal")
- Zmiany są natychmiastowe - nie trzeba restartować aplikacji

## ✅ Krok 8: Sprawdź czy działa

1. **Wejdź** na stronę logowania aplikacji
2. **Kliknij** "Zaloguj się przez Google"
3. **Zaloguj się** kontem Google (które jest na liście testowych użytkowników)
4. **Zezwól** na dostęp do aplikacji i uprawnienia do Calendar API
5. Powinieneś zostać przekierowany z powrotem do aplikacji

**✅ Po pomyślnej konfiguracji:**
- Logowanie przez Google działa poprawnie
- Użytkownicy testowi mogą się logować
- Integracja z Google Calendar jest aktywna
- Zadania można synchronizować z kalendarzem Google

## 🐛 Rozwiązywanie problemów

### Problem: "Access blocked: This app's request is invalid" lub "Error 400: access_denied"

**Przyczyna:** Aplikacja jest w trybie testowym i email użytkownika nie jest na liście testowych użytkowników

**Rozwiązanie:**
1. W Google Cloud Console → "APIs & Services" → "OAuth consent screen"
2. Przewiń do sekcji "Test users"
3. Kliknij "Add Users"
4. Dodaj email użytkownika, który próbuje się zalogować
5. Zapisz zmiany
6. Spróbuj zalogować się ponownie

### Problem: Błąd "OAuthSignin"

**Przyczyny:**
- Callback URL w Google Cloud Console nie pasuje do `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID` lub `GOOGLE_CLIENT_SECRET` są nieprawidłowe
- `NEXTAUTH_URL` jest nieprawidłowy

**Rozwiązanie:**
1. Sprawdź czy `NEXTAUTH_URL` w Railway to dokładnie: `https://projekt-crm-production.up.railway.app` (bez końcowego slasha)
2. Sprawdź czy callback URL w Google Cloud Console to dokładnie: `https://projekt-crm-production.up.railway.app/api/auth/callback/google`
3. Sprawdź czy `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` są poprawnie skopiowane (bez spacji na początku/końcu)

### Problem: "redirect_uri_mismatch"

**Przyczyna:** Callback URL w Google Cloud Console nie pasuje do tego co używa aplikacja

**Rozwiązanie:**
1. W Google Cloud Console → Credentials → OAuth 2.0 Client ID
2. Sprawdź czy w "Authorized redirect URIs" jest dokładnie:
   `https://projekt-crm-production.up.railway.app/api/auth/callback/google`
3. Jeśli nie ma, dodaj i zapisz

### Problem: "invalid_client"

**Przyczyna:** `GOOGLE_CLIENT_ID` lub `GOOGLE_CLIENT_SECRET` są nieprawidłowe

**Rozwiązanie:**
1. Sprawdź czy wartości w Railway Variables są poprawne
2. Upewnij się, że nie ma spacji na początku/końcu
3. Skopiuj ponownie z Google Cloud Console

## 📚 Dodatkowe informacje

- **Google Calendar API** jest automatycznie dostępna po włączeniu Google+ API
- Tokeny OAuth są przechowywane w sesji JWT
- Użytkownicy mogą logować się zarówno przez email/hasło jak i przez Google
- Integracja z Google Calendar wymaga zalogowania przez Google (aby uzyskać tokeny dostępu)

## 🔒 Bezpieczeństwo

- **Nigdy nie commituj** `GOOGLE_CLIENT_SECRET` do Git
- **Używaj** zmiennych środowiskowych w Railway
- **Regularnie sprawdzaj** kto ma dostęp do projektu w Google Cloud Console

