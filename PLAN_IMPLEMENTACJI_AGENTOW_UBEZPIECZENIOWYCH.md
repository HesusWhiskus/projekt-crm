# Plan implementacji obsługi agentów ubezpieczeniowych - pełna wersja

## Analiza wymagań

System musi obsługiwać:
1. **Agentów ubezpieczeniowych** - osobny typ użytkownika z konfigurowalną widocznością elementów
2. **Pojazdy** - skorelowane z klientami (relacja N:M dla współwłaścicieli)
3. **Kalkulacje** - jako szanse sprzedaży z danymi z formularza + dodatkowe pola biznesowe
4. **Polisy** - wystawione polisy z informacją o TU, logo, dokumenty
5. **Integracja zewnętrzna** - dwukierunkowa synchronizacja danych (REST API + Webhook)

## Faza 1: Rozszerzenie schematu bazy danych

### 1.1 Nowy model InsuranceAgent
- Osobny model dla agentów ubezpieczeniowych (nie tylko rola)
- Relacja z User (1:1)
- Konfiguracja widoczności elementów (JSON)
- Pola: `userId`, `licenseNumber`, `settings` (JSON), `isActive`, `organizationId`

### 1.2 Model Vehicle (Pojazd)
- Podstawowe dane: VIN, numer rejestracyjny, data pierwszej rejestracji
- Dane z Eurotax/Info-Ekspert: marka, model, rok, paliwo, pojemność, moc, itp. (JSON)
- Dodatkowe: sprowadzony z zagranicy, badanie techniczne, instalacja gazowa, rok nabycia, przebieg
- Relacja N:M z Client (VehicleOwner) dla właścicieli/współwłaścicieli

### 1.3 Model Calculation (Kalkulacja/Szansa sprzedaży)
- Dane osobowe klienta: PESEL, imię, nazwisko, poprzednie nazwisko, telefon, email
- Adres: kod pocztowy, poczta, miejscowość, ulica, numer domu/mieszkania
- Adres korespondencyjny (jeśli inny) - JSON
- Dane dodatkowe: prawo jazdy, data uzyskania, zawód, stan cywilny, dziecko <26 lat
- Powiązanie z Vehicle i Client
- Pola biznesowe: status (DRAFT, SENT, ACCEPTED, REJECTED), wartość, data ważności, przypisany agent
- Dane z formularza ubezpieczenia: wariant (minimalny/optymalny/maksymalny), zakres (OC, AC, NNW, ASS)

### 1.4 Model InsuranceCompany (Towarzystwo Ubezpieczeniowe)
- Podstawowe: nazwa, kod, logo (URL), strona www
- Konfiguracja integracji (jeśli wymagana) - JSON

### 1.5 Model Policy (Polisa)
- Podstawowe: numer polisy, data wystawienia, data ważności od-do
- Powiązanie z Calculation, Client, Vehicle, InsuranceCompany
- Status: ACTIVE, EXPIRED, CANCELLED, RENEWED
- Dokumenty: relacja z Attachment lub osobny model PolicyDocument
- Dane z systemu zewnętrznego: externalId, syncedAt

### 1.6 Rozszerzenie modelu Client
- Dodatkowe pola dla agentów: poprzednie nazwisko, data uzyskania prawa jazdy, zawód, stan cywilny, dziecko <26 lat
- Adres korespondencyjny (osobne pola lub JSON)

### 1.7 Model ExternalSync (Synchronizacja z systemem zewnętrznym)
- Śledzenie synchronizacji: entityType, entityId, externalId, direction (IN/OUT), status, syncedAt, error, requestPayload, responsePayload

### 1.8 Model OrganizationInsuranceSettings
- Konfiguracja specyficzna dla ubezpieczeń per organizacja
- Pola: `organizationId`, `validationLevel` (STRICT/RELAXED), `encryptionEnabled`, `auditRetentionDays`, `gdprEnabled`, `dataRetentionDays`, `cacheEnabled`, `cacheTTL`

