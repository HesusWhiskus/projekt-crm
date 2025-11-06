# Changelog

Wszystkie znaczące zmiany w projekcie będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

## [0.3.0-beta] - 2025-11-07

### Dodano
- **Tryb jasny/ciemny:**
  - Pełna obsługa dark mode w całej aplikacji
  - Przełącznik trybu w ustawieniach preferencji
  - Automatyczne zapisywanie wyboru użytkownika
  - Wsparcie dla wszystkich komponentów (tabele, karty, nawigacja, formularze)
- **Kolumna priorytetu w liście klientów:**
  - Wyświetlanie priorytetu obok statusu
  - Kolorowe oznaczenia: Niski (niebieski), Średni (żółty), Wysoki (czerwony)
  - Sortowanie po priorytecie
- **Kolorowe oznaczenia statusów:**
  - Nowy lead - niebieski
  - W kontakcie - żółty
  - Demo wysłane - fioletowy
  - Negocjacje - pomarańczowy
  - Klient aktywny - zielony
  - Utracony - czerwony

### Zmieniono
- **Optymalizacja tabeli klientów:**
  - Zmniejszona szerokość kolumny "Telefon" (w-24)
  - Zmniejszona szerokość kolumny "Status" (w-28)
  - Dodana kolumna "Priorytet" (w-24)
  - Wszystkie statusy mają jednakową szerokość (min-w-[120px])
- **Przełącznik trybu jasny/ciemny:**
  - Zastąpiono listę rozwijaną przyciskami toggle
  - Lepsze UX z natychmiastową wizualną informacją zwrotną
- **Kolory statusów i priorytetów:**
  - Dodano wsparcie dla dark mode (ciemniejsze tła w trybie ciemnym)

### Naprawiono
- Równość statusów w kolumnie - wszystkie statusy mają jednakową szerokość niezależnie od długości tekstu
- Czytelność zakładek nawigacji w trybie ciemnym
- Czytelność nazwy użytkownika i stanowiska w trybie ciemnym
- Tabela klientów działa poprawnie w trybie ciemnym (wszystkie elementy są widoczne)
- Status zadań jest widoczny w trybie ciemnym
- Wszystkie komponenty używają zmiennych CSS zamiast hardcoded kolorów

---

## [0.2.0-beta] - 2025-11-06

### Dodano
- **Funkcje prospecting dla zarządzania leadami:**
  - Pole `priority` (LOW, MEDIUM, HIGH) dla klientów - priorytetyzacja leadów
  - Pole `lastContactAt` - automatycznie aktualizowana data ostatniego kontaktu
  - Pole `nextFollowUpAt` - data następnego follow-up (ustawiana ręcznie)
  - Flaga `isNote` w Contact - rozróżnienie notatek od kontaktów
  - Automatyczna aktualizacja `lastContactAt` przy tworzeniu kontaktu (nie notatki)
- **Nowe filtry prospecting:**
  - `noContactDays` - filtry klientów bez kontaktu przez X dni
  - `followUpToday` - filtry klientów z follow-up dzisiaj
- **Sekcja "Zarządzanie leadami" na Dashboard:**
  - Szybkie filtry: Bez kontaktu 7+ dni, Bez kontaktu 30+ dni, Follow-up dzisiaj
  - Linki do przefiltrowanych widoków klientów
- **Rozszerzenie ClientDetail:**
  - Wyświetlanie nowych pól: priority, lastContactAt, nextFollowUpAt
  - Filtrowanie kontaktów na "Kontakty" i "Notatki"
  - Wizualne rozróżnienie notatek od kontaktów
- **Rozszerzenie ContactForm:**
  - Checkbox `isNote` - możliwość tworzenia notatek zamiast kontaktów
  - Ukrywanie pola "Typ kontaktu" dla notatek (pole opcjonalne)
- **Dokumentacja:**
  - Utworzono `FEATURES.md` - szczegółowa dokumentacja funkcjonalności
  - Zaktualizowano `API_DOCUMENTATION.md` - nowe pola i filtry
  - Zaktualizowano `CHANGELOG.md`

