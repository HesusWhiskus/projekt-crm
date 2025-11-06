# Plan implementacji ustawień użytkownika

## 📋 Przegląd

Dokument opisuje plan implementacji funkcjonalności ustawień użytkownika z rozróżnieniem między zwykłym użytkownikiem (USER) a administratorem (ADMIN).

---

## 🎯 Cele

1. **Ustawienia osobiste** - dostępne dla wszystkich użytkowników
2. **Ustawienia administratora** - dodatkowe funkcje dla ADMIN
3. **Bezpieczeństwo** - zmiana hasła, zarządzanie sesjami
4. **Integracje** - połączenia z zewnętrznymi serwisami (Google Calendar, etc.)

---

## 📁 Struktura plików

```
src/app/(dashboard)/
  settings/
    page.tsx                    # Główna strona ustawień (routing)
    profile/
      page.tsx                   # Ustawienia profilu (USER + ADMIN)
    security/
      page.tsx                   # Bezpieczeństwo - zmiana hasła (USER + ADMIN)
    preferences/
      page.tsx                   # Preferencje użytkownika (USER + ADMIN)
    admin/                       # Tylko ADMIN
      page.tsx                   # Ustawienia systemowe
      integrations/
        page.tsx                 # Integracje zewnętrzne
      system/
        page.tsx                 # Ustawienia systemowe (backup, etc.)

src/components/settings/
  settings-nav.tsx              # Nawigacja po sekcjach ustawień
  profile-settings.tsx           # Formularz edycji profilu
  security-settings.tsx          # Zmiana hasła, sesje
  preferences-settings.tsx       # Preferencje UI, powiadomienia
  color-scheme-picker.tsx        # Komponent wyboru kolorystyki
  admin-settings.tsx             # Ustawienia systemowe (ADMIN)
  admin-branding.tsx             # Personalizacja logo i nazwy (ADMIN)
  admin-integrations.tsx         # Zarządzanie integracjami (ADMIN)

src/app/api/
  users/
    profile/
      route.ts                   # ✅ Już istnieje - aktualizacja profilu
    password/
      route.ts                   # Zmiana hasła
    preferences/
      route.ts                   # Zapisywanie preferencji użytkownika
    sessions/
      route.ts                   # Lista aktywnych sesji
      [id]/
        route.ts                 # Wylogowanie z konkretnej sesji
  admin/
    settings/
      route.ts                   # Ustawienia systemowe (ADMIN)
    integrations/
      route.ts                   # Zarządzanie integracjami (ADMIN)
```

---

## 🔐 Funkcjonalności dla USER

### 1. **Profil** (`/settings/profile`)
- ✅ Edycja imienia i nazwiska (już istnieje)
- ✅ Edycja stanowiska (już istnieje)
- ✅ Zmiana zdjęcia profilowego (już istnieje)
- ⚠️ Edycja emaila (wymaga weryfikacji - opcjonalnie)

### 2. **Bezpieczeństwo** (`/settings/security`)
- 🔒 **Zmiana hasła**
  - Aktualne hasło (weryfikacja)
  - Nowe hasło (min. 8 znaków)
  - Potwierdzenie nowego hasła
  - Walidacja siły hasła
- 📱 **Aktywne sesje**
  - Lista urządzeń/browserów z aktywnymi sesjami
  - Data ostatniego logowania
  - Możliwość wylogowania z konkretnej sesji
  - "Wyloguj ze wszystkich urządzeń"

### 3. **Preferencje** (`/settings/preferences`)
- 🎨 **Preferencje interfejsu**
  - **Kolorystyka/Theme** - wybór kolorów interfejsu
    - Predefiniowane motywy kolorystyczne (np. niebieski, zielony, fioletowy, czerwony)
    - Niestandardowy kolor główny (color picker)
    - Podgląd zmian w czasie rzeczywistym
    - Zastosowanie do całego interfejsu (przyciski, linki, akcenty, nawigacja)
    - Opcja "Użyj domyślnej kolorystyki systemu" (dla USER)
- Motyw (jasny/ciemny) - jeśli będzie implementacja
- Język interfejsu (PL/EN) - jeśli będzie implementacja
- 🔔 **Powiadomienia** (opcjonalnie - jeśli będzie system powiadomień)
  - Email powiadomienia o zadaniach
  - Email powiadomienia o kontaktach
  - Powiadomienia push (opcjonalnie)

---

## 👑 Funkcjonalności dla ADMIN

### 1. **Wszystkie funkcje USER** + dodatkowo:

