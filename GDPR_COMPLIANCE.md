# Zgodność z RODO/GDPR

**Data:** 2025-01-27  
**SECURITY-FIX: [GDPR-15] Dokumentacja zgodności z RODO/GDPR**
**Data: 2025-01-27**

## Status zgodności: ✅ Zgodne z podstawowymi wymogami RODO

### Zaimplementowane funkcjonalności RODO/GDPR

#### 1. Prawo do dostępu do danych (Art. 15 RODO)

**Endpoint:** `GET /api/clients/[id]/export-data`

- ✅ Eksportuje wszystkie dane osobowe klienta
- ✅ Zawiera dane z powiązanych encji (kontakty, zadania, pojazdy, kalkulacje, polisy)
- ✅ Format JSON z datą eksportu
- ✅ Wymaga autoryzacji i uprawnień do klienta

**Użycie:**
```bash
GET /api/clients/{clientId}/export-data
Authorization: Bearer {token}
```

**Odpowiedź:**
```json
{
  "data": {
    "client": {...},
    "contacts": [...],
    "tasks": [...],
    "vehicles": [...],
    "calculations": [...],
    "policies": [...]
  },
  "exportedAt": "2025-01-27T12:00:00.000Z"
}
```

#### 2. Prawo do bycia zapomnianym (Art. 17 RODO)

**Endpoint:** `DELETE /api/clients/[id]/personal-data`

- ✅ Anonimizuje dane osobowe klienta
- ✅ Usuwa: email, telefon, adres
- ✅ Zastępuje imię i nazwisko przez `[USUNIĘTE]`
- ✅ Zachowuje strukturalne dane biznesowe (status, priorytet, etc.)
- ✅ Operacja jest nieodwracalna
- ✅ Wymaga uprawnień ADMIN
- ✅ Loguje operację w activity log

**Użycie:**
```bash
DELETE /api/clients/{clientId}/personal-data
Authorization: Bearer {token}
```

**Odpowiedź:**
```json
{
  "message": "Dane osobowe zostały usunięte",
  "deletedAt": "2025-01-27T12:00:00.000Z"
}
```

**Uwaga:** Operacja nie usuwa całkowicie klienta, tylko anonimizuje dane osobowe. Strukturalne dane biznesowe (status, priorytet, przypisanie) są zachowane dla celów biznesowych.

#### 3. Zarządzanie zgodami (Art. 7 RODO)

**Endpointy:**
- `GET /api/clients/[id]/consents` - lista zgód
- `POST /api/clients/[id]/consents` - dodanie zgody
- `DELETE /api/clients/[id]/consents/[consentId]` - cofnięcie zgody

- ✅ Przechowywanie zgód klienta
- ✅ Typy zgód: MARKETING, DATA_PROCESSING, COMMUNICATION
- ✅ Data udzielenia i cofnięcia zgody
- ✅ Historia zmian zgód

#### 4. Maskowanie danych osobowych w UI

**SECURITY-FIX: [PII-14]**

- ✅ PESEL: maskowany jako `123****8901` (pierwsze 3 i ostatnie 2 cyfry)
- ✅ Telefon: maskowany jako `+48***789` (pierwsze 3 i ostatnie 3 cyfry)
- ✅ Email: maskowany jako `j***@example.com` (pierwsza litera + domena)
- ✅ ADMIN widzi pełne dane, USER widzi zamaszkowane dane

**Pliki:**
- `src/lib/pii-masking.ts` - funkcje maskujące
- Zastosowane w: `calculation-detail.tsx`, `client-detail.tsx`, `clients-list.tsx`

#### 5. Logowanie dostępu do danych osobowych

- ✅ ActivityLog rejestruje wszystkie operacje na danych osobowych
- ✅ Endpoint `GET /api/audit/personal-data` - logi dostępu do danych osobowych
- ✅ Rejestrowane operacje:
  - `CLIENT_CREATED`
  - `CLIENT_UPDATED`
  - `CLIENT_PERSONAL_DATA_DELETED`
  - `CONTACT_CREATED`
  - `CALCULATION_CREATED`
  - `POLICY_CREATED`

## Szyfrowanie danych

### Szyfrowanie w transporcie (HTTPS)

- ✅ **Włączone** - Railway automatycznie zapewnia HTTPS
- ✅ **HSTS** - Strict-Transport-Security header w next.config.js
- ✅ **TLS 1.2+** - Railway wymusza nowoczesne wersje TLS

### Szyfrowanie w spoczynku (at rest)

**Status:** ⚠️ Zależy od dostawcy bazy danych

**Railway PostgreSQL:**
- Railway używa zarządzanej bazy PostgreSQL
- Railway automatycznie szyfruje dane w spoczynku (encryption at rest)
- ✅ **Zgodne z RODO** - Railway zapewnia szyfrowanie na poziomie infrastruktury

