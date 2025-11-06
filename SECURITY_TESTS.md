# 🧪 Testy bezpieczeństwa - Security Improvements

## Przed rozpoczęciem

1. **Przełącz się na branch:**
   ```bash
   git checkout security-improvements
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Uruchom aplikację:**
   ```bash
   npm run dev
   ```

4. **Otwórz aplikację:** http://localhost:3000

---

## ✅ Test 1: Rate Limiting na rejestracji

### Cel: Sprawdzić czy rate limiting działa na `/api/auth/register`

### Kroki:
1. Otwórz DevTools (F12) → Network
2. Przejdź na stronę rejestracji: http://localhost:3000/signup
3. Spróbuj zarejestrować się **6 razy szybko** (w ciągu 15 minut)
   - Możesz użyć różnych emaili lub tego samego
   - Wypełnij formularz i kliknij "Zarejestruj się"
   - Po każdej próbie sprawdź odpowiedź w Network tab

### Oczekiwany wynik:
- **Próby 1-5:** Powinny przejść normalnie (201 Created lub 400 jeśli email istnieje)
- **Próba 6:** Powinna zwrócić **429 Too Many Requests** z komunikatem:
  ```json
  {
    "error": "Zbyt wiele prób rejestracji. Spróbuj ponownie później."
  }
  ```
- W nagłówkach odpowiedzi powinny być:
  - `X-RateLimit-Limit: 5`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: <timestamp>`
  - `Retry-After: <seconds>`

### Jak sprawdzić:
- Otwórz Network tab w DevTools
- Kliknij na request do `/api/auth/register`
- Sprawdź Response status (powinien być 429)
- Sprawdź Response headers

---

## ✅ Test 2: Walidacja uploadów plików

### Cel: Sprawdzić czy uploady plików są prawidłowo walidowane

### Test 2.1: Nieprawidłowy typ pliku
**Kroki:**
1. Przejdź do kontaktu z klientem
2. Kliknij "Dodaj kontakt"
3. Spróbuj przesłać plik z rozszerzeniem `.exe`, `.bat`, `.sh`, `.php`, `.html`
4. Wypełnij formularz i zapisz

**Oczekiwany wynik:**
- Powinien pojawić się błąd: "Nieobsługiwany typ pliku"
- Plik nie powinien zostać przesłany

### Test 2.2: Zbyt duży plik
**Kroki:**
1. Spróbuj przesłać plik większy niż 10MB
2. (Możesz użyć narzędzia do generowania dużych plików lub skompresować duży plik)

**Oczekiwany wynik:**
- Błąd: "Plik jest zbyt duży. Maksymalny rozmiar: 10MB"

### Test 2.3: Zbyt wiele plików
**Kroki:**
1. Spróbuj przesłać więcej niż 5 plików na raz

**Oczekiwany wynik:**
- Błąd: "Można przesłać maksymalnie 5 plików na raz"

### Test 2.4: Path traversal attack
**Kroki:**
1. Spróbuj przesłać plik z nazwą zawierającą `../../../etc/passwd` lub podobną

**Oczekiwany wynik:**
- Nazwa pliku powinna być sanityzowana
- W bazie danych powinna być zapisana bezpieczna nazwa (z timestamp i random suffix)
- Oryginalna nazwa powinna być zapisana w polu `filename`

### Test 2.5: Prawidłowe pliki
**Kroki:**
1. Spróbuj przesłać:
   - PDF (`.pdf`)
   - Obraz PNG (`.png`)
   - Obraz JPG (`.jpg`)
   - Dokument Word (`.docx`)
   - Excel (`.xlsx`)

**Oczekiwany wynik:**
- Wszystkie powinny przejść walidację
- Pliki powinny zostać zapisane z bezpiecznymi nazwami

---

## ✅ Test 3: Walidacja query parameters

### Cel: Sprawdzić czy query parameters są walidowane

