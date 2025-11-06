# Funkcjonalności systemu - Internal CRM

## 📋 Przegląd

Internal CRM to system do zarządzania relacjami z agencjami ubezpieczeniowymi. System umożliwia zarządzanie klientami, kontaktami, zadaniami oraz integrację z Google Calendar.

## ✅ Zaimplementowane funkcjonalności

### 1. Zarządzanie klientami (Clients)

- **CRUD operacje** - tworzenie, edycja, usuwanie, przeglądanie klientów
- **Statusy klientów:**
  - NEW_LEAD - Nowy lead
  - IN_CONTACT - W kontakcie
  - DEMO_SENT - Demo wysłane
  - NEGOTIATION - Negocjacje
  - ACTIVE_CLIENT - Klient aktywny
  - LOST - Utracony
- **Priorytety klientów:**
  - LOW - Niski
  - MEDIUM - Średni
  - HIGH - Wysoki
- **Pola klienta:**
  - Podstawowe dane: imię, nazwisko, nazwa agencji
  - Dane kontaktowe: email, telefon, strona WWW, adres
  - Źródło leada (source)
  - Status i priorytet
  - Przypisanie do użytkownika
  - **Ostatni kontakt** (`lastContactAt`) - automatycznie aktualizowane
  - **Następny follow-up** (`nextFollowUpAt`) - ustawiane ręcznie
- **Filtrowanie:**
  - Po statusie
  - Po przypisaniu (assignedTo)
  - Wyszukiwanie po nazwie/emailu
  - **Bez kontaktu przez X dni** (`noContactDays`)
  - **Follow-up dzisiaj** (`followUpToday`)
- **Historia zmian statusu** - śledzenie zmian statusu klienta
- **Udostępnianie grupom** - możliwość udostępnienia klienta grupie użytkowników

### 2. Zarządzanie kontaktami (Contacts)

- **CRUD operacje** - tworzenie, edycja, usuwanie, przeglądanie kontaktów
- **Typy kontaktów:**
  - PHONE_CALL - Rozmowa telefoniczna
  - MEETING - Spotkanie
  - EMAIL - E-mail
  - LINKEDIN_MESSAGE - Wiadomość LinkedIn
  - OTHER - Inne
- **Notatki vs Kontakty:**
  - **Kontakty** (`isNote=false`) - faktyczne interakcje z klientem
    - Wymagają typu kontaktu
    - Automatycznie aktualizują `lastContactAt` klienta
  - **Notatki** (`isNote=true`) - wewnętrzne notatki
    - Nie wymagają typu kontaktu (pole `type` jest opcjonalne)
    - Nie aktualizują `lastContactAt`
- **Pola kontaktu:**
  - Typ kontaktu (opcjonalne dla notatek)
  - Data kontaktu
  - Notatki/treść
  - Flaga isNote (kontakt vs notatka)
  - Użytkownik, który utworzył kontakt
  - Załączniki (attachments)
- **Filtrowanie:**
  - Po typie kontaktu
  - Po kliencie
  - Po użytkowniku
- **Automatyczna aktualizacja** - przy tworzeniu kontaktu (nie notatki) automatycznie aktualizuje `lastContactAt` klienta

### 3. Zarządzanie zadaniami (Tasks)

- **CRUD operacje** - tworzenie, edycja, usuwanie, przeglądanie zadań
- **Statusy zadań:**
  - TODO - Do zrobienia
  - IN_PROGRESS - W trakcie
  - COMPLETED - Zakończone
- **Pola zadania:**
  - Tytuł
  - Opis
  - Termin (dueDate)
  - Status
  - Przypisanie do użytkownika
  - Opcjonalne powiązanie z klientem
- **Integracja z Google Calendar:**
  - Synchronizacja zadań z kalendarzem Google
  - Automatyczne tworzenie wydarzeń w kalendarzu

### 4. Dashboard

- **Statystyki:**
  - Liczba klientów
  - Liczba kontaktów
  - Liczba zadań
- **Zarządzanie leadami (Prospecting):**
  - **Bez kontaktu 7+ dni** - szybki link do klientów bez kontaktu przez 7 dni
  - **Bez kontaktu 30+ dni** - szybki link do klientów bez kontaktu przez 30 dni
  - **Follow-up dzisiaj** - szybki link do klientów z follow-up dzisiaj
- **Nadchodzące zadania** - lista zadań przypisanych do użytkownika