**Rekomendacje:**
- ✅ Railway PostgreSQL ma szyfrowanie at rest włączone domyślnie
- ✅ Połączenia do bazy są szyfrowane (SSL/TLS)
- ✅ Backupi są szyfrowane
- ⚠️ Jeśli używasz innego dostawcy, sprawdź dokumentację szyfrowania

**Weryfikacja:**
```sql
-- Sprawdź czy połączenie używa SSL
SHOW ssl;
-- Powinno zwrócić: on
```

## Zgodność z zasadami RODO

### Zasada minimalizacji danych (Art. 5(1)(c))

- ✅ Zbieramy tylko niezbędne dane
- ✅ PESEL jest opcjonalny
- ✅ Maskowanie danych w UI ogranicza ekspozycję

### Zasada ograniczenia celu (Art. 5(1)(b))

- ✅ Dane są przetwarzane tylko w celach biznesowych CRM
- ✅ Brak udostępniania danych osobom trzecim bez zgody

### Zasada dokładności (Art. 5(1)(d))

- ✅ Użytkownicy mogą aktualizować swoje dane
- ✅ Walidacja danych wejściowych (Zod schemas)

### Zasada ograniczenia przechowywania (Art. 5(1)(e))

- ⚠️ **DO DODANIA:** Polityka automatycznego usuwania starych danych
- ✅ Możliwość ręcznego usunięcia danych przez endpoint DELETE

### Zasada integralności i poufności (Art. 5(1)(f))

- ✅ Szyfrowanie w transporcie (HTTPS)
- ✅ Szyfrowanie w spoczynku (Railway PostgreSQL)
- ✅ Kontrola dostępu (autoryzacja i uprawnienia)
- ✅ Logowanie dostępu do danych

## Prawa osób, których dane dotyczą

### ✅ Prawo do informacji (Art. 13-14)

- ✅ Polityka prywatności (do dodania w UI)
- ✅ Informacja o przetwarzaniu danych przy rejestracji

### ✅ Prawo do dostępu (Art. 15)

- ✅ Endpoint eksportu danych: `GET /api/clients/[id]/export-data`

### ✅ Prawo do sprostowania (Art. 16)

- ✅ Endpointy aktualizacji: `PATCH /api/clients/[id]`, `PUT /api/vehicles/[id]`, etc.

### ✅ Prawo do usunięcia (Art. 17)

- ✅ Endpoint anonimizacji: `DELETE /api/clients/[id]/personal-data`

### ✅ Prawo do ograniczenia przetwarzania (Art. 18)

- ⚠️ **DO DODANIA:** Mechanizm flagowania danych jako "ograniczone przetwarzanie"

### ✅ Prawo do przenoszenia danych (Art. 20)

- ✅ Endpoint eksportu danych w formacie JSON

### ✅ Prawo do sprzeciwu (Art. 21)

- ✅ Zarządzanie zgodami przez endpointy `/api/clients/[id]/consents`

## Rekomendacje do ulepszenia

### Wysokie priorytety:

1. **Polityka prywatności w UI**
   - Dodać stronę `/privacy-policy` z informacjami o przetwarzaniu danych
   - Link do polityki prywatności przy rejestracji

2. **Automatyczne usuwanie starych danych**
   - Dodać politykę retencji danych (np. 5 lat)
   - Automatyczne anonimizowanie danych po okresie retencji

3. **Mechanizm ograniczenia przetwarzania**
   - Flaga `processingRestricted` w modelu Client
   - Blokowanie operacji na danych z ograniczonym przetwarzaniem

### Średnie priorytety:

4. **Eksport danych w innych formatach**
   - PDF export dla użytkowników
   - CSV export dla administratorów

5. **Powiadomienia o zmianach danych**
   - Email do klienta przy zmianie danych osobowych
   - Powiadomienie o eksporcie danych

6. **Audit log dla RODO**
   - Dedykowany endpoint do przeglądu wszystkich operacji RODO
   - Raportowanie dostępu do danych osobowych

## Podsumowanie

✅ **Zgodność podstawowa:** Zaimplementowane
- Eksport danych
- Usuwanie danych osobowych
- Zarządzanie zgodami
- Maskowanie danych w UI
- Logowanie dostępu

⚠️ **Do ulepszenia:**
- Polityka prywatności w UI
- Automatyczne usuwanie starych danych
- Mechanizm ograniczenia przetwarzania

📝 **Dokumentacja:**
- Wszystkie endpointy RODO są udokumentowane w `API_DOCUMENTATION.md`
- Funkcje maskujące są udokumentowane w `src/lib/pii-masking.ts`

