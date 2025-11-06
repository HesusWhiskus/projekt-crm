# 📏 Propozycja limitów znaków dla pól formularzy

## Analiza aktualnych limitów vs. standardy branżowe

### 📊 Tabela porównawcza

| Pole | Aktualny limit | Proponowany limit | Uzasadnienie | Standard/RFC |
|------|---------------|-------------------|--------------|--------------|
| **Telefon** | 50 znaków | **30 znaków** | E.164: max 15 cyfr + formatowanie (spacje, myślniki, +, nawiasy). 30 znaków wystarczy dla najdłuższych formatowanych numerów. | E.164 (ITU-T) |
| **Email** | 255 znaków | **254 znaków** | RFC 5321: lokalna część (64) + @ + domena (253) = 320, ale praktycznie max 254. 255 jest OK, ale 254 to dokładny standard. | RFC 5321 |
| **Website/URL** | 500 znaków | **2048 znaków** | RFC 7230: URL może być bardzo długi (do 8000 w teorii), ale przeglądarki limitują do ~2000. 2048 to bezpieczny limit. | RFC 7230, praktyka przeglądarek |
| **Imię** | 100 znaków | **50 znaków** | Rzadko przekracza 30-40 znaków. 50 to bezpieczny limit z marginesem. | Praktyka |
| **Nazwisko** | 100 znaków | **50 znaków** | Podobnie jak imię. | Praktyka |
| **Nazwa agencji** | 200 znaków | **150 znaków** | Nazwy firm rzadko przekraczają 100 znaków. 150 to rozsądny limit. | Praktyka |
| **Adres** | 500 znaków | **500 znaków** | ✅ OK - pełne adresy mogą być długie (ulica, miasto, kod pocztowy, kraj). | Praktyka |
| **Źródło** | 200 znaków | **100 znaków** | Krótkie wartości jak "Lead", "Polecenie", "Wydarzenie". 100 wystarczy. | Praktyka |
| **Stanowisko** | 100 znaków | **100 znaków** | ✅ OK - stanowiska mogą być długie. | Praktyka |
| **Tytuł zadania** | 200 znaków | **150 znaków** | Tytuły powinny być zwięzłe. 150 to rozsądny limit. | Praktyka |
| **Opis zadania** | 2000 znaków | **5000 znaków** | Opisy mogą być dłuższe. Zwiększenie do 5000 dla lepszej funkcjonalności. | Praktyka |
| **Notatki kontaktu** | 5000 znaków | **10000 znaków** | Notatki z kontaktów mogą być bardzo szczegółowe. 10000 pozwoli na pełne notatki. | Praktyka |
| **Nazwa grupy** | 100 znaków | **100 znaków** | ✅ OK - nazwy grup są zwykle krótkie. | Praktyka |
| **Opis grupy** | 500 znaków | **500 znaków** | ✅ OK - opisy grup nie muszą być bardzo długie. | Praktyka |

---

## 🔍 Szczegółowa analiza

### 1. **Telefon** 
**Aktualnie:** 50 znaków  
**Proponuję:** 30 znaków

**Uzasadnienie:**
- Standard E.164: maksymalnie 15 cyfr (bez formatowania)
- Najdłuższy możliwy formatowany numer: `+48 (123) 456-789-0123` = ~25 znaków
- 30 znaków daje bezpieczny margines
- **Zmniejszenie z 50 → 30** zmniejsza ryzyko wprowadzenia nieprawidłowych danych

**Przykłady:**
- ✅ `+48 123 456 789` (13 znaków)
- ✅ `(123) 456-7890` (14 znaków)
- ✅ `+1 (555) 123-4567` (17 znaków)
- ❌ `000000000-00000000000ccdvdfgdfgd!` (32 znaki) - zostanie odrzucone

---

### 2. **Email**
**Aktualnie:** 255 znaków  
**Proponuję:** 254 znaków (lub zostaw 255)

**Uzasadnienie:**
- RFC 5321: lokalna część max 64 znaki, domena max 253 znaki
- Praktycznie: max 254 znaki (64 + 1 + 253 - 2 dla @ i granic)
- 255 jest OK, ale 254 to dokładny standard
- **Można zostawić 255** - różnica minimalna

---

### 3. **Website/URL**
**Aktualnie:** 500 znaków  
**Proponuję:** 2048 znaków