### Zmieniono
- Pole `type` w Contact jest teraz opcjonalne (dla notatek)
- Migracja bazy danych - dodano nowe pola do Client i Contact
- ClientForm - dodano pola priority i nextFollowUpAt
- Contact API - automatyczna aktualizacja lastContactAt w transakcji Prisma

### Naprawiono
- **KRYTYCZNA NAPRAWA:** Usunięto błędną walidację UUID dla path parameters - system używa CUID (Collision-resistant Unique Identifier), nie UUID
- Naprawiono błąd "Nieprawidłowy format ID" przy edycji zadań, klientów i kontaktów
- Naprawiono zapamiętywanie wybranego klienta przy edycji kontaktu
- Naprawiono błędy builda na Railway (usunięto pustą migrację, poprawiono Dockerfile)
- Usunięto nieprawidłową opcję `telemetry` z next.config.js

---

## [0.1.4-beta] - 2025-11-06

### Naprawiono
- **KRYTYCZNA NAPRAWA:** Usunięto błędną walidację UUID dla path parameters - system używa CUID (Collision-resistant Unique Identifier), nie UUID
- Naprawiono błąd "Nieprawidłowy format ID" przy edycji zadań, klientów i kontaktów
- Naprawiono zapamiętywanie wybranego klienta przy edycji kontaktu
- Zaktualizowano dokumentację API - dodano informację o formacie CUID

### Zmieniono
- Walidacja ID w path parameters zmieniona z UUID na prostą walidację niepustego stringa (CUID format)
- Zaktualizowano dokumentację techniczną - wszystkie ID są w formacie CUID

---

## [0.1.0-beta] - 2025-11-06

### Dodano
- System wersjonowania aplikacji
- Komponent "Co nowego" z changelogiem
- Integracja z Google Calendar API
- Synchronizacja zadań z Google Calendar
- System zarządzania klientami (CRUD)
- System zarządzania kontaktami (CRUD)
- System zarządzania zadaniami (CRUD)
- Kalendarz zadań z możliwością klikania
- System grup użytkowników
- Panel administracyjny
- System ustawień użytkownika
- Import/Export danych (CSV, Excel)
- Walidacja pól formularzy
- Rate limiting dla API
- Walidacja uploadów plików
- Content Security Policy (CSP)
- Walidacja siły hasła
- Sanityzacja logów

### Zmieniono
- Zaktualizowano limity znaków pól zgodnie ze standardami branżowymi:
  - Telefon: 50 → 30 znaków
  - Imię/Nazwisko: 100 → 50 znaków
  - Nazwa agencji: 200 → 150 znaków
  - Źródło: 200 → 100 znaków
  - Tytuł zadania: 200 → 150 znaków
  - Website/URL: 500 → 2048 znaków
  - Opis zadania: 2000 → 5000 znaków
  - Notatki kontaktu: 5000 → 10000 znaków

### Zabezpieczenia
- Rate limiting dla endpointów autoryzacji
- Walidacja i sanityzacja uploadów plików
- Walidacja parametrów zapytań (query parameters)
- Walidacja ID w ścieżkach API (CUID format)
- Content Security Policy headers
- Walidacja siły hasła (min. 8 znaków, wielkie/małe litery, cyfry)
- Redukcja czasu życia sesji z 8h do 4h
- Sanityzacja danych wrażliwych w logach

---

## Logika wersjonowania

- **0.xy** - gdzie:
  - **x** zmienia się przy dużych zmianach (nowe funkcjonalności, nie tylko poprawki błędów)
  - **y** zmienia się przy każdym pushu (naprawy błędów, drobne zmiany, usterki)

Przykłady:
- `0.1.0` → `0.1.1` - naprawa błędu
- `0.1.1` → `0.1.2` - drobna zmiana
- `0.1.9` → `0.2.0` - dodanie nowej funkcjonalności

