@echo off
echo ========================================
echo Instalacja Internal CRM
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Node.js nie jest zainstalowany!
    echo.
    echo Prosze zainstalowac Node.js 18+ z: https://nodejs.org/
    echo Nastepnie uruchom ponownie ten skrypt.
    pause
    exit /b 1
)

echo [OK] Node.js znaleziony
node --version
echo.

echo [1/5] Instalowanie zaleznosci...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Instalacja zaleznosci nie powiodla sie!
    pause
    exit /b 1
)
echo [OK] Zaleznosci zainstalowane
echo.

echo [2/5] Sprawdzanie pliku .env...
if not exist .env (
    echo [INFO] Tworzenie pliku .env z .env.example...
    copy .env.example .env >nul
    echo [OK] Plik .env utworzony
    echo [UWAGA] Prosze zaktualizowac NEXTAUTH_SECRET w pliku .env!
    echo         Uzyj: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
) else (
    echo [OK] Plik .env juz istnieje
)
echo.

echo [3/5] Generowanie Prisma Client...
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Generowanie Prisma Client nie powiodlo sie!
    pause
    exit /b 1
)
echo [OK] Prisma Client wygenerowany
echo.

echo [4/5] Sprawdzanie PostgreSQL...
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Docker znaleziony - sprawdzanie czy PostgreSQL jest uruchomiony...
    docker ps | findstr postgres >nul
    if %ERRORLEVEL% NEQ 0 (
        echo [INFO] Uruchamianie PostgreSQL w Docker...
        docker-compose up -d postgres
        timeout /t 5 /nobreak >nul
    ) else (
        echo [OK] PostgreSQL juz dziala
    )
) else (
    echo [UWAGA] Docker nie znaleziony - upewnij sie ze PostgreSQL jest uruchomiony lokalnie
)
echo.

echo [5/5] Uruchamianie migracji bazy danych...
call npm run db:migrate
if %ERRORLEVEL% NEQ 0 (
    echo [UWAGA] Migracje nie powiodly sie - upewnij sie ze PostgreSQL jest uruchomiony
    echo         i DATABASE_URL w .env jest poprawny
) else (
    echo [OK] Migracje wykonane
)
echo.

echo ========================================
echo Instalacja zakonczona!
echo ========================================
echo.
echo Aby uruchomic aplikacje, wykonaj:
echo   npm run dev
echo.
echo Aplikacja bedzie dostepna pod: http://localhost:3000
echo.
pause


