# Propozycja rozszerzenia systemu wersjonowania

**Status:** ✅ Zdecydowano - pozostajemy przy standardowym Semantic Versioning (Opcja 1)

**Data decyzji:** 2025-01-20

## Obecna sytuacja

- **Obecna wersja:** `0.9.4-beta`
- **Format:** `MAJOR.MINOR.PATCH-beta` (Semantic Versioning)
- **Status:** Beta (nie wychodzimy z bety na razie)

## Problem

Po `0.9.9-beta` następna wersja to `0.10.0-beta`, co jest poprawne semantycznie, ale może być mylące. Dodatkowo, przy częstych aktualizacjach może brakować miejsca w segmencie PATCH (0.9.x).

## Propozycje rozszerzenia

### Opcja 1: Kontynuacja obecnego systemu (REKOMENDOWANA) ✅

**Format:** `MAJOR.MINOR.PATCH-beta`

**Przykłady:**
- `0.9.4-beta` → `0.9.5-beta` → ... → `0.9.9-beta`
- `0.9.9-beta` → `0.10.0-beta` → `0.10.1-beta` → ...
- `0.99.9-beta` → `1.0.0-beta` (gdy wyjdziemy z bety)

**Zalety:**
- ✅ Zgodne z Semantic Versioning (standard branżowy)
- ✅ Nie wymaga zmian w kodzie
- ✅ Czytelne i przewidywalne
- ✅ Działa z narzędziami npm/yarn
- ✅ Nieograniczony zakres (można iść do 0.99.99-beta)

**Wady:**
- ⚠️ Przejście z 0.9.x na 0.10.0 może być mylące dla niektórych użytkowników

**Rekomendacja:** Kontynuować obecny system - jest standardowy i działa dobrze.

---

### Opcja 2: Dodanie segmentu daty (YYYYMMDD)

**Format:** `MAJOR.MINOR.PATCH-beta.YYYYMMDD`

**Przykłady:**
- `0.9.4-beta.20250120`
- `0.9.5-beta.20250121`
- `0.10.0-beta.20250201`

**Zalety:**
- ✅ Łatwe śledzenie daty wydania
- ✅ Unikalność wersji nawet przy wielu wydaniach dziennie
- ✅ Czytelność daty w wersji

**Wady:**
- ⚠️ Dłuższe numery wersji
- ⚠️ Wymaga zmian w kodzie (parsowanie wersji)
- ⚠️ Może być mylące przy wielu wydaniach dziennie
- ⚠️ Nie jest standardowe Semantic Versioning

**Implementacja:**
```typescript
// Parsowanie wersji z datą
const versionParts = version.split('.')
const datePart = versionParts[3] // YYYYMMDD
const date = new Date(
  parseInt(datePart.substring(0, 4)), // rok
  parseInt(datePart.substring(4, 6)) - 1, // miesiąc (0-indexed)
  parseInt(datePart.substring(6, 8)) // dzień
)
```

---

### Opcja 3: Format z rokiem jako MAJOR

**Format:** `YYYY.MM.DD-beta` lub `YYYY.MM.PATCH-beta`

**Przykłady:**
- `2025.01.20-beta` (data wydania)
- `2025.01.04-beta` (rok.miesiąc.numer wydania w miesiącu)

**Zalety:**
- ✅ Bardzo czytelna data wydania
- ✅ Automatyczne archiwizowanie po roku
- ✅ Łatwe sortowanie chronologiczne

**Wady:**
- ⚠️ Nie jest Semantic Versioning
- ⚠️ Wymaga większych zmian w kodzie
- ⚠️ Może być mylące przy wielu wydaniach dziennie
- ⚠️ Problem z porównywaniem wersji (2025.01.20 vs 2024.12.31)

---

### Opcja 4: Dodanie segmentu build number

**Format:** `MAJOR.MINOR.PATCH-beta.BUILD`

**Przykłady:**
- `0.9.4-beta.1`
- `0.9.4-beta.2` (hotfix tego samego dnia)
- `0.9.5-beta.1`

**Zalety:**
- ✅ Pozwala na wiele wydań dziennie
- ✅ Build number może być automatyczny (CI/CD)
- ✅ Łatwe śledzenie liczby wydań

**Wady:**
- ⚠️ Wymaga zmian w kodzie
- ⚠️ Build number musi być zarządzany (CI/CD lub ręcznie)
- ⚠️ Dłuższe numery wersji

**Implementacja:**
```json
// package.json
{
  "version": "0.9.4-beta",
  "buildNumber": 1
}
```

---

### Opcja 5: Rozszerzony format z datą i build (HYBRYDOWY)

**Format:** `MAJOR.MINOR.PATCH-beta.YYYYMMDD.BUILD`

**Przykłady:**
- `0.9.4-beta.20250120.1`
- `0.9.4-beta.20250120.2` (drugi build tego samego dnia)
- `0.9.5-beta.20250121.1`

**Zalety:**
- ✅ Najbardziej szczegółowy
- ✅ Unikalność każdej wersji
- ✅ Łatwe śledzenie daty i liczby wydań

**Wady:**
- ⚠️ Najdłuższe numery wersji
- ⚠️ Najwięcej zmian w kodzie
- ⚠️ Może być przytłaczające dla użytkowników

---

## Rekomendacja

**Rekomenduję Opcję 1 (Kontynuacja obecnego systemu)** z następujących powodów:

1. **Standardowość:** Semantic Versioning jest standardem branżowym
2. **Kompatybilność:** Działa z wszystkimi narzędziami npm/yarn
3. **Prostota:** Nie wymaga zmian w kodzie
4. **Nieograniczoność:** Można iść do 0.99.99-beta bez problemów
5. **Czytelność:** Łatwe do zrozumienia i porównywania

### Plan działania dla Opcji 1:

```
0.9.4-beta (obecna)
  ↓
0.9.5-beta → 0.9.6-beta → ... → 0.9.9-beta
  ↓
0.10.0-beta → 0.10.1-beta → ... → 0.10.9-beta
  ↓
0.11.0-beta → ... → 0.99.9-beta
  ↓
1.0.0-beta (gdy wyjdziemy z bety, ale nadal beta)
  ↓
1.0.0 (gdy wyjdziemy z bety całkowicie)
```

### Jeśli potrzebujesz więcej szczegółów:

Jeśli Opcja 1 nie wystarcza i potrzebujesz lepszego śledzenia dat wydań, mogę zaimplementować **Opcję 2 (z datą)** jako dodatkowy segment, który będzie opcjonalny:

- Wersja w `package.json`: `0.9.4-beta` (standardowa)
- Wersja wyświetlana w UI: `0.9.4-beta (2025-01-20)` (z datą dla czytelności)

To da nam najlepsze z obu światów - standardowe wersjonowanie + czytelna data.

---

## Decyzja

Proszę wybrać opcję:
- [ ] Opcja 1: Kontynuacja obecnego systemu (REKOMENDOWANA)
- [ ] Opcja 2: Z datą (YYYYMMDD)
- [ ] Opcja 3: Format z rokiem
- [ ] Opcja 4: Z build number
- [ ] Opcja 5: Hybrydowy (data + build)
- [ ] Inna propozycja: _______________

Po wyborze zaimplementuję odpowiednie zmiany w kodzie.

