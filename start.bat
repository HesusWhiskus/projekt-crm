@echo off
echo ========================================
echo Uruchamianie Internal CRM
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Node.js nie jest zainstalowany!
    echo Prosze zainstalowac Node.js 18+ z: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo [INFO] Zaleznosci nie sa zainstalowane. Uruchamiam instalacje...
    call npm install
)

REM Check if Prisma Client is generated
if not exist node_modules\.prisma (
    echo [INFO] Generowanie Prisma Client...
    call npm run db:generate
)

echo [INFO] Uruchamianie serwera deweloperskiego...
echo [INFO] Aplikacja bedzie dostepna pod: http://localhost:3000
echo.
call npm run dev


