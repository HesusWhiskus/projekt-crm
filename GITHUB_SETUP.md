# Instrukcja dodania projektu do GitHub

## Krok 1: Utwórz repozytorium na GitHub

1. Wejdź na https://github.com
2. Zaloguj się
3. Kliknij "+" w prawym górnym rogu → "New repository"
4. Nazwa: `internal-crm` (lub dowolna)
5. Opis: "Internal CRM system for managing insurance agencies"
6. Wybierz **Public** lub **Private**
7. **NIE zaznaczaj** "Initialize with README"
8. Kliknij "Create repository"

## Krok 2: Połącz lokalne repozytorium z GitHub

Po utworzeniu repozytorium, GitHub pokaże instrukcje. Wykonaj w terminalu:

```bash
git remote add origin https://github.com/TWOJA-NAZWA-UZYTKOWNIKA/internal-crm.git
git branch -M main
git push -u origin main
```

**Zastąp `TWOJA-NAZWA-UZYTKOWNIKA` swoją nazwą użytkownika GitHub!**

## Krok 3: Weryfikacja

Sprawdź czy wszystko działa:
```bash
git remote -v
git status
```

---

**Gotowe!** Teraz projekt jest na GitHub i możesz przejść do wdrożenia demo.



