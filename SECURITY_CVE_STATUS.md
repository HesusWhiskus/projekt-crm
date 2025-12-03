# Status CVE i podatności bezpieczeństwa

**Data ostatniej aktualizacji:** 2025-01-27  
**SECURITY-FIX: [CVE-9] Dokumentacja znanych CVE**
**Data: 2025-01-27**

## ✅ Naprawione CVE

### next-auth (MODERATE)
- **CVE:** GHSA-5jpx-9hw9-2fx4 - Email misdelivery Vulnerability
- **Status:** ✅ Naprawione
- **Wersja:** Zaktualizowano z `4.24.5` do `4.24.13`
- **Data naprawy:** 2025-01-27

### nodemailer (MODERATE)
- **CVE:** 
  - GHSA-mm7p-fcc7-pg87 - Email to an unintended domain can occur due to Interpretation Conflict
  - GHSA-rcmh-qjqh-p98v - DoS caused by recursive calls
- **Status:** ✅ Naprawione
- **Wersja:** Zaktualizowano z `6.9.13` do `7.0.11`
- **Data naprawy:** 2025-01-27
- **Uwaga:** Wymaga `--legacy-peer-deps` ze względu na peer dependency z next-auth

## ⚠️ Znane CVE bez dostępnej poprawki

### xlsx (HIGH severity)
- **CVE:**
  - GHSA-4r6h-8v6p-xvw6 - Prototype Pollution in sheetJS (CVSS 7.8)
  - GHSA-5pgg-2g8v-p4x9 - Regular Expression Denial of Service (ReDoS) (CVSS 7.5)
- **Status:** ⚠️ Brak dostępnej poprawki
- **Obecna wersja:** `0.18.5`
- **Wymagana wersja:** `>=0.19.3` lub `>=0.20.2` (nie istnieją jeszcze)
- **Ryzyko:** 
  - Prototype Pollution - możliwość modyfikacji prototypów obiektów JavaScript
  - ReDoS - możliwość DoS przez złośliwe wyrażenia regularne
- **Mitigacja:**
  - ✅ Walidacja inputu przed parsowaniem plików Excel
  - ✅ Ograniczenie rozmiaru plików (MAX_FILE_SIZE = 10MB)
  - ✅ Walidacja typów plików (tylko .xlsx, .xls)
  - ✅ Parsowanie tylko w środowisku serwerowym (nie w przeglądarce)
  - ✅ Używanie tylko w kontekście importu danych przez administratorów
- **Działania:**
  - [ ] Monitorować wydanie nowej wersji xlsx z poprawkami
  - [ ] Rozważyć alternatywną bibliotekę (np. exceljs) jeśli poprawka nie zostanie wydana w ciągu 90 dni
  - [ ] Regularnie sprawdzać `npm audit` dla aktualizacji

### eslint-config-next (HIGH severity)
- **CVE:** GHSA-5j98-mcp5-4vw2 - Command injection via glob CLI
- **Status:** ⚠️ Wymaga breaking change
- **Obecna wersja:** `14.2.0`
- **Wymagana wersja:** `16.0.6` (wymaga ESLint >= 9.0.0)
- **Ryzyko:** Command injection w CLI glob (niski w kontekście aplikacji web)
- **Mitigacja:**
  - ✅ Używany tylko w środowisku deweloperskim (devDependencies)
  - ✅ Nie jest częścią runtime aplikacji
  - ✅ Nie jest używany w CI/CD pipeline
- **Działania:**
  - [ ] Zaplanować migrację do ESLint 9 i eslint-config-next 16.x w następnym major release
  - [ ] Monitorować czy pojawią się łatwiejsze sposoby migracji

## 📊 Podsumowanie

- **Naprawione:** 2 CVE (MODERATE)
- **Znane bez poprawki:** 3 CVE (HIGH severity)
- **Pozostałe MODERATE/LOW:** 8 CVE (głównie w devDependencies)

## 🔄 Proces monitorowania

1. **Co tydzień:** Uruchomić `npm audit` i sprawdzić nowe CVE
2. **Co miesiąc:** Sprawdzić czy pojawiły się poprawki dla znanych CVE
3. **Przed każdym release:** Uruchomić `npm audit` i zaktualizować pakiety jeśli dostępne są poprawki
4. **Po wykryciu nowego CVE:** Zaktualizować ten dokument i ocenić ryzyko

## 📝 Notatki

- Używamy `--legacy-peer-deps` dla nodemailer ze względu na peer dependency z next-auth
- xlsx jest używany tylko do importu danych przez administratorów, więc ryzyko jest ograniczone
- Wszystkie CVE w devDependencies są niskiego ryzyka (nie wpływają na produkcję)

