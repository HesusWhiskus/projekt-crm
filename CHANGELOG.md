# Changelog

Wszystkie znaczące zmiany w projekcie będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

## [0.1.0-beta] - 2024-12-XX

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
- Walidacja UUID w ścieżkach API
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

