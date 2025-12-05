---
name: Plan rozszerzenia CRM o nowe domeny (DDD/SRP)
overview: ""
todos:
  - id: 04ff625f-fe96-49c5-b15e-e0297f69ba14
    content: Utworzenie Value Objects dla Client (Email, Phone, Website, ClientName, AgencyName) z walidacją i logiką biznesową
    status: pending
  - id: 2aeec92c-0d9c-4aa4-b90c-c96bd61a554b
    content: Utworzenie Client Entity z metodami biznesowymi (changeStatus, updatePriority, assignTo) i enkapsulacją logiki
    status: pending
  - id: d6aa3217-befa-4313-8609-756d3f0b86ef
    content: Utworzenie interfejsów repozytoriów (IClientRepository, IContactRepository, ITaskRepository) z metodami CRUD
    status: pending
  - id: 50dad371-a186-47f3-9ff0-23e82ebccad9
    content: Utworzenie Domain Services (ClientStatusChangeService) dla logiki wymagającej wielu encji
    status: pending
  - id: 6b9ce90a-1060-48cb-aa44-dce7717473df
    content: Utworzenie Use Cases dla Client (CreateClient, UpdateClient, DeleteClient, GetClient, ListClients) z obsługą autoryzacji
    status: pending
  - id: e1aaa56a-e4bd-430b-837b-8096b87bd3a3
    content: Utworzenie DTO (Data Transfer Objects) dla komunikacji między warstwami (CreateClientDTO, UpdateClientDTO, ClientDTO)
    status: pending
  - id: c193a2db-746a-4ff2-8594-7ab0dc636a6c
    content: Implementacja repozytoriów Prisma (PrismaClientRepository, PrismaContactRepository, PrismaTaskRepository) implementujących interfejsy domenowe
    status: pending
  - id: 36f873cb-f565-4899-8770-ab1cea8a0401
    content: Utworzenie ActivityLogger jako serwisu infrastruktury z integracją domain events
    status: pending
  - id: 8f115e8a-b787-4e6d-b753-9ce76b5751f4
    content: Refaktoryzacja API routes (clients, contacts, tasks) - uproszczenie do delegacji do use cases, dodanie middleware autoryzacji
    status: pending
  - id: 8a03bd57-f469-4308-b463-dfffa54d254f
    content: Powtórzenie struktury DDD dla Contact domain (entities, value objects, repositories, use cases)
    status: pending
  - id: 762b2193-8709-4b65-8901-1e46501e7057
    content: Powtórzenie struktury DDD dla Task domain (entities, value objects, repositories, use cases)
    status: pending
---

# Plan rozszerzenia CRM o nowe domeny (DDD/SRP)

## Kontekst biznesowy

System CRM dla firmy technologicznej sprzedającej rozwiązania agencjom ubezpieczeniowym. Docelowo kompleksowe rozwiązanie dla agentów ubezpieczeniowych (rejestr polis, kalkulacje, zarządzanie klientami).

## Nowe domeny do implementacji

### 1. Deals/Opportunities (Oferty/Deale)

**Cel:** Śledzenie ofert sprzedażowych, wartości deali, prawdopodobieństwa zamknięcia, etapów pipeline.

**Struktura DDD:**

- **Domain Layer:**
- Value Objects: `DealValue` (kwota, waluta), `Probability` (0-100%), `DealStage` (enum: INITIAL_CONTACT, PROPOSAL, NEGOTIATION, CLOSING, WON, LOST)
- Entity: `Deal` (id, clientId, value, probability, stage, expectedCloseDate, notes, createdAt, updatedAt)
- Domain Service: `DealPipelineService` (logika przejść między etapami, walidacja zmian)
- Repository Interface: `IDealRepository`
- **Application Layer:**
- DTO: `CreateDealDTO`, `UpdateDealDTO`, `DealFilterDTO`
- Use Cases: `CreateDealUseCase`, `UpdateDealUseCase`, `CloseDealUseCase`, `ListDealsUseCase`, `GetDealUseCase`
- **Infrastructure Layer:**
- `PrismaDealRepository` (implementacja IDealRepository)
- **Presentation Layer:**
- API routes: `/api/deals`, `/api/deals/[id]`
- Komponenty: `DealForm`, `DealList`, `DealDetail`, `DealPipelineView`

**Integracja z Client:**

- Relacja Client -> Deal (jeden klient może mieć wiele deali)
- Aktualizacja statusu klienta przy zamknięciu deala (WON -> ACTIVE_CLIENT)

### 2. Reports & Analytics (Raporty i Analityka)

**Cel:** Generowanie raportów sprzedażowych, analiza konwersji, statystyki aktywności.

**Struktura DDD:**

