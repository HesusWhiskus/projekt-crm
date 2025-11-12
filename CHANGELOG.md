# Changelog

Wszystkie znaczące zmiany w projekcie będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

## [0.5.3-beta] - 2025-01-16

### Naprawiono
- **Krytyczny błąd builda - brak kolumny companyName w bazie danych:**
  - Usunięto wszystkie odwołania do `companyName` z select/include w zapytaniach Prisma
  - Usunięto `companyName` z typów TypeScript w komponentach (tasks, contacts, clients)
  - Zaktualizowano kod wyświetlania - używa teraz tylko `firstName` i `lastName` dla wszystkich typów klientów
  - Usunięto kolumnę "Agencja" z tabeli klientów (sortowanie po companyName)
  - Aplikacja może teraz działać bez kolumny `companyName` w bazie danych

### Uwagi techniczne
- **Backward compatibility:** Kod działa z bazą danych bez kolumny `companyName`
- **Wyświetlanie:** Wszystkie klienci (PERSON i COMPANY) wyświetlani są używając `firstName` i `lastName`
- **Migracja:** Po uruchomieniu migracji kolumna `companyName` zostanie dodana, ale nie jest wymagana do działania aplikacji

---

## [0.5.2-beta] - 2025-01-16

### Naprawiono
- **Krytyczny problem z buildem w Railway:**
  - Usunięto migracje z procesu build - build nie wymaga już połączenia z bazą danych
  - Migracje są teraz uruchamiane wyłącznie przy starcie aplikacji (przed uruchomieniem serwera)
  - Prisma Client jest generowany bez połączenia z bazą - build jest szybszy i bardziej niezawodny
  - Zaktualizowano `src/lib/db.ts` z komentarzami wyjaśniającymi, że Prisma Client nie łączy się podczas inicjalizacji
  - Zaktualizowano dokumentację w RAILWAY_QUICK_START.md z nowym podejściem

### Uwagi techniczne
- **Build:** Build nie wymaga połączenia z bazą danych - Prisma Client jest generowany bez DATABASE_URL
- **Migracje:** Migracje są uruchamiane automatycznie przy starcie aplikacji, nie podczas build
- **Bezpieczeństwo:** Aplikacja nie uruchomi się, jeśli migracje się nie powiodą - zapewnia to spójność bazy danych
- **Wydajność:** Build jest szybszy, ponieważ nie czeka na połączenie z bazą danych

---

## [0.5.1-beta] - 2025-01-16

### Naprawiono
- **Krytyczny problem z migracjami bazy danych w Railway:**
  - Migracje są teraz uruchamiane automatycznie przed buildem (jeśli DATABASE_URL jest dostępna)
  - Migracje są uruchamiane obowiązkowo przy starcie aplikacji przed uruchomieniem serwera
  - Aplikacja nie uruchomi się, jeśli migracje się nie powiodą - zapewnia to spójność bazy danych
  - Usunięto `preDeployCommand` z `railway.json` (nie działał poprawnie)
  - Zaktualizowano Dockerfile z lepszymi komunikatami o statusie migracji
  - Zaktualizowano dokumentację w RAILWAY_QUICK_START.md z informacjami o automatycznych migracjach

### Uwagi techniczne
- **Migracje:** Migracje są teraz uruchamiane automatycznie - nie wymagają ręcznego uruchomienia w terminalu Railway
- **Build:** Jeśli DATABASE_URL nie jest dostępna podczas build, migracje będą uruchomione przy starcie aplikacji
- **Bezpieczeństwo:** Aplikacja nie uruchomi się, jeśli migracje się nie powiodą - to zapobiega problemom z niezsynchronizowaną bazą danych

---

## [0.5.0-beta] - 2025-01-15

### Dodano
- **Zabezpieczenie API:**
  - Rate limiting na wszystkich endpointach API (auth: 5/15min, api: 60/min, general: 100/min)
  - Centralizowane logowanie aktywności API z metadanymi (IP, user-agent, metoda, ścieżka)
  - Helper `api-security.ts` z funkcjami do rate limitingu i logowania
  - Logowanie nieautoryzowanych prób dostępu
- **Responsywność mobilna:**
  - Hook `useMediaQuery` do wykrywania rozdzielczości ekranu
  - Tabele klientów przekształcone w karty na urządzeniach mobilnych
  - Hamburger menu w nawigacji dla urządzeń mobilnych
  - Zwiększone rozmiary przycisków na mobile (min 44x44px)
