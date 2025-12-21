# Dokumentacja API - Agenty Ubezpieczeniowi

## Wprowadzenie

API dla funkcjonalności agentów ubezpieczeniowych umożliwia zarządzanie pojazdami, kalkulacjami, polisami oraz integracją z systemami zewnętrznymi.

## Uwierzytelnianie

Wszystkie endpointy wymagają uwierzytelniania poprzez sesję NextAuth.js. Użytkownik musi być zalogowany i mieć odpowiednie uprawnienia.

## Rate Limiting

Wszystkie endpointy są chronione przez rate limiting. Domyślny limit: 100 żądań na minutę na użytkownika.

## Endpointy

### Pojazdy (Vehicles)

#### POST /api/vehicles
Utworzenie nowego pojazdu.

**Request Body:**
```json
{
  "vin": "19UUA7652SA006117",
  "registrationNumber": "GA4567",
  "firstRegistrationDate": "2020-02-08T00:00:00Z",
  "importedFromAbroad": false,
  "hasValidInspection": true,
  "hasLpgInstallation": false,
  "purchaseYear": 2015,
  "currentMileage": 220000,
  "clientIds": ["client-id-1", "client-id-2"]
}
```

**Response:**
```json
{
  "vehicle": {
    "id": "vehicle-id",
    "vin": "19UUA7652SA006117",
    "registrationNumber": "GA4567",
    ...
  }
}
```

#### GET /api/vehicles
Lista pojazdów z filtrowaniem.

**Query Parameters:**
- `clientId` - filtruj po kliencie
- `vin` - filtruj po VIN
- `registrationNumber` - filtruj po numerze rejestracyjnym
- `page` - numer strony (domyślnie 1)
- `limit` - liczba wyników (domyślnie 20)

#### GET /api/vehicles/[id]
Szczegóły pojazdu.

#### PUT /api/vehicles/[id]
Aktualizacja pojazdu.

#### POST /api/vehicles/[id]/owners
Przypisanie właściciela do pojazdu.

**Request Body:**
```json
{
  "clientId": "client-id"
}
```

#### DELETE /api/vehicles/[id]/owners/[clientId]
Usunięcie właściciela z pojazdu.

#### POST /api/vehicles/[id]/enrich
Wzbogacenie danych pojazdu z zewnętrznych źródeł (Eurotax, Info-Ekspert).

### Kalkulacje (Calculations)

#### POST /api/calculations
Utworzenie nowej kalkulacji.

**Request Body:**
```json
{
  "clientId": "client-id",
  "vehicleId": "vehicle-id",
  "status": "DRAFT",
  "pesel": "81120203216",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "phone": "575508129",
  "email": "jan@example.com",
  "postalCode": "58-513",
  "city": "Dziwiszów",
  "street": "Dziwiszów",
  "houseNumber": "51",
  "variant": "OPTIMAL",
  "scopes": ["OC", "AC"],
  "value": 1500.00
}
```

#### GET /api/calculations
Lista kalkulacji z filtrowaniem.

**Query Parameters:**
- `clientId` - filtruj po kliencie
- `vehicleId` - filtruj po pojeździe
- `status` - filtruj po statusie (DRAFT, SENT, ACCEPTED, REJECTED)
- `page` - numer strony
- `limit` - liczba wyników

#### GET /api/calculations/[id]
Szczegóły kalkulacji.

#### PUT /api/calculations/[id]
Aktualizacja kalkulacji.

#### POST /api/calculations/[id]/status
Zmiana statusu kalkulacji.

**Request Body:**
```json
{
  "status": "SENT"
}
```

#### POST /api/calculations/[id]/sync
Synchronizacja kalkulacji z systemem zewnętrznym.

#### GET /api/calculations/[id]/offers
Pobranie listy ofert dla kalkulacji.

**Response:**
```json
{
  "offers": [
    {
      "id": "string",
      "calculationId": "string",
      "insuranceCompanyId": "string",
      "price": 1500.00,
      "packageType": "string | null",
      "scopes": ["OC", "AC"],
      "installments": 12,
      "installmentAmount": 125.00,
      "validUntil": "2024-12-31T00:00:00.000Z",
      "status": "dostępna",
      "isSelected": false,
      "insuranceCompany": {
        "id": "string",
        "name": "string",
        "logoUrl": "string | null"
      }
    }
  ]
}
```

#### POST /api/calculations/[id]/offers
Import ofert z systemu zewnętrznego (np. iBooster) dla kalkulacji.

**Request Body:**
```json
{
  "offers": [
    {
      "insuranceCompanyId": "string (required)",
      "price": 1500.00,
      "packageType": "string (optional)",
      "scopes": ["OC", "AC"],
      "installments": 12,
      "installmentAmount": 125.00,
      "validUntil": "2024-12-31T00:00:00.000Z",
      "status": "dostępna",
      "externalId": "string (optional)",
      "metadata": {}
    }
  ]
}
```

**Response:**
```json
{
  "offers": [...],
  "count": 5
}
```

### Oferty (Offers)

#### PUT /api/offers/[id]/select
Wybór oferty jako wybranej dla kalkulacji. Automatycznie odznacza wszystkie inne oferty dla tej samej kalkulacji.

