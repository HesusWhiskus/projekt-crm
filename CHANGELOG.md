# Changelog

Wszystkie znaczące zmiany w projekcie będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

## [0.5.0-beta] - 2025-01-XX

### Dodano
- **Zarządzanie ofertami/dealami (Deals):**
  - Pełny CRUD dla deali (tworzenie, edycja, usuwanie, przeglądanie)
  - Etapy pipeline: INITIAL_CONTACT, PROPOSAL, NEGOTIATION, CLOSING, WON, LOST
  - Wartość deala z obsługą różnych walut (domyślnie PLN)
  - Prawdopodobieństwo zamknięcia (0-100%)
  - Oczekiwana data zamknięcia (expectedCloseDate)
  - Notatki do deali
  - Automatyczna aktualizacja statusu klienta na ACTIVE_CLIENT przy wygraniu deala (WON)
  - Udostępnianie deali grupom użytkowników
  - Walidacja przejść między etapami pipeline (DealPipelineService)
  - Transakcje dla operacji atomowych (np. zamknięcie deala + aktualizacja statusu klienta)
  - Logowanie aktywności (ActivityLogger) dla wszystkich operacji na dealach
  - API endpoints: `/api/deals`, `/api/deals/[id]`, `/api/deals/[id]/close`

### Zmieniono
- **Architektura:**
  - Rozszerzono architekturę DDD o nową domenę Deals
  - Dodano Value Objects: DealValue, Probability, DealStage
  - Dodano Domain Service: DealPipelineService (logika przejść między etapami)
  - Dodano Entity: Deal z metodami biznesowymi
  - Dodano Repository: IDealRepository i PrismaDealRepository z obsługą sharedGroups

### Techniczne
- Dodano model `Deal` w Prisma schema z relacjami do `Client` i `Group`
- Dodano enum `DealStage` w Prisma schema
- Utworzono migrację bazy danych dla tabeli `deals`
- Zaimplementowano pełną warstwę Domain, Application, Infrastructure i Presentation dla domeny Deals

---

## [0.4.2-beta] - 2025-01-XX

### Naprawiono
- **Usunięcie duplikacji w panelu admina:**
  - Usunięto zdublowane sekcje "Zarządzanie użytkownikami" i "Zarządzanie grupami"
  - Pozostały tylko estetyczne karty statystyk na górze z bezpośrednimi linkami
- **Logo adaptujące się do stylu:**
  - Dodano filtry CSS dla poprawnej adaptacji logo w light/dark mode
  - Light mode: logo czarne (brightness(0))
  - Dark mode: logo białe (brightness(0) invert(1))
  - Zastosowano klasę `.logo-theme-adapt` w komponentach nawigacji i autoryzacji
- **Blokada przycisku logowania:**
  - Przycisk pozostaje zablokowany aż do momentu przekierowania
  - `setIsLoading(false)` wywoływane tylko przy błędzie, nie przy sukcesie
  - Zapobiega wielokrotnym kliknięciom podczas logowania
- **Poprawa selektora daty/czasu:**
  - Wrócono do `datetime-local` z `step="60"` dla lepszej precyzji
  - Uproszczono komponent `DateTimePicker`
  - Lepsze UX niż poprzednie rozwiązanie z oddzielnymi selektorami
- **Naprawa stref czasowych:**
  - Dodano funkcję `utcDateToLocalDateTime()` do konwersji dat z bazy (UTC) na lokalną strefę czasową przeglądarki
  - Zastosowano w `ContactForm`, `TaskForm`, `ClientForm`
  - `datetime-local` używa strefy czasowej przeglądarki, więc konwersja jest spójna
  - Naprawiono problem z wyświetlaniem czasu (różnica 1h między wybranym a zapisanym)

### Zmieniono
- **Komponent DateTimePicker:**
  - Uproszczono do prostego wrappera dla `datetime-local`
  - Dodano `step="60"` dla lepszej precyzji wyboru minut
