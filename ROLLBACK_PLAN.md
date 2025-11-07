# Plan Rollback - Refaktoryzacja DDD i SRP

## Data wdrożenia: 2025-01-XX
## Wersja: 0.4.0-beta

## ⚠️ WAŻNE - PRZED ROLLBACKIEM

**UWAGA:** Ta refaktoryzacja wprowadza duże zmiany architektoniczne. Rollback wymaga przywrócenia starych plików API routes.

## Co zostało zmienione

### Nowe pliki (można bezpiecznie usunąć):
- `src/domain/` - cały folder (warstwa domenowa)
- `src/application/` - cały folder (warstwa aplikacyjna)
- `src/infrastructure/` - cały folder (warstwa infrastruktury)
- `src/presentation/api/` - cały folder (nowe API routes)

### Zmodyfikowane pliki (wymagają przywrócenia):
- `src/app/api/clients/route.ts` - teraz tylko deleguje do presentation layer
- `src/app/api/clients/[id]/route.ts` - teraz tylko deleguje do presentation layer

## Procedura rollbacku

### Krok 1: Przywróć stare pliki API routes

```bash
# Sprawdź commit przed refaktoryzacją
git log --oneline --grep="DDD\|SRP\|refaktoryzacja" -n 1

# Przywróć stare pliki (zastąp <commit-hash> odpowiednim hashem)
git checkout <commit-hash> -- src/app/api/clients/route.ts
git checkout <commit-hash> -- src/app/api/clients/[id]/route.ts
```

### Krok 2: Usuń nowe foldery (opcjonalnie, jeśli chcesz całkowicie wycofać zmiany)

```bash
# UWAGA: To usunie wszystkie nowe pliki DDD
rm -rf src/domain
rm -rf src/application
rm -rf src/infrastructure
rm -rf src/presentation
```

### Krok 3: Sprawdź czy aplikacja działa

```bash
npm run build
npm run start
```

### Krok 4: Testy

Przetestuj podstawowe funkcje:
- [ ] Tworzenie klienta
- [ ] Edycja klienta
- [ ] Usuwanie klienta
- [ ] Lista klientów
- [ ] Filtrowanie klientów

## Alternatywny rollback (częściowy)

Jeśli chcesz zachować nową architekturę, ale przywrócić stare API routes:

1. Przywróć stare pliki API routes (Krok 1)
2. **NIE USUWAJ** folderów domain/application/infrastructure/presentation
3. Stare API routes będą działać niezależnie od nowej architektury

## Backup przed wdrożeniem

**PRZED WDROŻENIEM** wykonaj:

```bash
# Utwórz branch backup
git checkout -b backup-before-ddd-refactor
git add .
git commit -m "Backup przed refaktoryzacją DDD"
git push origin backup-before-ddd-refactor

# Wróć do main
git checkout main
```

## Weryfikacja po rollbacku

Po rollbacku sprawdź:

1. **Baza danych** - nie wymaga zmian (schemat Prisma nie został zmieniony)
2. **API endpoints** - powinny działać jak przed refaktoryzacją
3. **Frontend** - nie wymaga zmian (API interface się nie zmienił)

## Kontakt

W przypadku problemów z rollbackiem:
1. Sprawdź logi aplikacji
2. Sprawdź czy wszystkie zależności są zainstalowane
3. Sprawdź czy baza danych jest dostępna