### 1.9 Modele audytu
- `CalculationHistory` - historia zmian kalkulacji
- `PolicyHistory` - historia zmian polis
- `AuditLog` - rozszerzenie ActivityLog dla danych osobowych

### 1.10 Model DataConsent
- Zgody na przetwarzanie danych (RODO)
- Pola: `clientId`, `consentType`, `granted`, `grantedAt`, `expiresAt`, `revokedAt`

## Faza 2: Warstwa domenowa (Domain Layer)

### 2.1 Domain: vehicles
- **Value Objects:**
  - `VIN` (walidacja formatu VIN)
  - `RegistrationNumber` (numer rejestracyjny)
  - `VehicleMake`, `VehicleModel`
- **Entity:** `Vehicle`
- **Repository Interface:** `IVehicleRepository`
- **Domain Service:** `VehicleDataEnrichmentService` (integracja z Eurotax/Info-Ekspert)

### 2.2 Domain: calculations
- **Value Objects:**
  - `PESEL` (walidacja PESEL)
  - `PostalCode` (kod pocztowy)
  - `InsuranceVariant` (enum: MINIMAL, OPTIMAL, MAXIMAL)
  - `InsuranceScope` (OC, AC, NNW, ASS)
- **Entity:** `Calculation`
- **Repository Interface:** `ICalculationRepository`
- **Domain Service:** `CalculationStatusService` (zarządzanie statusami)

### 2.3 Domain: policies
- **Value Objects:**
  - `PolicyNumber` (numer polisy)
  - `PolicyStatus` (enum)
- **Entity:** `Policy`
- **Repository Interface:** `IPolicyRepository`

### 2.4 Domain: insurance-agents
- **Entity:** `InsuranceAgent`
- **Repository Interface:** `IInsuranceAgentRepository`
- **Domain Service:** `AgentVisibilityService` (zarządzanie widocznością elementów)

### 2.5 Domain: external-integration
- **Value Objects:**
  - `ExternalId` (identyfikator w systemie zewnętrznym)
  - `SyncDirection` (enum: IN, OUT)
- **Domain Service:** `ExternalSyncService` (logika synchronizacji)
- **Repository Interface:** `IExternalSyncRepository`

### 2.6 Domain: validation
- **Value Objects:**
  - `PESELValidator` - walidacja PESEL
  - `VINValidator` - walidacja VIN
  - `RegistrationNumberValidator` - walidacja numeru rejestracyjnego
  - `PostalCodeValidator` - walidacja kodu pocztowego
- **Domain Service:** `DataValidationService` - orkiestracja walidacji

### 2.7 Domain: security
- **Domain Service:** `EncryptionService` - szyfrowanie wrażliwych danych
- **Domain Service:** `AgentAuthorizationService` - autoryzacja dla agentów
- **Domain Service:** `GDPRService` - obsługa RODO (eksport, usuwanie danych)

### 2.8 Domain: audit
- **Domain Service:** `AuditService` - logowanie operacji audytowych
- **Repository Interface:** `IAuditRepository`

## Faza 3: Warstwa aplikacyjna (Application Layer)

### 3.1 Use Cases: Vehicles
- `CreateVehicleUseCase`
- `UpdateVehicleUseCase`
- `GetVehicleUseCase`
- `ListVehiclesUseCase`
- `AssignVehicleToClientUseCase` (dla współwłaścicieli)
- `EnrichVehicleDataUseCase` (pobieranie danych z Eurotax/Info-Ekspert)

### 3.2 Use Cases: Calculations
- `CreateCalculationUseCase`
- `UpdateCalculationUseCase`
- `GetCalculationUseCase`
- `ListCalculationsUseCase`
- `ChangeCalculationStatusUseCase`
- `SendCalculationToExternalSystemUseCase`

### 3.3 Use Cases: Policies
- `CreatePolicyUseCase`
- `UpdatePolicyUseCase`
- `GetPolicyUseCase`
- `ListPoliciesUseCase`
- `UploadPolicyDocumentUseCase`
- `DownloadPolicyDocumentUseCase`