### 2. **Ustawienia systemowe** (`/settings/admin`)
- ⚙️ **Ogólne ustawienia**
  - **Personalizacja systemu**
    - Nazwa systemu/CRM (wyświetlana w nagłówku, tytule strony)
    - Logo systemu (upload pliku, podgląd, wymagania: max rozmiar, formaty)
    - Domyślna kolorystyka systemu (dla nowych użytkowników)
    - Podgląd zmian w czasie rzeczywistym
  - Domyślne ustawienia dla nowych użytkowników
- 🔐 **Bezpieczeństwo systemu**
  - Minimalna długość hasła
  - Wymaganie silnego hasła
  - Czas wygaśnięcia sesji
  - Wymaganie 2FA (opcjonalnie - przyszłość)
- 📊 **Backup i eksport**
  - Ręczne tworzenie backupu bazy danych
  - Automatyczne backupy (harmonogram)
  - Eksport danych do CSV/JSON

### 3. **Integracje** (`/settings/admin/integrations`)
- 📅 **Google Calendar**
  - Status połączenia (połączone/niepołączone)
  - Przycisk "Połącz z Google Calendar"
  - OAuth flow
  - Ustawienia synchronizacji
- 📧 **Email/SMTP** (opcjonalnie)
  - Konfiguracja serwera SMTP
  - Test wysyłki email
- 🔗 **Inne integracje** (przyszłość)
  - Slack
  - Microsoft Teams
  - etc.

---

## 🎨 UI/UX Design

### Struktura nawigacji

```
┌─────────────────────────────────────┐
│  Ustawienia                         │
├─────────────────────────────────────┤
│  📝 Profil                          │
│  🔒 Bezpieczeństwo                  │
│  ⚙️  Preferencje                    │
│    • Kolorystyka                    │
│    • Motyw                          │
│    • Język                          │
│                                     │
│  ────────────────────────────────  │
│  👑 Administrator (tylko ADMIN)    │
│  ⚙️  Ustawienia systemowe           │
│    • Personalizacja (logo, nazwa)   │
│    • Domyślna kolorystyka           │
│    • Bezpieczeństwo                 │
│  🔗 Integracje                      │
└─────────────────────────────────────┘
```

### Komponent wyboru kolorystyki

```
┌─────────────────────────────────────┐
│  Kolorystyka interfejsu            │
├─────────────────────────────────────┤
│                                     │
│  Predefiniowane motywy:            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│  │ 🔵  │ │ 🟢  │ │ 🟣  │ │ 🔴  │ │
│  │Niebi│ │Ziel │ │Fiol │ │Czer │ │
│  └─────┘ └─────┘ └─────┘ └─────┘ │
│                                     │
│  Niestandardowy kolor:             │
│  ┌─────────────────────────────┐  │
│  │  [Color Picker]  #3b82f6    │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Podgląd zmian]                    │
│  ┌─────────────────────────────┐  │
│  │  [Przycisk przykładowy]      │  │
│  │  Link przykładowy          │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Zapisz zmiany]                    │
└─────────────────────────────────────┘
```

### Komponent personalizacji systemu (ADMIN)

```
┌─────────────────────────────────────┐
│  Personalizacja systemu            │
├─────────────────────────────────────┤
│                                     │
│  Nazwa systemu:                     │
│  ┌─────────────────────────────┐  │
│  │ Internal CRM                 │  │
│  └─────────────────────────────┘  │
│                                     │
│  Logo systemu:                      │
│  ┌─────────────────────────────┐  │
│  │  [Aktualne logo]             │  │
│  │  [Prześlij nowe logo]        │  │
│  └─────────────────────────────┘  │
│  Format: PNG, JPG, SVG (max 2MB)  │
│                                     │
│  Domyślna kolorystyka:              │
│  [Ten sam komponent co wyżej]      │
│                                     │
│  [Podgląd w nagłówku]               │
│  ┌─────────────────────────────┐  │
│  │  [Logo] Internal CRM        │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Zapisz zmiany]                    │
└─────────────────────────────────────┘
```

### Layout strony ustawień

