# Zasady pracy z projektem - RULES

## 🔧 Zasady Git

### ZAWSZE używaj skryptów npm z git-wrapper.js
- **NIGDY** nie używaj bezpośrednio komend `git` w terminalu
- **ZAWSZE** używaj skryptów npm: `npm run git:*`
- Skrypt automatycznie używa właściwej ścieżki projektu: `E:\VibeCode\Projekt CRM`

### Dostępne komendy Git:
```bash
npm run git:status      # Sprawdź status
npm run git:add:all     # Dodaj wszystkie pliki
npm run git:commit      # Commit (z -m "message")
npm run git:push        # Push do repozytorium
npm run git:pull        # Pull z repozytorium
npm run git:log         # Historia commitów
npm run git -- <cmd>    # Dowolna komenda git
```

### Workflow po zmianach:
1. **ZAWSZE** sprawdź status: `npm run git:status`
2. **ZAWSZE** dodaj zmiany: `npm run git:add:all`
3. **ZAWSZE** zrób commit z opisową wiadomością:
   - Jeśli commit z -m: użyj bezpośrednio `git commit -m "message"` w katalogu projektu
   - Skrypt git-wrapper.js ma problem z przekazywaniem argumentów -m przez npm
4. **ZAWSZE** zrób push: `npm run git:push`

## 🚀 Zasady Deployment

### Po naprawieniu błędów builda:
1. Sprawdź czy build lokalny działa: `npm run build`
2. Sprawdź czy nie ma błędów lintera: `npm run lint`
3. Dodaj zmiany do gita (zgodnie z workflow powyżej)
4. Zrób commit z opisem naprawy
5. Zrób push - Railway automatycznie zbuduje i wdroży

## 📝 Zasady pracy z kodem

### Przed każdą zmianą:
- Sprawdź historię i kontekst wcześniejszych zmian
- Sprawdź czy są otwarte pliki z instrukcjami
- Sprawdź czy są błędy builda lub lintera

### Po każdej zmianie:
- Sprawdź czy build działa: `npm run build`
- Sprawdź czy nie ma błędów: `npm run lint`
- Dodaj do gita i zrób push

## ⚠️ Ważne

- **NIGDY** nie commituj plików `.env`
- **ZAWSZE** używaj skryptów npm dla operacji git
- **ZAWSZE** sprawdzaj czy build działa przed pushem
- **ZAWSZE** rób push po naprawieniu błędów

