# Analiza Design System iBooster - Na podstawie screenów

## Obserwacje z screenów iBooster

### 1. Kolorystyka
- **Primary Accent:** Pomarańczowy `#f97316` (Orange-500)
- **Aktywny element:** Pomarańczowe tło z białym tekstem
- **Nieaktywny element:** Szary outline/tekst
- **Główne akcje:** Czerwony przycisk "filtruj oferty"
- **Dodatkowe akcje:** Ciemnoniebieski przycisk
- **Tło:** Białe karty na jasnoszarym tle
- **Tekst:** Ciemnoszary/czarny dla czytelności

### 2. Sidebar (zwinięty)
- **Szerokość:** Wąski, tylko ikony (~64px)
- **Ikony:** Szare, wyśrodkowane
- **Brak tekstu:** Tylko ikony widoczne
- **Brak separatorów:** Czysty widok ikonowy
- **Tooltips:** Prawdopodobnie przy hover (nie widoczne na screenie)

### 3. Layout i Spacing
- **Karty:** Białe karty z subtelnymi cieniami
- **Padding:** Generous padding w kartach
- **Marginesy:** Dobrze zorganizowane sekcje z odpowiednimi odstępami
- **Border Radius:** Zaokrąglone rogi kart (prawdopodobnie 8px)

### 4. Typography
- **Nagłówki:** Czytelne, ciemne na jasnym tle
- **Tekst:** Dobra czytelność, odpowiednie rozmiary
- **Hierarchia:** Jasna hierarchia wizualna

### 5. Komponenty
- **Przyciski:** Różne kolory dla różnych akcji (czerwony główny, niebieski dodatkowy, pomarańczowy wybór)
- **Inputy:** Pomarańczowe obramowanie przy aktywności
- **Checkboxy:** Pomarańczowe checkmarki
- **Ikony:** Szare domyślnie, pomarańczowe przy aktywności

### 6. Progress Indicator
- **Aktywny krok:** Wypełniony pomarańczowy
- **Następny krok:** Outline pomarańczowy
- **Nieaktywny:** Szary

## Plan refaktoryzacji na podstawie analizy

### Faza 1: Kolorystyka i motywy
- ✅ Domyślny motyw: pomarańczowy (iBooster)
- ✅ Wszystkie motywy konfigurowalne (orange, blue, green, purple, red, custom, system)
- ✅ Dynamiczna aktualizacja CSS variables

### Faza 2: Sidebar
- ✅ Widok zwinięty: tylko ikony, wyśrodkowane
- ✅ Tooltips przy hover
- ✅ Przycisk zwijania zawsze widoczny (sticky)
- ✅ Ukrycie separatorów i nagłówków w widoku zwiniętym

### Faza 3: Komponenty UI
- [ ] Ujednolicenie przycisków (główny akcent, dodatkowe akcje)
- [ ] Pomarańczowe obramowania przy aktywnych inputach
- [ ] Pomarańczowe checkmarki w checkboxach
- [ ] Progress indicator z pomarańczowym akcentem

### Faza 4: Layout i spacing
- [ ] Białe karty z subtelnymi cieniami
- [ ] Generous padding w kartach
- [ ] Odpowiednie marginesy między sekcjami
- [ ] Border radius 8px dla kart

### Faza 5: Typography
- [ ] Czytelne nagłówki
- [ ] Dobra hierarchia wizualna
- [ ] Odpowiednie rozmiary tekstu

### Faza 6: Ikony i wizualizacja
- [ ] Szare ikony domyślnie
- [ ] Pomarańczowe ikony przy aktywności
- [ ] Spójne rozmiary ikon