- **Wersje Basic/Pro:**
  - Model `Organization` z planem (BASIC/PRO)
  - Model `FeatureFlag` dla konfiguracji funkcji per-organizacja
  - System feature flags (`src/lib/feature-flags.ts`)
  - Middleware do sprawdzania funkcji (`requireFeature`, `checkFeature`)
  - Rozszerzenie modeli `User` i `Client` o relację z organizacją
- **Typ klienta (PERSON/COMPANY):**
  - Enum `ClientType` (PERSON, COMPANY)
  - Zmiana modelu `Client` - usunięto `agencyName`, dodano `companyName` i `taxId`
  - Warunkowe pola w `ClientForm` w zależności od typu klienta
- **Integracje zewnętrzne (Pro):**
  - Model `IntegrationTab` dla dynamicznych zakładek integracji
  - Endpoint `/api/integrations/webhook` dla zewnętrznych danych
  - Endpoint `/api/clients/[id]/integration-tabs` do pobierania zakładek
  - Komponent `IntegrationTabs` do wyświetlania zakładek w ClientDetail
- **Rozproszona baza danych:**
  - Cache Manager z IndexedDB (`src/lib/cache-manager.ts`)
  - Endpoint `/api/sync` do synchronizacji danych
  - Service Worker (`public/sw.js`) dla offline functionality
  - Kolejka synchronizacji dla operacji offline

### Zmieniono
- **Model Client:**
  - `firstName` i `lastName` są teraz opcjonalne (dla typu COMPANY)
  - Dodano `companyName` i `taxId` dla typu COMPANY
  - Usunięto `agencyName` (zastąpione przez `companyName` dla firm)
  - Dodano pole `type` z domyślną wartością `PERSON`
- **ClientForm:**
  - Warunkowe wyświetlanie pól w zależności od typu klienta
  - Dla PERSON: `firstName`, `lastName` (wymagane)
  - Dla COMPANY: `companyName` (wymagane), `taxId` (opcjonalne)

### Uwagi techniczne
- **Migracja bazy danych wymagana:** Nowe modele `Organization`, `FeatureFlag`, `IntegrationTab` oraz zmiany w modelu `Client`
- **Feature flags:** Funkcje Pro są domyślnie wyłączone dla planu BASIC
- **Offline support:** Service Worker i IndexedDB cache wymagają HTTPS w produkcji
- **Backward compatibility:** Istniejące klienty będą miały typ `PERSON` domyślnie

---

## [0.4.5-beta] - 2025-01-15

### Zmieniono
- **REFACTOR: Rozdzielenie notatek od kontaktów:**
  - Utworzono osobny endpoint `/api/notes` dla notatek (zamiast `/api/contacts` z flagą `isNote`)
  - Utworzono osobny komponent `NoteForm` dla notatek (zamiast `ContactForm` z checkboxem)
  - Notatki mają teraz własną, dedykowaną funkcjonalność bez mieszania z kontaktami
  - Uproszczony interfejs - brak pola "Typ kontaktu" i checkboxa "To jest notatka"

### Dodano
- **Nowy endpoint `/api/notes`:**
  - POST `/api/notes` - tworzy nową notatkę
  - Zawsze ustawia `isNote: true` i `type: null`
  - Nie aktualizuje `lastContactAt` klienta
  - Prostszy schemat walidacji (bez pola `type`)
- **Nowy komponent `NoteForm`:**
  - Dedykowany formularz dla notatek
  - Wymaga `clientId` (zawsze przypisane do klienta)
  - Uproszczony interfejs użytkownika

### Naprawiono
- **Krytyczny bug z dodawaniem notatek:**
  - Problem z zapisywaniem notatek został rozwiązany poprzez refaktor
  - Notatki mają teraz własny endpoint i komponent, co eliminuje problemy z `clientId`
  - Lepsze rozdzielenie odpowiedzialności - notatki i kontakty to osobne funkcjonalności

### Uwagi techniczne
- **Backward compatibility:** Endpoint `/api/contacts` nadal działa dla kontaktów, ale dla notatek zalecane jest użycie `/api/notes`
- **Migracja:** Nie wymagana - notatki nadal są przechowywane w tabeli `Contact` z flagą `isNote=true`
- **API:** Nowy endpoint `/api/notes` jest dostępny i w pełni funkcjonalny

---

## [0.4.4-beta] - 2025-01-15

### Naprawiono
- **Krytyczny bug z dodawaniem notatek:**
  - Naprawiono problem z zapisywaniem notatek - błąd "kontakt nie znaleziony"
  - Poprawiono inicjalizację `clientId` w `ContactForm` - teraz zawsze używa `clientId` z props gdy `contact.clientId` nie jest dostępne
  - Dodano walidację `clientId` przed wysłaniem formularza - zapobiega wysyłaniu pustego `clientId`
  - Notatki można teraz poprawnie dodawać z widoku klienta bez konieczności wybierania kontaktu