- **Konwersja dat:**
  - Wszystkie formularze używają `utcDateToLocalDateTime()` do wyświetlania dat z bazy
  - Zapewnia spójność między strefą czasową przeglądarki a wyświetlanymi datami

---

## [0.4.1-beta] - 2025-01-XX

### Naprawiono
- **Zablokowanie wielokrotnego kliknięcia przycisku logowania:**
  - Dodano sprawdzenie `isLoading` przed rozpoczęciem logowania
  - Przycisk jest wyłączony podczas procesu logowania
  - Zablokowano wielokrotne requesty podczas logowania
- **Usunięcie duplikacji w panelu admina:**
  - Usunięto zdublowane karty "Zarządzanie użytkownikami" i "Zarządzanie grupami"
  - Karty statystyk są teraz klikalne i prowadzą bezpośrednio do odpowiednich sekcji
- **Wyróżnik dla zadań niewykonanych w terminie:**
  - Dodano wizualne oznaczenie w liście zadań (czerwony border, tło, badge "Przeterminowane")
  - Dodano wyróżnik w kalendarzu (czerwone tło, ikona AlertCircle)
  - Zadania przeterminowane są wyraźnie widoczne w interfejsie
- **Logo adaptujące się do stylu:**
  - Dodano filtry CSS `dark:brightness-0 dark:invert` dla logo
  - Logo automatycznie dostosowuje się do dark/light mode
  - Zastosowano w `dashboard-nav.tsx` i `auth-header.tsx`
- **Poprawa selektora daty/czasu:**
  - Utworzono komponent `DateTimePicker` z precyzyjnym wyborem godzin i minut
  - Zastąpiono `datetime-local` w formularzach kontaktów, zadań i klientów
  - Minuty wybierane co 5 minut dla łatwiejszego wyboru
  - Lepsza precyzja wyboru czasu niż w standardowym `datetime-local`

### Dodano
- **Obsługa strefy czasowej:**
  - Dodano pole `timezone` do `UserPreferences` w bazie danych
  - Utworzono helper `src/lib/timezone.ts` z funkcjami formatowania dat
  - Dodano selektor strefy czasowej w ustawieniach preferencji
  - Wykrywanie domyślnej strefy czasowej przeglądarki
  - Lista 30 najpopularniejszych stref czasowych
  - Funkcje `formatDateInTimezone` i `formatDateTimeInTimezone` do formatowania dat

### Zmieniono
- **Komponenty formularzy:**
  - `ContactForm` - używa `DateTimePicker` zamiast `datetime-local`
  - `TaskForm` - używa `DateTimePicker` zamiast `datetime-local`
  - `ClientForm` - używa `DateTimePicker` zamiast `datetime-local`
- **API preferences:**
  - Dodano obsługę pola `timezone` w endpoint `/api/users/preferences`
  - Walidacja strefy czasowej w schemacie Zod

### Uwagi techniczne
- **Migracja bazy danych:** Wymagana migracja Prisma dla dodania pola `timezone` do `UserPreferences`
- **Formatowanie dat:** Funkcje formatowania dat z uwzględnieniem strefy czasowej są dostępne w `src/lib/timezone.ts`
- **Kompatybilność wsteczna:** Wszystkie zmiany są kompatybilne wstecz - istniejące funkcjonalności działają tak samo

---

## [0.4.0-beta] - 2025-01-XX

### Zmieniono
- **REFACTORING: Wprowadzono architekturę Domain-Driven Design (DDD) i Single Responsibility Principle (SRP)**
  - Projekt został zrefaktoryzowany zgodnie z zasadami DDD i SRP
  - Wprowadzono warstwową architekturę z wyraźnym podziałem odpowiedzialności
  - Każda klasa ma teraz jedną odpowiedzialność zgodnie z SRP

### Dodano
- **Warstwa domenowa (`src/domain/`):**
  - Value Objects dla Client (Email, Phone, Website, ClientName, AgencyName) z walidacją
  - Client Entity z metodami biznesowymi (changeStatus, updatePriority, assignTo)
  - Contact Entity i Task Entity z logiką biznesową
  - ClientStatusChangeService - Domain Service do obsługi zmian statusu z historią
  - Interfejsy repozytoriów (IClientRepository, IContactRepository, ITaskRepository)