### Test 3.1: Nieprawidłowy UUID w query
**Kroki:**
1. Otwórz DevTools → Network
2. Przejdź do listy klientów: http://localhost:3000/clients
3. W URL dodaj nieprawidłowy UUID: `?assignedTo=nieprawidlowy-uuid`
4. Sprawdź odpowiedź w Network tab

**Oczekiwany wynik:**
- Status: 400 Bad Request
- Błąd: "Nieprawidłowy format ID użytkownika"

### Test 3.2: Zbyt długie wyszukiwanie
**Kroki:**
1. W URL dodaj: `?search=<bardzo-długi-tekst-ponad-100-znaków>`
2. Sprawdź odpowiedź

**Oczekiwany wynik:**
- Status: 400 Bad Request
- Błąd: "Wyszukiwanie jest zbyt długie (max 100 znaków)"

### Test 3.3: Nieprawidłowy status
**Kroki:**
1. W URL dodaj: `?status=INVALID_STATUS`
2. Sprawdź odpowiedź

**Oczekiwany wynik:**
- Status: 400 Bad Request
- Błąd walidacji Zod

### Test 3.4: Prawidłowe parametry
**Kroki:**
1. Użyj prawidłowych parametrów:
   - `?status=NEW_LEAD`
   - `?assignedTo=<prawidlowy-uuid>`
   - `?search=test`

**Oczekiwany wynik:**
- Wszystko powinno działać normalnie

---

## ✅ Test 4: Walidacja UUID w path parameters

### Cel: Sprawdzić czy UUID w ścieżkach są walidowane

### Test 4.1: Nieprawidłowy UUID w URL
**Kroki:**
1. Spróbuj otworzyć: http://localhost:3000/clients/nieprawidlowy-uuid
2. Sprawdź odpowiedź w Network tab

**Oczekiwany wynik:**
- Status: 400 Bad Request
- Błąd: "Nieprawidłowy format ID"

### Test 4.2: Prawidłowy UUID
**Kroki:**
1. Otwórz klienta z prawidłowym UUID (ze strony listy klientów)

**Oczekiwany wynik:**
- Powinno działać normalnie

---

## ✅ Test 5: Sanityzacja logów

### Cel: Sprawdzić czy wrażliwe dane nie są logowane

### Test 5.1: Sprawdź logi w konsoli
**Kroki:**
1. Otwórz terminal gdzie działa `npm run dev`
2. Zaloguj się przez formularz
3. Sprawdź logi w konsoli

**Oczekiwany wynik:**
- W logach NIE powinny być widoczne:
  - Hasła (powinny być `[REDACTED]`)
  - Tokeny (powinny być `[REDACTED]`)
  - Pełne emaile (w produkcji powinny być `[REDACTED]`)
- W development powinny być logi, ale z sanityzowanymi danymi

### Test 5.2: Sprawdź middleware logs
**Kroki:**
1. Przejdź do różnych stron (dashboard, clients, etc.)
2. Sprawdź logi w konsoli

**Oczekiwany wynik:**
- W development: podstawowe logi bez wrażliwych danych
- W produkcji: brak szczegółowych logów

### Test 5.3: Sprawdź plik auth-debug.log
**Kroki:**
1. Sprawdź czy plik `auth-debug.log` istnieje (tylko w development)
2. Otwórz go i sprawdź zawartość

**Oczekiwany wynik:**
- Wszystkie wrażliwe dane powinny być `[REDACTED]`
- W produkcji plik nie powinien być tworzony

---

## ✅ Test 6: Content Security Policy

### Cel: Sprawdzić czy CSP jest ustawiony

### Test 6.1: Sprawdź nagłówki HTTP
**Kroki:**
1. Otwórz DevTools → Network
2. Odśwież stronę
3. Kliknij na pierwszy request (główny dokument HTML)
4. Sprawdź Response Headers

**Oczekiwany wynik:**
- Powinien być nagłówek: `Content-Security-Policy`
- Powinien być nagłówek: `Permissions-Policy`
- Wartości powinny zawierać odpowiednie dyrektywy