### 3.4 Use Cases: Insurance Agents
- `CreateInsuranceAgentUseCase`
- `UpdateInsuranceAgentUseCase`
- `GetInsuranceAgentUseCase`
- `UpdateAgentVisibilitySettingsUseCase`

### 3.5 Use Cases: External Integration
- `SyncClientToExternalUseCase`
- `SyncVehicleToExternalUseCase`
- `SyncCalculationToExternalUseCase`
- `SyncPolicyToExternalUseCase`
- `ReceiveDataFromExternalUseCase` (webhook handler)
- `GetSyncStatusUseCase`

### 3.6 Use Cases: Validation
- `ValidatePESELUseCase`
- `ValidateVINUseCase`
- `ValidateRegistrationNumberUseCase`
- `ValidatePostalCodeUseCase`

### 3.7 Use Cases: Security & GDPR
- `EncryptPersonalDataUseCase`
- `DecryptPersonalDataUseCase`
- `ExportClientDataUseCase` (GDPR export)
- `DeleteClientPersonalDataUseCase` (Right to be Forgotten)
- `ManageDataConsentUseCase`

### 3.8 Use Cases: Audit
- `LogCalculationChangeUseCase`
- `LogPolicyChangeUseCase`
- `LogPersonalDataAccessUseCase`
- `GetAuditHistoryUseCase`

## Faza 4: Warstwa infrastruktury (Infrastructure Layer)

### 4.1 Repozytoria Prisma
- `PrismaVehicleRepository`
- `PrismaCalculationRepository`
- `PrismaPolicyRepository`
- `PrismaInsuranceAgentRepository`
- `PrismaExternalSyncRepository`
- `PrismaAuditRepository`

### 4.2 Integracja z systemem zewnętrznym
- `ExternalSystemClient` (klient HTTP do komunikacji z systemem zewnętrznym)
- `ExternalSystemMapper` (mapowanie danych CRM <-> system zewnętrzny)
- `WebhookHandler` (obsługa webhooków z systemu zewnętrznego)

### 4.3 Integracja z Eurotax/Info-Ekspert
- `EurotaxClient` (opcjonalnie, jeśli dostępne API)
- `VehicleDataProvider` (abstrakcja dla różnych źródeł danych pojazdu)

### 4.4 Cache Service
- `CacheService` - implementacja cache dla danych pojazdów, TU, synchronizacji
- Strategia cache-aside z automatycznym unieważnianiem

### 4.5 Encryption Service
- Implementacja `EncryptionService` z użyciem AES-256
- Key management (env variables lub key vault)

## Faza 5: Warstwa prezentacji (Presentation Layer)

### 5.1 API Routes: Vehicles
- `POST /api/vehicles` - tworzenie pojazdu
- `GET /api/vehicles` - lista pojazdów
- `GET /api/vehicles/[id]` - szczegóły pojazdu
- `PUT /api/vehicles/[id]` - aktualizacja pojazdu
- `POST /api/vehicles/[id]/owners` - przypisanie właściciela
- `DELETE /api/vehicles/[id]/owners/[clientId]` - usunięcie właściciela
- `POST /api/vehicles/[id]/enrich` - wzbogacenie danych pojazdu

### 5.2 API Routes: Calculations
- `POST /api/calculations` - tworzenie kalkulacji
- `GET /api/calculations` - lista kalkulacji
- `GET /api/calculations/[id]` - szczegóły kalkulacji
- `PUT /api/calculations/[id]` - aktualizacja kalkulacji
- `POST /api/calculations/[id]/status` - zmiana statusu
- `POST /api/calculations/[id]/sync` - synchronizacja z systemem zewnętrznym

### 5.3 API Routes: Policies
- `POST /api/policies` - tworzenie polisy
- `GET /api/policies` - lista polis
- `GET /api/policies/[id]` - szczegóły polisy
- `PUT /api/policies/[id]` - aktualizacja polisy
- `POST /api/policies/[id]/documents` - upload dokumentu polisy
- `GET /api/policies/[id]/documents/[docId]/download` - pobieranie dokumentu