### Zmieniono
- **ContactForm:**
  - Uproszczono logikę inicjalizacji `clientId` w `formData` - używa `contact?.clientId || clientId || ""`
  - Dodano walidację `finalClientId` w `handleSubmit` przed wysłaniem do API
  - Lepsze obsługiwanie przypadku gdy notatka jest dodawana z widoku klienta

---

## [0.4.3-beta] - 2025-11-10

### Dodano
- **Optymalizacje wydajności:**
  - Naprawiono problem N+1 queries w `ListClientsUseCase` - relacje pobierane w jednym zapytaniu
  - Dodano indeksy do bazy danych dla modeli Client, Task, Contact (assignedTo, status, dates, composite indexes)
  - Implementacja cache dla users i groups z automatyczną invalidation
  - Optymalizacja `GetClientUseCase` - usunięto niepotrzebne include (contacts/tasks/statusHistory nie używane w DTO)
  - Cache revalidates co 60 sekund w dev, 300 sekund w produkcji

### Zmieniono
- **PrismaClientRepository:**
  - Dodano metodę `findManyWithRelations()` dla optymalnego pobierania klientów z relacjami
  - Dodano metodę `findByIdWithRelations()` dla optymalnego pobierania klienta z relacjami
  - `findMany()` i `findById()` teraz obsługują include z options
- **ListClientsUseCase:**
  - Używa `findManyWithRelations()` zamiast wykonywać dodatkowe zapytania dla każdego klienta
  - Eliminacja N+1 queries - wszystkie relacje pobierane w jednym zapytaniu
- **GetClientUseCase:**
  - Używa `findByIdWithRelations()` zamiast wykonywać dodatkowe zapytania
  - Usunięto niepotrzebne include (contacts, tasks, statusHistory) - nie są zwracane w DTO
- **Server Components (page.tsx):**
  - Wszystkie page.tsx używają `getCachedUsers()` i `getCachedGroups()` zamiast bezpośrednich zapytań
  - Cache automatycznie invalidowany przy modyfikacji users/groups przez API routes

### Naprawiono
- **N+1 queries:**
  - ListClientsUseCase wykonywał dodatkowe zapytania dla każdego klienta mimo że dane były już w include
  - GetClientUseCase wykonywał dodatkowe zapytania dla assignee i sharedGroups mimo że były w include
  - Wszystkie relacje teraz pobierane w jednym zapytaniu

### Uwagi techniczne
- **Migracja bazy danych:** Wymagana migracja Prisma dla dodania indeksów (`npx prisma migrate dev --name add_performance_indexes`)
- **Cache:** Next.js `unstable_cache` z tagami dla invalidation. Cache invalidowany automatycznie przy modyfikacji users/groups
- **Backward compatibility:** Wszystkie zmiany są backward compatible - format odpowiedzi API pozostaje bez zmian

---

## [0.4.2-beta] - 2025-11-10

### Dodano
- **Dokumentacja Swagger/OpenAPI:**
  - Interaktywna dokumentacja API dostępna pod `/api-docs` (wymaga zalogowania)
  - Automatyczne generowanie specyfikacji OpenAPI z JSDoc komentarzy
  - Endpoint `/api/swagger.json` zwracający pełną specyfikację OpenAPI 3.0
  - Dokumentacja wszystkich endpointów z opisami, parametrami, schematami request/response
  - Skrypt weryfikacji dokumentacji: `npm run swagger:verify`
  - Schematy dla Client, Contact, Task, Error
  - Zabezpieczenie Swagger UI autoryzacją (tylko zalogowani użytkownicy)
- **Model ról i permissions:**
  - Zaprojektowano model z 4 rolami: ADMIN, MANAGER, USER, VIEWER
  - Zdefiniowano listę permissions dla każdej roli
  - Utworzono dokumentację `ROLES_PERMISSIONS_MODEL.md` z pełnym opisem modelu
  - Propozycja schema Prisma dla przyszłej implementacji (`prisma/schema-roles-permissions.prisma`)
  - Model wspiera many-to-many relacje między rolami a permissions
  - Możliwość przypisania override permissions bezpośrednio do użytkownika
- **Analiza integracji Auth0:**
  - Utworzono dokument `AUTH0_ANALYSIS.md` z analizą możliwości integracji
  - Przeanalizowano współistnienie Auth0 i NextAuth
  - Rekomendacja: NIE wdrażać Auth0 na obecnym etapie (fokus na rozbudowę obecnego systemu)

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

## [0.4.1-beta] - 2025-11-07

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

## [0.4.0-beta] - 2025-11-07

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