```
┌─────────────────────────────────────────────────────────┐
│  [Dashboard Nav]                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │              │  │  Ustawienia                     │ │
│  │  Nawigacja   │  │                                 │ │
│  │  (sidebar)   │  │  [Zawartość wybranej sekcji]    │ │
│  │              │  │                                 │ │
│  │  • Profil    │  │                                 │ │
│  │  • Bezpiecz. │  │                                 │ │
│  │  • Preferenc.│  │                                 │ │
│  │              │  │                                 │ │
│  │  ──────────  │  │                                 │ │
│  │              │  │                                 │ │
│  │  • Admin     │  │                                 │ │
│  │    (ADMIN)   │  │                                 │ │
│  └──────────────┘  └─────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### USER endpoints

#### `PATCH /api/users/profile`
- ✅ Już istnieje
- Aktualizacja: imię, nazwisko, stanowisko, zdjęcie

#### `PATCH /api/users/password`
```typescript
Request: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
Response: {
  success: boolean
  message: string
}
```

#### `GET /api/users/sessions`
```typescript
Response: {
  sessions: Array<{
    id: string
    device: string
    browser: string
    location?: string
    lastActive: Date
    current: boolean
  }>
}
```

#### `DELETE /api/users/sessions/[id]`
- Wylogowanie z konkretnej sesji

#### `DELETE /api/users/sessions/all`
- Wylogowanie ze wszystkich sesji oprócz obecnej

#### `PATCH /api/users/preferences`
```typescript
Request: {
  theme?: 'light' | 'dark'
  language?: 'pl' | 'en'
  colorScheme?: {
    primaryColor?: string  // Hex color (np. #3b82f6)
    themeName?: string    // 'blue' | 'green' | 'purple' | 'red' | 'custom'
  }
  notifications?: {
    emailTasks?: boolean
    emailContacts?: boolean
  }
}
```

### ADMIN endpoints

#### `GET /api/admin/settings`
- Pobranie ustawień systemowych

#### `PATCH /api/admin/settings`
```typescript
Request: {
  systemName?: string
  logo?: string | File  // Base64 string lub URL do przesłanego pliku
  defaultColorScheme?: {
    primaryColor?: string
    themeName?: string
  }
  passwordMinLength?: number
  requireStrongPassword?: boolean
  sessionTimeout?: number
}
```

#### `POST /api/admin/settings/logo`
- Upload logo systemu (multipart/form-data)
- Walidacja: format (PNG, JPG, SVG), rozmiar (max 2MB), wymiary
```typescript
Request: FormData {
  logo: File
}
Response: {
  logoUrl: string
  message: string
}
```

#### `GET /api/admin/integrations`
- Lista integracji i ich status

#### `POST /api/admin/integrations/google-calendar/connect`
- Inicjacja OAuth flow dla Google Calendar

#### `DELETE /api/admin/integrations/google-calendar/disconnect`
- Rozłączenie Google Calendar

---

## 🗄️ Rozszerzenie schematu bazy danych (opcjonalnie)

### Tabela `user_preferences` (opcjonalnie)
```prisma
model UserPreferences {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  theme     String?  @default("light") // "light" | "dark"
  language  String?  @default("pl")   // "pl" | "en"
  
  // Kolorystyka
  primaryColor String?  // Hex color (np. #3b82f6)
  themeName    String?  // "blue" | "green" | "purple" | "red" | "custom"
  
  // Powiadomienia
  emailTasks     Boolean @default(true)
  emailContacts  Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("user_preferences")
}
```

### Tabela `system_settings` (opcjonalnie)
```prisma
model SystemSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON string
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("system_settings")
}