### 5.4 API Routes: Insurance Agents
- `POST /api/insurance-agents` - tworzenie agenta
- `GET /api/insurance-agents/[id]` - szczegóły agenta
- `PUT /api/insurance-agents/[id]` - aktualizacja agenta
- `PUT /api/insurance-agents/[id]/visibility` - aktualizacja widoczności

### 5.5 API Routes: External Integration
- `POST /api/external/sync/clients` - synchronizacja klientów
- `POST /api/external/sync/vehicles` - synchronizacja pojazdów
- `POST /api/external/sync/calculations` - synchronizacja kalkulacji
- `POST /api/external/sync/policies` - synchronizacja polis
- `POST /api/external/webhook` - webhook od systemu zewnętrznego
- `GET /api/external/sync/status` - status synchronizacji

### 5.6 API Routes: Validation
- `POST /api/validation/pesel` - walidacja PESEL
- `POST /api/validation/vin` - walidacja VIN
- `POST /api/validation/registration-number` - walidacja numeru rejestracyjnego
- `POST /api/validation/postal-code` - walidacja kodu pocztowego

### 5.7 API Routes: Security & GDPR
- `GET /api/clients/[id]/export-data` - eksport danych klienta (GDPR)
- `DELETE /api/clients/[id]/personal-data` - usuwanie danych osobowych (Right to be Forgotten)
- `GET /api/clients/[id]/consents` - lista zgód klienta
- `POST /api/clients/[id]/consents` - dodanie zgody
- `DELETE /api/clients/[id]/consents/[consentId]` - cofnięcie zgody

### 5.8 API Routes: Audit
- `GET /api/audit/calculations/[id]/history` - historia zmian kalkulacji
- `GET /api/audit/policies/[id]/history` - historia zmian polisy
- `GET /api/audit/personal-data` - logi operacji na danych osobowych
- `GET /api/audit/sync` - logi synchronizacji

### 5.9 API Routes: Configuration
- `GET /api/organizations/[id]/insurance-settings` - pobranie ustawień
- `PUT /api/organizations/[id]/insurance-settings` - aktualizacja ustawień

## Faza 6: UI/UX dla agentów ubezpieczeniowych

### 6.1 Dashboard dla agentów
- `InsuranceAgentDashboard` - główny dashboard
- `AgentStatsCards` - statystyki (kalkulacje, polisy, klienci)
- `RecentCalculations` - ostatnie kalkulacje
- `UpcomingRenewals` - nadchodzące odnowienia polis
- `QuickActions` - szybkie akcje

### 6.2 Pipeline kalkulacji
- `CalculationPipeline` - widok kanban/pipeline kalkulacji
- `CalculationCard` - karta kalkulacji w pipeline
- Filtry i sortowanie
- Drag & drop między statusami

### 6.3 Integracja z widokiem klienta
- Rozszerzenie `ClientDetail`:
  - Zakładka "Pojazdy" - lista pojazdów klienta
  - Zakładka "Kalkulacje" - historia kalkulacji
  - Zakładka "Polisy" - aktywne i historyczne polisy
  - Szybkie dodawanie kalkulacji z widoku klienta

### 6.4 Widoki szczegółowe
- `CalculationDetailView` - pełny widok kalkulacji z danymi z formularza
- `PolicyDetailView` - widok polisy z dokumentami i historią
- `VehicleDetailView` - szczegóły pojazdu z właścicielami

### 6.5 Formularze
- `CalculationForm` - kompleksowy formularz kalkulacji (z danymi z formularza ubezpieczenia)
- `PolicyForm` - formularz polisy
- `VehicleForm` - formularz pojazdu z możliwością przypisania właścicieli

### 6.6 Konfiguracja widoczności
- `AgentVisibilitySettings` - panel konfiguracji widoczności elementów
- Dynamiczne ukrywanie/pokazywanie sekcji w UI
- Zapisywanie preferencji per agent

### 6.7 Panel administracyjny
- `InsuranceSettingsPanel` - panel ustawień ubezpieczeń w admin
- Integracja z istniejącym `FeatureFlagsManager`
- Konfiguracja walidacji, bezpieczeństwa, RODO, wydajności