- **Domain Layer:**
- Value Objects: `ReportPeriod` (date range), `ReportType` (enum: SALES, CLIENTS, ACTIVITY, CONVERSION)
- Value Objects: `ReportFilters` (filtry dla raportu)
- Domain Service: `AnalyticsService` (obliczenia metryk, agregacje)
- Repository Interface: `IReportRepository` (tylko read operations)
- **Application Layer:**
- DTO: `ReportRequestDTO`, `ReportResponseDTO`, `MetricDTO`
- Use Cases: `GenerateSalesReportUseCase`, `GenerateClientReportUseCase`, `GenerateActivityReportUseCase`, `GetConversionMetricsUseCase`
- **Infrastructure Layer:**
- `PrismaReportRepository` (implementacja IReportRepository)
- Query optimizations dla raportów
- **Presentation Layer:**
- API routes: `/api/reports/sales`, `/api/reports/clients`, `/api/reports/activity`, `/api/reports/metrics`
- Komponenty: `ReportsPage`, `ReportFilters`, `ReportChart`, `MetricsDashboard`

**Metryki do śledzenia:**

- Konwersja leadów (NEW_LEAD -> ACTIVE_CLIENT)
- Wartość deali (suma, średnia, mediana)
- Czas w pipeline (średni czas od INITIAL_CONTACT do WON)
- Aktywność użytkowników (kontakty, zadania, deali)

### 3. Documents (Dokumenty)

**Cel:** Przechowywanie umów, polis, ofert, dokumentów klientów.

**Struktura DDD:**

- **Domain Layer:**
- Value Objects: `DocumentType` (enum: CONTRACT, POLICY, PROPOSAL, INVOICE, OTHER), `DocumentVersion`, `FileName`, `FileSize`
- Entity: `Document` (id, clientId?, dealId?, type, filename, path, size, mimeType, version, uploadedBy, createdAt, updatedAt)
- Domain Service: `DocumentVersioningService` (zarządzanie wersjami dokumentów)
- Repository Interface: `IDocumentRepository`
- **Application Layer:**
- DTO: `UploadDocumentDTO`, `DocumentFilterDTO`
- Use Cases: `UploadDocumentUseCase`, `DownloadDocumentUseCase`, `DeleteDocumentUseCase`, `ListDocumentsUseCase`, `GetDocumentUseCase`
- **Infrastructure Layer:**
- `PrismaDocumentRepository` (implementacja IDocumentRepository)
- File storage service (lokalny lub S3-compatible)
- **Presentation Layer:**
- API routes: `/api/documents`, `/api/documents/[id]`, `/api/documents/[id]/download`
- Komponenty: `DocumentUpload`, `DocumentList`, `DocumentViewer`, `DocumentVersionHistory`

**Integracja:**

- Dokumenty mogą być powiązane z Client (umowy, polisy)
- Dokumenty mogą być powiązane z Deal (oferty, umowy sprzedażowe)
- Wersjonowanie dokumentów (historia zmian)

### 4. Reminders & Notifications (Przypomnienia i Powiadomienia)

**Cel:** Automatyczne przypomnienia o follow-up, terminach polis, ważnych datach.

**Struktura DDD:**

- **Domain Layer:**
- Value Objects: `ReminderType` (enum: FOLLOW_UP, POLICY_EXPIRY, DEAL_DEADLINE, TASK_DUE, CUSTOM), `ReminderFrequency` (ONCE, DAILY, WEEKLY, MONTHLY)
- Entity: `Reminder` (id, userId, clientId?, dealId?, taskId?, type, title, description, dueDate, frequency, isActive, sentAt, createdAt, updatedAt)
- Domain Service: `ReminderService` (generowanie przypomnień, sprawdzanie terminów)
- Repository Interface: `IReminderRepository`
- **Application Layer:**
- DTO: `CreateReminderDTO`, `UpdateReminderDTO`, `ReminderFilterDTO`
- Use Cases: `CreateReminderUseCase`, `UpdateReminderUseCase`, `DeleteReminderUseCase`, `ListRemindersUseCase`, `TriggerRemindersUseCase`, `MarkReminderAsSentUseCase`
- **Infrastructure Layer:**
- `PrismaReminderRepository` (implementacja IReminderRepository)
- Notification service (email, in-app notifications)
- **Presentation Layer:**
- API routes: `/api/reminders`, `/api/reminders/[id]`, `/api/reminders/trigger`
- Komponenty: `ReminderForm`, `ReminderList`, `RemindersWidget`, `NotificationCenter`

**Integracja:**

- Automatyczne tworzenie przypomnień przy ustawieniu `nextFollowUpAt` w Client
- Automatyczne przypomnienia o terminach zadań
- Przypomnienia o terminach deali (expectedCloseDate)
- Powiadomienia email (opcjonalnie, jeśli skonfigurowane)

## Pliki do utworzenia/modyfikacji

### Domain Layer