// Przykładowe klucze:
// - "system_name" → "Internal CRM"
// - "system_logo" → "/uploads/logo.png" lub base64
// - "default_color_scheme" → JSON: {"primaryColor": "#3b82f6", "themeName": "blue"}
// - "password_min_length" → "8"
// - "session_timeout" → "3600"
```

### Tabela `user_sessions` (opcjonalnie - jeśli NextAuth nie wystarczy)
```prisma
model UserSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  token     String   @unique
  device    String?
  browser   String?
  ipAddress String?
  location  String?
  
  lastActive DateTime @default(now())
  expiresAt  DateTime
  
  createdAt DateTime @default(now())
  
  @@map("user_sessions")
}
```

**Uwaga:** Jeśli NextAuth już zarządza sesjami, możemy użyć istniejących mechanizmów.

---

## 📝 Implementacja krok po kroku

### Faza 1: Podstawowe ustawienia USER
1. ✅ Strona `/settings` z routingiem
2. ✅ Nawigacja po sekcjach (sidebar)
3. ✅ Profil - rozszerzenie istniejącego
4. 🔒 Bezpieczeństwo - zmiana hasła
5. ⚙️ Preferencje - podstawowe ustawienia

### Faza 2: Zaawansowane funkcje USER
6. 📱 Aktywne sesje
7. 🔔 Powiadomienia (jeśli będzie system)

### Faza 3: Ustawienia ADMIN
8. 👑 Panel ustawień systemowych
9. 🔗 Integracje - Google Calendar
10. 📊 Backup i eksport

---

## 🔒 Bezpieczeństwo

### Zmiana hasła
- Wymagana weryfikacja aktualnego hasła
- Walidacja siły hasła (min. 8 znaków, opcjonalnie: wielkie litery, cyfry, znaki specjalne)
- Hashowanie przez bcryptjs (już używane)
- Logowanie zmiany hasła w ActivityLog

### Sesje
- Możliwość wylogowania z innych urządzeń
- Automatyczne czyszczenie wygasłych sesji
- Logowanie podejrzanych aktywności

### Ustawienia ADMIN
- Wszystkie zmiany wymagają uprawnień ADMIN
- Logowanie wszystkich zmian w ActivityLog
- Walidacja danych wejściowych

---

## 🎯 Priorytety implementacji

### Wysoki priorytet
1. ✅ Profil (już istnieje, może wymagać rozszerzenia)
2. 🔒 Zmiana hasła
3. 🎨 Kolorystyka interfejsu (USER + ADMIN)
4. 🏢 Personalizacja logo i nazwy systemu (ADMIN)
5. 📱 Aktywne sesje
6. 👑 Ustawienia systemowe (ADMIN)

### Średni priorytet
5. ⚙️ Preferencje użytkownika
6. 🔗 Integracje (Google Calendar)

### Niski priorytet
7. 🔔 Powiadomienia
8. 📊 Backup i eksport
9. 🌐 Wielojęzyczność
10. 🎨 Motywy (dark mode)

---

## 📋 Checklist przed implementacją

- [ ] Zaakceptowanie planu przez użytkownika
- [ ] Decyzja o rozszerzeniu schematu bazy danych
- [ ] Decyzja o implementacji sesji (NextAuth vs własna tabela)
- [ ] Decyzja o integracjach (które i w jakiej kolejności)
- [ ] Decyzja o preferencjach (motyw, język - czy teraz czy później)

---

## ❓ Pytania do rozstrzygnięcia

1. **Sesje:** Czy NextAuth wystarczy do zarządzania sesjami, czy potrzebujemy własnej tabeli?
2. **Email:** Czy użytkownik powinien móc zmieniać email? (wymaga weryfikacji)
3. **Kolorystyka:**
   - Które elementy interfejsu mają być stylizowane? (przyciski, linki, nawigacja, akcenty)
   - Czy używać CSS variables (CSS custom properties) do dynamicznej zmiany kolorów?
   - Czy kolorystyka ma być zapisywana w localStorage (szybki dostęp) czy tylko w bazie?
4. **Logo:**
   - Gdzie ma być przechowywane logo? (public/uploads, cloud storage, base64 w bazie?)
   - Jakie wymiary logo? (responsive, różne rozmiary dla różnych miejsc?)
   - Czy logo ma być widoczne tylko w nagłówku czy też w innych miejscach?
5. **Preferencje:** Czy implementować motyw (jasny/ciemny) i język teraz, czy później?
6. **Integracje:** Które integracje są priorytetowe? (Google Calendar, SMTP, inne?)
7. **Backup:** Czy backup ma być automatyczny czy tylko ręczny?
8. **2FA:** Czy planujemy dwuskładnikowe uwierzytelnianie w przyszłości?

---

## 📝 Notatki

- Istniejąca strona `/profile` może zostać przekierowana do `/settings/profile`
- Istniejący `ProfileForm` może zostać rozszerzony lub zastąpiony nowym komponentem
- API endpoint `/api/users/profile` już istnieje i działa
- W nawigacji głównej (`dashboard-nav.tsx`) można dodać link do ustawień

### Implementacja kolorystyki

**Techniczne podejście:**
1. Użycie CSS Variables (custom properties) dla dynamicznej zmiany kolorów
2. Przykład:
   ```css
   :root {
     --color-primary: #3b82f6; /* Domyślny */
   }
   
   [data-theme="blue"] {
     --color-primary: #3b82f6;
   }
   
   [data-theme="green"] {
     --color-primary: #10b981;
   }
   
   [data-theme="custom"] {
     --color-primary: var(--user-primary-color);
   }
   ```

3. Aplikacja kolorów w Tailwind CSS przez konfigurację:
   ```js
   // tailwind.config.ts
   theme: {
     extend: {
       colors: {
         primary: 'var(--color-primary)',
       }
     }
   }
   ```

4. Zapisywanie w bazie danych i localStorage (dla szybkiego dostępu)

### Implementacja logo

**Techniczne podejście:**
1. Upload do `public/uploads/logo/` lub cloud storage (Railway, AWS S3)
2. Zapisywanie ścieżki/URL w `system_settings` (klucz: "system_logo")
3. Wyświetlanie w komponencie `DashboardNav` z fallback do domyślnego logo
4. Walidacja: format (PNG, JPG, SVG), rozmiar (max 2MB), wymiary (opcjonalnie)

---

**Data utworzenia:** 2024-12-XX  
**Status:** Do akceptacji  
**Autor:** AI Assistant