## Faza 7: Konfiguracja organizacji i Feature Flags

### 7.1 Nowe Feature Flags
- `INSURANCE_AGENTS` - podstawowa funkcja agentów ubezpieczeniowych
- `INSURANCE_DATA_VALIDATION` - walidacja danych
- `INSURANCE_SECURITY_ENHANCED` - zaawansowane bezpieczeństwo
- `GDPR_COMPLIANCE` - zgodność z RODO
- `DATA_ENCRYPTION` - szyfrowanie danych
- `PERFORMANCE_OPTIMIZATION` - optymalizacje wydajności
- `AUDIT_LOGGING` - szczegółowe logowanie

### 7.2 Aktualizacja feature-flags.ts
- Dodanie nowych kluczy do `FEATURE_KEYS`
- Określenie które są PRO features
- Aktualizacja `isFeatureEnabled` i `checkFeature`

### 7.3 Konfiguracja per organizacja
- Model `OrganizationInsuranceSettings` w Prisma
- API do zarządzania ustawieniami
- UI do konfiguracji w panelu admin

## Faza 8: Migracje i seed data

### 8.1 Migracje Prisma
- Utworzenie wszystkich nowych modeli
- Dodanie relacji między modelami
- Indeksy dla wydajności
- Seed data dla InsuranceCompany (19 TU z logo)

### 8.2 Aktualizacja istniejących modeli
- Rozszerzenie Client o dodatkowe pola
- Aktualizacja UserContext o typ agenta
- Rozszerzenie ActivityLog o AuditLog

## Faza 9: Testy i dokumentacja

### 9.1 Testy jednostkowe
- Testy Value Objects (walidatory)
- Testy Domain Services
- Testy Use Cases

### 9.2 Testy integracyjne
- Testy API endpoints
- Testy synchronizacji z systemem zewnętrznym
- Testy szyfrowania/deszyfrowania

### 9.3 Dokumentacja
- Aktualizacja API_DOCUMENTATION.md
- Dokumentacja integracji z systemem zewnętrznym
- Przewodnik konfiguracji dla administratorów

## Lista zadań (Todos)

### Priorytet 1: Fundamenty
1. ✅ Utworzenie modeli Prisma: InsuranceAgent, Vehicle, VehicleOwner, Calculation, InsuranceCompany, Policy, PolicyDocument, ExternalSync, OrganizationInsuranceSettings, CalculationHistory, PolicyHistory, AuditLog, DataConsent oraz rozszerzenie Client
2. ✅ Implementacja warstwy domenowej dla pojazdów: Value Objects (VIN, RegistrationNumber), Entity Vehicle, Repository Interface, Domain Service
3. ✅ Implementacja warstwy domenowej dla kalkulacji: Value Objects (PESEL, PostalCode, InsuranceVariant), Entity Calculation, Repository Interface, Domain Service
4. ✅ Implementacja warstwy domenowej dla polis: Value Objects (PolicyNumber, PolicyStatus), Entity Policy, Repository Interface
5. ✅ Implementacja warstwy domenowej dla agentów: Entity InsuranceAgent, Repository Interface, Domain Service dla widoczności
6. ✅ Implementacja warstwy domenowej dla integracji zewnętrznej: Value Objects, Domain Service ExternalSyncService, Repository Interface

### Priorytet 2: Walidacja i bezpieczeństwo
7. ✅ Implementacja walidatorów: PESELValidator, VINValidator, RegistrationNumberValidator, PostalCodeValidator, DataValidationService
8. ✅ Implementacja bezpieczeństwa: EncryptionService, AgentAuthorizationService, GDPRService
9. ✅ Implementacja audytu: AuditService, IAuditRepository

### Priorytet 3: Infrastruktura
10. ✅ Implementacja repozytoriów Prisma dla wszystkich nowych domen: PrismaVehicleRepository, PrismaCalculationRepository, PrismaPolicyRepository, PrismaInsuranceAgentRepository, PrismaExternalSyncRepository, PrismaAuditRepository
11. ✅ Implementacja klienta HTTP do komunikacji z systemem zewnętrznym: ExternalSystemClient, ExternalSystemMapper, WebhookHandler
12. ✅ Implementacja CacheService z automatycznym unieważnianiem
13. ✅ Implementacja EncryptionService z AES-256 i key management