### Test 6.2: Sprawdź czy CSP działa
**Kroki:**
1. Spróbuj wstrzyknąć inline script w konsoli (nie powinno działać, ale sprawdzamy czy CSP blokuje)
2. Sprawdź czy Google Calendar API działa (powinno działać, bo jest w CSP)

**Oczekiwany wynik:**
- CSP powinien być aktywny
- Google Calendar powinien działać (jeśli jest skonfigurowany)

---

## ✅ Test 7: Integracja - wszystko razem

### Cel: Sprawdzić czy wszystkie funkcje działają razem

### Test 7.1: Pełny flow z uploadem
**Kroki:**
1. Zaloguj się
2. Utwórz kontakt z prawidłowym plikiem
3. Sprawdź czy wszystko działa

**Oczekiwany wynik:**
- Wszystko powinno działać normalnie

### Test 7.2: Sprawdź czy nie zepsuło się nic
**Kroki:**
1. Przetestuj wszystkie główne funkcje:
   - Tworzenie klienta
   - Tworzenie zadania
   - Tworzenie kontaktu
   - Edycja klienta
   - Usuwanie (jako admin)
   - Wyszukiwanie
   - Filtrowanie

**Oczekiwany wynik:**
- Wszystko powinno działać jak wcześniej

---

## 🔍 Sprawdzanie błędów

### Gdzie szukać błędów:

1. **Konsola przeglądarki (DevTools → Console)**
   - Błędy JavaScript
   - Ostrzeżenia CSP

2. **Network tab (DevTools → Network)**
   - Statusy odpowiedzi HTTP
   - Nagłówki odpowiedzi
   - Treść odpowiedzi

3. **Terminal (gdzie działa `npm run dev`)**
   - Błędy serwera
   - Logi aplikacji

4. **Logi bazy danych**
   - Sprawdź czy nie ma błędów SQL

---

## 📝 Checklist testów

- [ ] Test 1: Rate Limiting - 6 prób rejestracji
- [ ] Test 2.1: Upload - nieprawidłowy typ pliku
- [ ] Test 2.2: Upload - zbyt duży plik
- [ ] Test 2.3: Upload - zbyt wiele plików
- [ ] Test 2.4: Upload - path traversal
- [ ] Test 2.5: Upload - prawidłowe pliki
- [ ] Test 3.1: Query params - nieprawidłowy UUID
- [ ] Test 3.2: Query params - zbyt długie wyszukiwanie
- [ ] Test 3.3: Query params - nieprawidłowy status
- [ ] Test 3.4: Query params - prawidłowe parametry
- [ ] Test 4.1: Path params - nieprawidłowy UUID
- [ ] Test 4.2: Path params - prawidłowy UUID
- [ ] Test 5.1: Logi - sprawdź konsolę
- [ ] Test 5.2: Logi - sprawdź middleware
- [ ] Test 5.3: Logi - sprawdź auth-debug.log
- [ ] Test 6.1: CSP - sprawdź nagłówki
- [ ] Test 6.2: CSP - sprawdź działanie
- [ ] Test 7.1: Integracja - pełny flow
- [ ] Test 7.2: Integracja - wszystkie funkcje

---

## 🐛 Znane problemy / Uwagi

1. **Rate Limiting:** Działa w pamięci (LRU cache), więc po restarcie serwera licznik się resetuje
2. **File Upload:** Pliki są zapisywane w `public/uploads` - w produkcji warto użyć cloud storage
3. **CSP:** `unsafe-inline` i `unsafe-eval` są wymagane dla Next.js - w przyszłości można to zoptymalizować

---

## 📞 Raportowanie problemów

Jeśli znajdziesz problem:
1. Zapisz dokładne kroki reprodukcji
2. Zapisz błędy z konsoli/terminala
3. Zapisz odpowiedzi HTTP z Network tab
4. Utwórz issue w GitHub lub zgłoś problem

---

**Powodzenia w testowaniu! 🚀**

