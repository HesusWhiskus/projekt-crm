# Checklista wydania / aktualizacji

Ten plik zawiera listę kroków do wykonania przy każdej poprawce lub dużej aktualizacji projektu.

## Przed rozpoczęciem pracy

- [ ] Upewnij się, że jesteś na aktualnej gałęzi (zwykle `main` lub `master`)
- [ ] Pobierz najnowsze zmiany: `git pull`
- [ ] Sprawdź status repozytorium: `git status`

## Podczas pracy

- [ ] Wprowadź zmiany w kodzie
- [ ] Przetestuj zmiany lokalnie
- [ ] Sprawdź czy nie ma błędów lintowania: `npm run lint`
- [ ] Upewnij się, że aplikacja się buduje: `npm run build`

## Po zakończeniu pracy - przed commitem

### 1. Aktualizacja wersjonowania

- [ ] Zaktualizuj wersję w `package.json`:
  - Dla poprawek błędów: zwiększ ostatnią cyfrę (np. `0.4.3-beta` → `0.4.4-beta`)
  - Dla nowych funkcjonalności: zwiększ środkową cyfrę (np. `0.4.3-beta` → `0.5.0-beta`)
  - Dla dużych zmian: zwiększ pierwszą cyfrę (np. `0.4.3-beta` → `1.0.0-beta`)

### 2. Aktualizacja CHANGELOG.md

- [ ] Dodaj nowy wpis na górze pliku `CHANGELOG.md`
- [ ] Użyj formatu zgodnego z [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/):
  ```markdown
  ## [WERSJA] - RRRR-MM-DD
  
  ### Dodano
  - Opis nowych funkcjonalności
  
  ### Zmieniono
  - Opis zmian w istniejących funkcjonalnościach
  
  ### Naprawiono
  - Opis naprawionych błędów
  
  ### Usunięto
  - Opis usuniętych funkcjonalności (jeśli dotyczy)
  ```
- [ ] Upewnij się, że data jest aktualna
- [ ] Dodaj sekcję "Uwagi techniczne" jeśli są wymagane migracje lub inne ważne informacje

### 3. Aktualizacja dokumentacji

- [ ] Sprawdź czy zmiany wymagają aktualizacji `API_DOCUMENTATION.md`:
  - Nowe endpointy
  - Zmiany w istniejących endpointach
  - Nowe parametry
  - Zmiany w formatach odpowiedzi
- [ ] Sprawdź czy zmiany wymagają aktualizacji `README.md`:
  - Nowe funkcjonalności
  - Zmiany w instalacji
  - Zmiany w konfiguracji
- [ ] Sprawdź czy zmiany wymagają aktualizacji innych plików dokumentacji:
  - `FEATURES.md` - nowe funkcjonalności
  - `INSTALACJA.md` - zmiany w procesie instalacji
  - `DEPLOY.md` - zmiany w procesie wdrażania

### 4. Przygotowanie do commita

- [ ] Sprawdź status zmian: `git status`
- [ ] Przejrzyj zmiany: `git diff`
- [ ] Dodaj zmienione pliki: `git add <pliki>`
- [ ] Upewnij się, że nie dodajesz niepotrzebnych plików (sprawdź `.gitignore`)

### 5. Commit

- [ ] Utwórz commit z opisowym komunikatem:
  - Format: `typ: Krótki opis zmian`
  - Typy: `fix:`, `feat:`, `docs:`, `refactor:`, `style:`, `test:`, `chore:`
  - Przykład: `fix: Naprawiono bug z dodawaniem notatek - poprawiona inicjalizacja clientId`
- [ ] Upewnij się, że commit zawiera wszystkie potrzebne zmiany

### 6. Push do repozytorium

- [ ] Wykonaj push: `git push`
- [ ] Sprawdź czy push się powiódł
- [ ] Sprawdź czy zmiany są widoczne w repozytorium zdalnym

## Po pushu

- [ ] Sprawdź czy build w CI/CD (jeśli jest skonfigurowany) przechodzi pomyślnie
- [ ] Sprawdź czy aplikacja działa poprawnie w środowisku testowym/produkcyjnym
- [ ] Poinformuj zespół o nowej wersji (jeśli dotyczy)

## Dodatkowe uwagi

### Wersjonowanie

Projekt używa [Semantic Versioning](https://semver.org/lang/pl/):
- Format: `MAJOR.MINOR.PATCH-beta`
- `MAJOR` - duże zmiany, niekompatybilne wstecz
- `MINOR` - nowe funkcjonalności, kompatybilne wstecz
- `PATCH` - poprawki błędów, kompatybilne wstecz
- `-beta` - oznacza wersję beta

### Format commitów

Używamy konwencji [Conventional Commits](https://www.conventionalcommits.org/):
- `fix:` - naprawa błędu
- `feat:` - nowa funkcjonalność
- `docs:` - zmiany w dokumentacji
- `refactor:` - refaktoryzacja kodu
- `style:` - zmiany formatowania
- `test:` - dodanie/zmiana testów
- `chore:` - zmiany w buildzie, zależnościach, itp.

### Ważne pliki do sprawdzenia

Przy każdej aktualizacji sprawdź czy nie trzeba zaktualizować:
- `package.json` - wersja
- `CHANGELOG.md` - historia zmian
- `API_DOCUMENTATION.md` - dokumentacja API
- `README.md` - główna dokumentacja
- `FEATURES.md` - lista funkcjonalności
- Inne pliki dokumentacji w katalogu głównym

## Przykład pełnego procesu

```bash
# 1. Aktualizacja wersji
# Edytuj package.json: "version": "0.4.4-beta"

# 2. Aktualizacja CHANGELOG.md
# Dodaj wpis na górze pliku

# 3. Sprawdź dokumentację
# Zaktualizuj API_DOCUMENTATION.md jeśli potrzeba

# 4. Dodaj zmiany
git add src/components/contacts/contact-form.tsx package.json CHANGELOG.md

# 5. Commit
git commit -m "fix: Naprawiono bug z dodawaniem notatek - poprawiona inicjalizacja clientId"

# 6. Push
git push
```

---

**Uwaga:** Ta checklista powinna być używana przy każdej poprawce lub dużej aktualizacji projektu, aby zapewnić spójność i kompletność dokumentacji oraz wersjonowania.

