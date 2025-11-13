# Instrukcja wykonania migracji w produkcji

## Problem

Migracja `20251113102833_add_company_name_to_clients` musi być wykonana w produkcji przed użyciem kolumny `companyName` w kodzie.

## Metoda 1: Railway Web Interface (Rekomendowane)

1. Wejdź na [railway.app](https://railway.app)
2. Zaloguj się i otwórz projekt "poetic-beauty"
3. Otwórz serwis "projekt-crm"
4. Kliknij zakładkę **"Deployments"**
5. Kliknij na najnowszy deployment
6. Kliknij **"View Logs"** lub **"Open Terminal"**
7. W terminalu uruchom:

```bash
npx prisma migrate deploy
```

8. Sprawdź czy migracja została wykonana pomyślnie (powinien być komunikat o dodaniu kolumny)

## Metoda 2: Railway CLI (jeśli działa)

```bash
railway run npx prisma migrate deploy
```

**Uwaga:** Jeśli Railway CLI nie może połączyć się z bazą, użyj Metody 1.

## Metoda 3: Automatyczna (przy następnym deploy)

Dockerfile ma skrypt startowy, który automatycznie wykonuje migracje przy starcie aplikacji. Jeśli migracja nie została wykonana automatycznie, sprawdź logi aplikacji w Railway.

## Weryfikacja

Po wykonaniu migracji, sprawdź czy kolumna została dodana:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'companyName';
```

Lub sprawdź logi aplikacji - błąd "Application error" powinien zniknąć.

## Następne kroki

Po wykonaniu migracji:
1. Przywróć `companyName: true` we wszystkich selectach Prisma
2. Przywróć `companyName` w filtrach wyszukiwania
3. Wypchnij zmiany do produkcji
4. Przetestuj aplikację