- `src/domain/deals/` (nowa domena)
- `entities/Deal.ts`
- `value-objects/DealValue.ts`, `Probability.ts`, `DealStage.ts`
- `services/DealPipelineService.ts`
- `repositories/IDealRepository.ts`
- `src/domain/reports/` (nowa domena)
- `value-objects/ReportPeriod.ts`, `ReportType.ts`, `ReportFilters.ts`
- `services/AnalyticsService.ts`
- `repositories/IReportRepository.ts`
- `src/domain/documents/` (nowa domena)
- `entities/Document.ts`
- `value-objects/DocumentType.ts`, `DocumentVersion.ts`, `FileName.ts`
- `services/DocumentVersioningService.ts`
- `repositories/IDocumentRepository.ts`
- `src/domain/reminders/` (nowa domena)
- `entities/Reminder.ts`
- `value-objects/ReminderType.ts`, `ReminderFrequency.ts`
- `services/ReminderService.ts`
- `repositories/IReminderRepository.ts`

### Application Layer

- `src/application/deals/` (use cases i DTO)
- `src/application/reports/` (use cases i DTO)
- `src/application/documents/` (use cases i DTO)
- `src/application/reminders/` (use cases i DTO)

### Infrastructure Layer

- `src/infrastructure/persistence/prisma/PrismaDealRepository.ts`
- `src/infrastructure/persistence/prisma/PrismaReportRepository.ts`
- `src/infrastructure/persistence/prisma/PrismaDocumentRepository.ts`
- `src/infrastructure/persistence/prisma/PrismaReminderRepository.ts`
- `src/infrastructure/storage/FileStorageService.ts` (dla dokumentów)

### Presentation Layer

- `src/presentation/api/deals/route.ts`, `[id]/route.ts`
- `src/presentation/api/reports/route.ts`
- `src/presentation/api/documents/route.ts`, `[id]/route.ts`, `[id]/download/route.ts`
- `src/presentation/api/reminders/route.ts`, `[id]/route.ts`

### Database Schema

- `prisma/schema.prisma` - dodanie modeli: Deal, Document, Reminder
- Migracje Prisma dla nowych tabel

### UI Components

- Komponenty dla każdej domeny (formularze, listy, szczegóły)
- Integracja z istniejącymi widokami (ClientDetail, Dashboard)

## Kolejność implementacji

### Faza 1: Deals (Oferty)

1. Schema Prisma + migracja
2. Domain Layer (Value Objects, Entity, Service, Repository Interface)
3. Infrastructure Layer (PrismaDealRepository)
4. Application Layer (Use Cases, DTO)
5. Presentation Layer (API routes)
6. UI Components
7. Integracja z Client (aktualizacja statusu przy WON)

### Faza 2: Documents (Dokumenty)

1. Schema Prisma + migracja
2. Domain Layer
3. Infrastructure Layer (FileStorageService)
4. Application Layer
5. Presentation Layer (upload/download endpoints)
6. UI Components
7. Integracja z Client i Deal

### Faza 3: Reminders (Przypomnienia)

1. Schema Prisma + migracja
2. Domain Layer
3. Infrastructure Layer
4. Application Layer
5. Presentation Layer
6. UI Components
7. Integracja z Client (automatyczne przypomnienia przy nextFollowUpAt)
8. Background job dla triggerowania przypomnień (opcjonalnie)

### Faza 4: Reports & Analytics (Raporty)

1. Domain Layer (tylko Value Objects i Service - nie ma Entity)
2. Infrastructure Layer (PrismaReportRepository - read-only)
3. Application Layer (Use Cases dla różnych typów raportów)
4. Presentation Layer (API routes)
5. UI Components (wykresy, tabele, eksport)

## Zasady DDD i SRP

- **Każda domena jest niezależna** - Deal, Document, Reminder, Report to osobne bounded contexts
- **Value Objects są immutable** - wszystkie Value Objects mają walidację i są immutable
- **Entities zawierają logikę biznesową** - metody jak `changeStage()`, `updateValue()` w Deal
- **Domain Services dla złożonej logiki** - DealPipelineService, AnalyticsService, ReminderService
- **Repository Interfaces w Domain** - tylko interfejsy, implementacje w Infrastructure
- **Use Cases orkiestrują** - każdy Use Case wykonuje jedną operację biznesową
- **DTO w Application Layer** - komunikacja między warstwami przez DTO
- **SRP** - każda klasa ma jedną odpowiedzialność (np. DealPipelineService tylko do przejść między etapami)

## Integracje między domenami

- **Client -> Deal:** Jeden klient może mieć wiele deali
- **Deal -> Document:** Oferty i umowy powiązane z dealami
- **Client -> Document:** Polisy i umowy powiązane z klientami
- **Client -> Reminder:** Automatyczne przypomnienia o follow-up
- **Deal -> Reminder:** Przypomnienia o terminach deali
- **Task -> Reminder:** Przypomnienia o zadaniach

## Uwagi techniczne

- Wszystkie nowe tabele używają CUID (jak reszta systemu)
- Migracje Prisma będą przyrostowe (nie niszczą istniejących danych)
- File storage może być lokalny (na start) lub S3-compatible (w przyszłości)
- Reminders mogą być triggerowane przez cron job lub background worker
- Reports używają read-only queries (nie modyfikują danych)