**Uzasadnienie:**
- RFC 7230: URL może być bardzo długi
- Przeglądarki: Chrome/Safari limitują do ~2000 znaków
- Długie URL z parametrami mogą przekraczać 500 znaków
- **Zwiększenie z 500 → 2048** dla lepszej kompatybilności

**Przykłady długich URL:**
- `https://example.com/path/to/page?param1=value1&param2=value2&...` (może być >500)
- URL z tracking parameters

---

### 4. **Imię / Nazwisko**
**Aktualnie:** 100 znaków  
**Proponuję:** 50 znaków

**Uzasadnienie:**
- Najdłuższe polskie imiona/nazwiska: ~25-30 znaków
- 50 znaków to bezpieczny limit z dużym marginesem
- **Zmniejszenie z 100 → 50** zapobiega wprowadzaniu nieprawidłowych danych
- Wciąż wystarczające dla wszystkich realnych przypadków

---

### 5. **Nazwa agencji**
**Aktualnie:** 200 znaków  
**Proponuję:** 150 znaków

**Uzasadnienie:**
- Nazwy firm rzadko przekraczają 80-100 znaków
- 150 to rozsądny limit z marginesem
- **Zmniejszenie z 200 → 150** bez wpływu na funkcjonalność

---

### 6. **Źródło**
**Aktualnie:** 200 znaków  
**Proponuję:** 100 znaków

**Uzasadnienie:**
- Krótkie wartości: "Lead", "Polecenie", "Wydarzenie", "LinkedIn", "Facebook"
- Rzadko przekracza 50 znaków
- **Zmniejszenie z 200 → 100** wystarczające

---

### 7. **Tytuł zadania**
**Aktualnie:** 200 znaków  
**Proponuję:** 150 znaków

**Uzasadnienie:**
- Tytuły powinny być zwięzłe i czytelne
- 150 znaków to ~20-25 słów - wystarczające dla dobrego tytułu
- **Zmniejszenie z 200 → 150** zachęca do zwięzłości

---

### 8. **Opis zadania**
**Aktualnie:** 2000 znaków  
**Proponuję:** 5000 znaków

**Uzasadnienie:**
- Opisy mogą zawierać szczegółowe instrukcje
- 2000 znaków to ~300-400 słów
- 5000 znaków to ~800-1000 słów - lepsze dla szczegółowych opisów
- **Zwiększenie z 2000 → 5000** dla lepszej funkcjonalności

---

### 9. **Notatki kontaktu**
**Aktualnie:** 5000 znaków  
**Proponuję:** 10000 znaków

**Uzasadnienie:**
- Notatki z kontaktów mogą być bardzo szczegółowe
- Zawierają kontekst rozmowy, ustalenia, follow-up
- 10000 znaków to ~1500-2000 słów - wystarczające dla pełnych notatek
- **Zwiększenie z 5000 → 10000** dla lepszej funkcjonalności

---

## 📋 Podsumowanie proponowanych zmian

### Zmniejszenia (bezpieczeństwo):
- Telefon: 50 → **30** znaków
- Imię: 100 → **50** znaków
- Nazwisko: 100 → **50** znaków
- Nazwa agencji: 200 → **150** znaków
- Źródło: 200 → **100** znaków
- Tytuł zadania: 200 → **150** znaków

### Zwiększenia (funkcjonalność):
- Website: 500 → **2048** znaków
- Opis zadania: 2000 → **5000** znaków
- Notatki kontaktu: 5000 → **10000** znaków

### Bez zmian (OK):
- Email: 255 znaków ✅
- Adres: 500 znaków ✅
- Stanowisko: 100 znaków ✅
- Nazwa grupy: 100 znaków ✅
- Opis grupy: 500 znaków ✅

---

## 🎯 Rekomendacja

**Wszystkie proponowane zmiany są bezpieczne i poprawią:**
1. **Bezpieczeństwo** - mniejsze limity zapobiegają wprowadzaniu nieprawidłowych danych
2. **Funkcjonalność** - większe limity dla opisów/notatek pozwalają na więcej szczegółów
3. **Zgodność ze standardami** - limity zgodne z RFC i best practices

**Czy zatwierdzasz te zmiany?**

Po zatwierdzeniu zaktualizuję:
- `src/lib/field-validators.ts`
- Wszystkie schematy walidacji w API routes
- Dokumentację