### Priorytet 4: Use Cases
14. ✅ Implementacja use cases dla pojazdów: CreateVehicleUseCase, UpdateVehicleUseCase, GetVehicleUseCase, ListVehiclesUseCase, AssignVehicleToClientUseCase, EnrichVehicleDataUseCase
15. ✅ Implementacja use cases dla kalkulacji: CreateCalculationUseCase, UpdateCalculationUseCase, GetCalculationUseCase, ListCalculationsUseCase, ChangeCalculationStatusUseCase, SendCalculationToExternalUseCase
16. ✅ Implementacja use cases dla polis: CreatePolicyUseCase, UpdatePolicyUseCase, GetPolicyUseCase, ListPoliciesUseCase, UploadPolicyDocumentUseCase, DownloadPolicyDocumentUseCase
17. ✅ Implementacja use cases dla agentów: CreateInsuranceAgentUseCase, UpdateInsuranceAgentUseCase, GetInsuranceAgentUseCase, UpdateAgentVisibilitySettingsUseCase
18. ✅ Implementacja use cases dla integracji: SyncClientToExternalUseCase, SyncVehicleToExternalUseCase, SyncCalculationToExternalUseCase, SyncPolicyToExternalUseCase, ReceiveDataFromExternalUseCase, GetSyncStatusUseCase
19. ✅ Implementacja use cases dla walidacji: ValidatePESELUseCase, ValidateVINUseCase, ValidateRegistrationNumberUseCase, ValidatePostalCodeUseCase
20. ✅ Implementacja use cases dla bezpieczeństwa i RODO: EncryptPersonalDataUseCase, DecryptPersonalDataUseCase, ExportClientDataUseCase, DeleteClientPersonalDataUseCase, ManageDataConsentUseCase
21. ✅ Implementacja use cases dla audytu: LogCalculationChangeUseCase, LogPolicyChangeUseCase, LogPersonalDataAccessUseCase, GetAuditHistoryUseCase