- **Warstwa aplikacyjna (`src/application/`):**
  - Use Cases dla Client (CreateClient, UpdateClient, DeleteClient, GetClient, ListClients)
  - DTO (Data Transfer Objects) dla komunikacji między warstwami
  - UserContext dla autoryzacji
- **Warstwa infrastruktury (`src/infrastructure/`):**
  - Implementacje repozytoriów Prisma (PrismaClientRepository, PrismaContactRepository, PrismaTaskRepository)
  - ActivityLogger jako centralizowany serwis logowania
- **Warstwa prezentacji (`src/presentation/api/`):**
  - Refaktoryzowane API routes z middleware autoryzacji
  - Uproszczone route handlers delegujące do Use Cases

### Zmieniono
- **API routes dla Client:**
  - Teraz używają Use Cases zamiast bezpośredniego dostępu do bazy danych
  - Walidacja danych przeniesiona do Value Objects
  - Logika biznesowa enkapsulowana w Entities
- **Walidacja danych:**
  - Przeniesiona do Value Objects z pełną enkapsulacją logiki biznesowej
  - Value Objects są immutable i zawierają walidację
- **Separacja odpowiedzialności:**
  - Każda klasa ma jedną odpowiedzialność zgodnie z SRP
  - Route handlers tylko obsługują HTTP, nie zawierają logiki biznesowej
- **Testowalność:**
  - Logika biznesowa może być testowana niezależnie od infrastruktury
  - Każda warstwa może być testowana osobno

### Dokumentacja
- Zaktualizowano `README.md` - dodano informację o architekturze DDD
- Zaktualizowano `API_DOCUMENTATION.md` - dodano sekcję o architekturze API
- Utworzono `ROLLBACK_PLAN.md` - plan rollbacku w przypadku problemów
- Zaktualizowano `CHANGELOG.md` - dodano wpis o refaktoryzacji

### Uwagi techniczne
- **Kompatybilność wsteczna:** API interface pozostaje niezmieniony - wszystkie endpointy działają tak samo
- **Baza danych:** Nie wymaga zmian - schemat Prisma nie został zmieniony
- **Frontend:** Nie wymaga zmian - API interface się nie zmienił
- **Rollback:** Możliwy poprzez przywrócenie starych plików API routes (zobacz `ROLLBACK_PLAN.md`)

---

## [0.3.1-beta] - 2025-11-07

### Naprawiono
- Równość priorytetów w kolumnie - wszystkie priorytety mają jednakową szerokość (min-w-[100px])
- Widoczność wszystkich pól w ustawieniach w trybie ciemnym - zastąpiono wszystkie hardcoded kolory (`bg-gray-*`, `text-gray-*`) zmiennymi CSS (`bg-muted`, `text-foreground`, `text-muted-foreground`)
- Czytelność formularzy w trybie ciemnym - wszystkie pola input są teraz widoczne
- Formatowanie logo - naprawiono logikę skalowania: teraz wszystkie obrazy (PNG, JPG, SVG, kwadratowe, prostokątne) są zawsze formatowane do prostokąta 224x64px z wypełnieniem całego pola (cover style - obraz wypełnia całe pole, nadmiar jest przycinany)

### Dodano
- Automatyczna konwersja i skalowanie logo:
  - Preferowany rozmiar: 224x64px (proporcje 3.5:1)
  - Automatyczne przeskalowanie do maksymalnych wymiarów z zachowaniem proporcji
  - Automatyczna konwersja do formatu PNG dla najlepszej jakości
  - Informacja o preferowanym rozmiarze w formularzu

### Zmieniono
- Zwiększono limit rozmiaru pliku logo z 2MB do 5MB (przed konwersją)
- Wszystkie komponenty używają teraz zmiennych CSS zamiast hardcoded kolorów dla lepszej obsługi dark mode

---

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