**Response:**
```json
{
  "offer": {
    "id": "string",
    "calculationId": "string",
    "insuranceCompanyId": "string",
    "price": 1500.00,
    "isSelected": true,
    "status": "wybrana",
    "insuranceCompany": {
      "id": "string",
      "name": "string",
      "logoUrl": "string | null"
    }
  }
}
```

### Polisy (Policies)

#### POST /api/policies
Utworzenie nowej polisy.

**Request Body:**
```json
{
  "policyNumber": "POL-2025-001",
  "issueDate": "2025-12-21T00:00:00Z",
  "validFrom": "2025-12-22T00:00:00Z",
  "validTo": "2026-01-20T00:00:00Z",
  "status": "ACTIVE",
  "calculationId": "calc-id",
  "clientId": "client-id",
  "vehicleId": "vehicle-id",
  "insuranceCompanyId": "company-id"
}
```

#### GET /api/policies
Lista polis z filtrowaniem.

#### GET /api/policies/[id]
Szczegóły polisy.

#### PUT /api/policies/[id]
Aktualizacja polisy.

#### POST /api/policies/[id]/documents
Przesłanie dokumentu polisy.

**Request Body:** FormData
- `file` - plik dokumentu
- `name` - nazwa dokumentu
- `type` - typ dokumentu

#### GET /api/policies/[id]/documents/[docId]/download
Pobranie dokumentu polisy.

### Agenci Ubezpieczeniowi (Insurance Agents)

#### POST /api/insurance-agents
Utworzenie nowego agenta.

**Request Body:**
```json
{
  "userId": "user-id",
  "licenseNumber": "LIC-12345",
  "isActive": true
}
```

#### GET /api/insurance-agents
Lista agentów.

#### GET /api/insurance-agents/[id]
Szczegóły agenta.

#### PUT /api/insurance-agents/[id]
Aktualizacja agenta.

#### PUT /api/insurance-agents/[id]/visibility
Aktualizacja ustawień widoczności agenta.

**Request Body:**
```json
{
  "settings": {
    "showVehicles": true,
    "showCalculations": true,
    "showPolicies": true,
    "showClients": true,
    "showDashboard": true,
    "showReports": true
  }
}
```

### Integracja Zewnętrzna

#### GET /api/external/sync/status
Status synchronizacji z systemem zewnętrznym.

**Query Parameters:**
- `entityType` - typ encji (CALCULATION, POLICY, VEHICLE)
- `entityId` - ID encji
- `direction` - kierunek (IN, OUT)

#### POST /api/external/webhook
Webhook do odbierania danych z systemu zewnętrznego.

**Request Body:**
```json
{
  "event": "calculation.created",
  "data": {
    ...
  }
}
```

### Walidacja

#### POST /api/validation/pesel
Walidacja numeru PESEL.

**Request Body:**
```json
{
  "pesel": "81120203216"
}
```

#### POST /api/validation/vin
Walidacja numeru VIN.

#### POST /api/validation/registration-number
Walidacja numeru rejestracyjnego.

#### POST /api/validation/postal-code
Walidacja kodu pocztowego.

### Bezpieczeństwo i RODO

#### GET /api/clients/[id]/export-data
Eksport danych osobowych klienta (GDPR).

#### DELETE /api/clients/[id]/personal-data
Usunięcie danych osobowych klienta (GDPR).

#### GET /api/clients/[id]/consents
Lista zgód klienta.

#### POST /api/clients/[id]/consents
Dodanie zgody.

#### DELETE /api/clients/[id]/consents/[consentId]
Odwołanie zgody.

### Audyt

#### GET /api/audit/calculations/[id]/history
Historia zmian kalkulacji.

#### GET /api/audit/policies/[id]/history
Historia zmian polisy.

#### GET /api/audit/personal-data
Logi dostępu do danych osobowych.

#### GET /api/audit/sync
Logi synchronizacji.

### Konfiguracja

#### GET /api/organizations/[id]/insurance-settings
Pobranie ustawień ubezpieczeń organizacji.

#### PUT /api/organizations/[id]/insurance-settings
Aktualizacja ustawień ubezpieczeń organizacji.

**Request Body:**
```json
{
  "externalSystemUrl": "https://example.com/api",
  "externalSystemApiKey": "api-key",
  "enableBidirectionalSync": true,
  "enableDataValidation": true,
  "enableAuditLogging": true,
  "syncInterval": 60
}
```

## Kody błędów

- `400` - Nieprawidłowe żądanie
- `401` - Nieautoryzowany dostęp
- `403` - Brak uprawnień
- `404` - Nie znaleziono
- `429` - Przekroczono limit żądań
- `500` - Błąd serwera

## Przykłady użycia

### cURL

```bash
# Utworzenie pojazdu
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "vin": "19UUA7652SA006117",
    "registrationNumber": "GA4567",
    "clientIds": ["client-id"]
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('/api/vehicles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    vin: '19UUA7652SA006117',
    registrationNumber: 'GA4567',
    clientIds: ['client-id'],
  }),
})

const data = await response.json()
```

## Rate Limiting

Każdy endpoint ma limit 100 żądań na minutę na użytkownika. W przypadku przekroczenia limitu zwracany jest kod `429` z nagłówkiem `Retry-After`.

## Logowanie aktywności

Wszystkie operacje są logowane w systemie audytu. Logi zawierają:
- ID użytkownika
- Typ operacji
- Typ encji
- ID encji
- Timestamp
- Szczegóły operacji