### Priorytet 5: API Routes
22. ✅ Utworzenie API routes dla pojazdów: POST/GET/PUT /api/vehicles, POST/DELETE /api/vehicles/[id]/owners, POST /api/vehicles/[id]/enrich
23. ✅ Utworzenie API routes dla kalkulacji: POST/GET/PUT /api/calculations, POST /api/calculations/[id]/status, POST /api/calculations/[id]/sync
24. ✅ Utworzenie API routes dla polis: POST/GET/PUT /api/policies, POST /api/policies/[id]/documents, GET /api/policies/[id]/documents/[docId]/download
25. ✅ Utworzenie API routes dla agentów: POST/GET/PUT /api/insurance-agents, PUT /api/insurance-agents/[id]/visibility
26. ✅ Utworzenie API routes dla integracji: POST /api/external/sync/*, POST /api/external/webhook, GET /api/external/sync/status
27. ✅ Utworzenie API routes dla walidacji: POST /api/validation/pesel, /api/validation/vin, /api/validation/registration-number, /api/validation/postal-code
28. ✅ Utworzenie API routes dla bezpieczeństwa i RODO: GET /api/clients/[id]/export-data, DELETE /api/clients/[id]/personal-data, GET/POST/DELETE /api/clients/[id]/consents
29. ✅ Utworzenie API routes dla audytu: GET /api/audit/calculations/[id]/history, GET /api/audit/policies/[id]/history, GET /api/audit/personal-data, GET /api/audit/sync
30. ✅ Utworzenie API routes dla konfiguracji: GET/PUT /api/organizations/[id]/insurance-settings

### Priorytet 6: UI/UX
31. ✅ Utworzenie dashboardu dla agentów: InsuranceAgentDashboard, AgentStatsCards, RecentCalculations, UpcomingRenewals, QuickActions
32. ✅ Utworzenie pipeline kalkulacji: CalculationPipeline, CalculationCard z drag & drop
33. ✅ Rozszerzenie ClientDetail o zakładki: Pojazdy, Kalkulacje, Polisy
34. ✅ Utworzenie formularzy: CalculationForm, PolicyForm, VehicleForm
35. ✅ Utworzenie paneli konfiguracji: AgentVisibilitySettings, InsuranceSettingsPanel

### Priorytet 7: Konfiguracja i migracje
36. ✅ Aktualizacja feature-flags.ts o nowe klucze: INSURANCE_AGENTS, INSURANCE_DATA_VALIDATION, INSURANCE_SECURITY_ENHANCED, GDPR_COMPLIANCE, DATA_ENCRYPTION, PERFORMANCE_OPTIMIZATION, AUDIT_LOGGING
37. ✅ Utworzenie migracji Prisma i seed data dla InsuranceCompany (19 TU z logo)
38. ✅ Dodanie indeksów dla wydajności: Vehicle (vin, registrationNumber), Calculation (clientId, vehicleId, status), Policy (policyNumber, status, expiryDate), ExternalSync (entityType, entityId, externalId)

### Priorytet 8: Testy i dokumentacja
39. ✅ Testy jednostkowe: Value Objects, Domain Services, Use Cases
40. ✅ Testy integracyjne: API endpoints, synchronizacja, szyfrowanie
41. ✅ Aktualizacja dokumentacji: API_DOCUMENTATION.md, dokumentacja integracji, przewodnik konfiguracji

## Uwagi implementacyjne

### Struktura katalogów
```
src/
├── domain/
│   ├── vehicles/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── value-objects/
│   ├── calculations/
│   ├── policies/
│   ├── insurance-agents/
│   ├── external-integration/
│   ├── validation/
│   ├── security/
│   └── audit/
├── application/
│   ├── vehicles/
│   ├── calculations/
│   ├── policies/
│   ├── insurance-agents/
│   ├── external-integration/
│   ├── validation/
│   ├── security/
│   └── audit/
├── infrastructure/
│   ├── persistence/
│   │   └── prisma/
│   ├── external/
│   ├── cache/
│   └── encryption/
└── presentation/
    └── api/
```

### Kluczowe zależności
- Prisma dla ORM
- Next.js dla API routes
- Zod dla walidacji
- crypto dla szyfrowania
- Redis lub in-memory cache dla CacheService

### Konfiguracja środowiska
- `ENCRYPTION_KEY` - klucz szyfrowania (32 bajty dla AES-256)
- `EXTERNAL_SYSTEM_URL` - URL systemu zewnętrznego
- `EXTERNAL_SYSTEM_API_KEY` - klucz API systemu zewnętrznego
- `CACHE_TTL` - domyślny TTL cache (opcjonalnie)

### Kolejność implementacji (rekomendowana)
1. Faza 1: Schemat bazy danych i migracje
2. Faza 2: Warstwa domenowa (Value Objects, Entities, Repository Interfaces)
3. Faza 4: Warstwa infrastruktury (Repozytoria Prisma)
4. Faza 3: Warstwa aplikacyjna (Use Cases)
5. Faza 5: Warstwa prezentacji (API Routes)
6. Faza 6: UI/UX
7. Faza 7: Konfiguracja i Feature Flags
8. Faza 8: Migracje i seed data
9. Faza 9: Testy i dokumentacja

## Status implementacji

- [ ] Faza 1: Rozszerzenie schematu bazy danych
- [ ] Faza 2: Warstwa domenowa
- [ ] Faza 3: Warstwa aplikacyjna
- [ ] Faza 4: Warstwa infrastruktury
- [ ] Faza 5: Warstwa prezentacji
- [ ] Faza 6: UI/UX
- [ ] Faza 7: Konfiguracja organizacji
- [ ] Faza 8: Migracje i seed data
- [ ] Faza 9: Testy i dokumentacja

---
*Plan utworzony: $(date)*
*Ostatnia aktualizacja: $(date)*