### 5. Zarządzanie użytkownikami

- **Role:**
  - ADMIN - Administrator (pełny dostęp)
  - USER - Użytkownik (ograniczony dostęp)
- **Funkcje:**
  - Tworzenie kont użytkowników
  - Przypisywanie ról
  - Zarządzanie grupami użytkowników
  - Import użytkowników z pliku Excel/CSV

### 6. Grupy użytkowników

- Tworzenie grup
- Przypisywanie użytkowników do grup
- Udostępnianie klientów, kontaktów i zadań grupom
- Współdzielony dostęp do zasobów

### 7. Autoryzacja i bezpieczeństwo

- **NextAuth.js** - system autoryzacji
- **Google OAuth** - opcjonalne logowanie przez Google
- **Sesje** - zarządzanie sesjami użytkowników
- **Rate limiting** - ograniczenie liczby żądań
- **Walidacja danych** - walidacja wszystkich danych wejściowych
- **Content Security Policy** - zabezpieczenia przed XSS

### 8. Import/Export

- **Import z Excel/CSV:**
  - Import klientów
  - Import kontaktów
  - Import użytkowników
- **Export do Excel/CSV:**
  - Export klientów
  - Export kontaktów

### 9. Ustawienia użytkownika

- **Profil:**
  - Edycja danych użytkownika
  - Zmiana hasła
- **Preferencje:**
  - Motyw (light/dark)
  - Język (pl/en)
  - Schemat kolorów
  - Powiadomienia email

### 10. Ustawienia systemu (Admin)

- **Branding:**
  - Nazwa systemu
  - Logo systemu
- **Ustawienia administracyjne:**
  - Konfiguracja systemu
  - Zarządzanie użytkownikami i grupami

## ❌ Funkcjonalności NIE zaimplementowane (na razie)

### 1. Email log
- Brak automatycznego logowania emaili
- Możliwość dodania w przyszłości

### 2. Deal value
- Brak pola wartości transakcji
- Priorytet (LOW/MEDIUM/HIGH) służy do priorytetyzacji

### 3. Automatyczne przypomnienia
- Brak automatycznych przypomnień email
- Możliwość dodania w przyszłości

### 4. Raporty i analityka
- Brak zaawansowanych raportów
- Możliwość dodania w przyszłości

### 5. Integracja z innymi systemami
- Brak integracji z innymi CRM
- Możliwość dodania w przyszłości

## 🔄 Automatyzacje

### Automatyczna aktualizacja lastContactAt
- Przy tworzeniu kontaktu (`isNote=false`), system automatycznie aktualizuje pole `lastContactAt` klienta na datę kontaktu
- Używa transakcji Prisma dla bezpieczeństwa danych
- Notatki (`isNote=true`) nie aktualizują `lastContactAt`

## 📊 Filtry prospecting

### Filtry dostępne w API:
- `noContactDays` - klienci bez kontaktu przez X dni (lub nigdy)
- `followUpToday` - klienci z follow-up dzisiaj

### Szybkie filtry na Dashboard:
- Bez kontaktu 7+ dni
- Bez kontaktu 30+ dni
- Follow-up dzisiaj

## 🎯 Przypadki użycia

### Prospecting workflow:
1. **Nowy lead** - utworzenie klienta ze statusem NEW_LEAD
2. **Kontakt** - dodanie kontaktu (nie notatki) z klientem
3. **Automatyczna aktualizacja** - system automatycznie aktualizuje `lastContactAt`
4. **Follow-up** - ustawienie `nextFollowUpAt` dla następnego kontaktu
5. **Priorytetyzacja** - ustawienie priorytetu (LOW/MEDIUM/HIGH)
6. **Filtrowanie** - użycie szybkich filtrów na dashboardzie do znalezienia klientów wymagających kontaktu

### Notatki vs Kontakty:
- **Kontakty** - faktyczne interakcje (telefon, email, spotkanie) - aktualizują `lastContactAt`
- **Notatki** - wewnętrzne notatki, uwagi, informacje - nie aktualizują `lastContactAt`

## 📝 Uwagi techniczne

- System używa **CUID** (nie UUID) dla wszystkich identyfikatorów
- Wszystkie nowe pola prospecting są **nullable** (opcjonalne)
- Migracja bazy danych jest **bezpieczna** - nie powoduje utraty danych
- Kompatybilność wsteczna jest zachowana - stare rekordy mają `null` dla nowych pól

