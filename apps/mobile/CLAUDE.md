# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Start Expo dev server (alias: `npx expo start`)
- `npm run android` — Run on Android emulator
- `npm run ios` — Run on iOS simulator
- `npm run web` — Run in web browser
- `npm run lint` — Run ESLint
- `npx tsc --noEmit` — TypeScript type check

## Architecture

This is an Expo (SDK 54) React Native app with TypeScript, targeting iOS, Android, and web. It is a BGS corporate mobile app with Mongolian UI.

### Routing

File-based routing via **expo-router** with typed routes enabled. The `app/` directory defines the route structure:

- `app/_layout.tsx` — Root Stack navigator with `AuthGate` (handles all auth redirects)
- `app/login.tsx` — OTP login entry (phone + register number)
- `app/otp.tsx` — OTP verification screen
- `app/unlock.tsx` — Biometric lock screen (shown when session exists + biometricEnabled)
- `app/(tabs)/` — 5-tab bottom navigator (Home, Services, Scan, Notifications, Profile)
  - `index.tsx` — Home screen with attendance, services grid, highlights
  - `services.tsx` — Service grid by category + company files (segmented tabs)
  - `scan.tsx` — QR scanner placeholder
  - `notifications.tsx` — Notifications + news (segmented tabs)
  - `profile.tsx` — User profile with QR code and settings
- `app/services/` — Service detail screens (pushed from service grid)
  - `attendance.tsx` — Detailed attendance (Ирц): 14-day view with scheduled/punch times, late/early flags
  - `leave.tsx` — Leave request list and form
  - `phone-directory.tsx` — Company phone directory
- `app/modal.tsx` — Modal screen presented over tabs

### Auth Flow

Auth state lives in `stores/auth-store.ts`. Navigation is handled by `AuthGate` in `app/_layout.tsx`.

**`initialize()` sequence (runs on app start):**
1. `supabase.auth.getSession()` — restore session from storage
2. If session exists → `fetchDbUser()` to load user profile
3. Check biometric hardware support + read `biometricEnabled` from SecureStore
4. Set `isLoading: false` → `AuthGate` runs and redirects based on state

**`AuthGate` redirect logic:**
- No session → `/login`
- Session + `biometricEnabled` + `!isUnlocked` → `/unlock`
- Session + unlocked, but on auth screen or `/unlock` → `/(tabs)`

**Unlock screen (`app/unlock.tsx`):**
- Shows user's name and two buttons
- "Нэвтрэх" (with fingerprint icon) — manually triggers `promptBiometric()`; on success calls `setUnlocked()` → AuthGate navigates to `/(tabs)`
- "OTP-р нэвтрэх" — calls `logout()` → session cleared + biometric disabled → AuthGate navigates to `/login`
- Biometric is **never** triggered automatically on app start — always user-initiated

**Key auth store actions:**
- `verifyOtp()` — sets `isUnlocked: true` on success (OTP is proof of identity; no biometric needed after)
- `logout()` — signs out, disables biometric in SecureStore, resets all auth state
- `setBiometricEnabled(true)` — prompts biometric first; only enables if successful

**Biometric utilities** (`lib/biometric.ts`):
- `checkBiometricSupport()` — checks hardware + enrollment
- `getBiometricEnabled()` / `setBiometricEnabled()` — SecureStore key `bgs_biometric_enabled`
- `promptBiometric()` — wraps `expo-local-authentication` with Mongolian prompt strings

### Styling

- **NativeWind** (Tailwind CSS for React Native) via `global.css` and `tailwind.config.js`
- Custom colors: `primary`, `danger`, `success`, `muted`, `card`, `border` in tailwind config
- Dark mode supported via `dark:` prefix classes
- UI primitives in `components/ui/`: Card, Badge, Button, Avatar, SegmentTabs, SearchBar

### State Management

- **Zustand** stores in `stores/`: `auth-store`, `attendance-store`, `app-store`
- `app-store` tracks active segment tab index for home, services, notifications, and profile screens
- **TanStack Query** for data fetching with query keys in `lib/query-keys.ts`
- API client in `lib/api.ts` — uses Supabase RPCs for attendance, mock data for other services

### Data & Backend

- **Supabase** backend configured in `lib/supabase.ts`
- Auth: phone OTP via Supabase Auth, user data from `users` table
- `users.bteg_id` = `worker_id` used for attendance RPCs
- Attendance data: `get_worker_attendance` RPC → `target.vw_worker_day_log_14d` view
  - `start_at` / `end_at` = scheduled check-in/out times
  - `work_start_at` / `work_end_at` = actual punch-in/out times
  - `is_hotsorson` = late, `is_ert_tarsan` = early departure
  - Timestamps are `timestamp without time zone` — use `getHours()`/`getMinutes()`, NOT `getUTCHours()`
- Mock data in `mock/data.ts` for services, news, files, notifications — swap for real APIs later

### Icons

- **Lucide React Native** (`lucide-react-native`) — requires `react-native-svg`
- Shared icon registry in `lib/icon-map.ts` — maps icon name strings to lucide components; used by both home and services grids

### Navigation

- Custom tab bar in `components/navigation/custom-tab-bar.tsx`
- Center QR tab has elevated circular button with negative margin
- Service grid items navigate via `item.route` property (e.g. `"/services/attendance"`)

### Key Directories

- `app/services/` — Service detail screens (each service gets its own screen here)
- `components/home/` — Home screen components (attendance, time, birthday, service grid, highlights)
- `components/services/` — Service grid components (category section, grid item, grid), file list, news card, notification banner
- `components/notifications/` — Notification list (date-grouped) and news list with search
- `components/profile/` — Profile screen components (header, QR section, actions)
- `components/ui/` — Reusable UI primitives
- `lib/` — API client, Supabase client, biometric helpers, query keys, icon map
- `mock/data.ts` — Mock data (user, service categories, services, news, files, notifications)
- `constants/strings.ts` — All Mongolian UI strings
- `types/index.ts` — TypeScript interfaces

### Key Types

- `ServiceCategory` — `{ id, title, order }` for grouping services
- `ServiceItem` — `{ id, title, icon, route?, categoryId?, iconBg?, iconColor?, badge?, badgeVariant? }`
- `AttendanceDetailDay` — `{ dayDate, workStartAt, workEndAt, workDuration, statusId, isHotsorson, isErtTarsan, startAt, endAt }`
- `NewsItem`, `FileItem`, `Notification`, `User`, `AttendanceWeek`

### Auth Store State Shape

```ts
{
  session: Session | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean        // true during initialize(); gates AuthGate redirects
  isUnlocked: boolean       // true after biometric or OTP success
  phone: string
  biometricAvailable: boolean
  biometricEnabled: boolean
  error: string | null
  verifyLoading: boolean
  otpLoading: boolean
}
```

### Path Alias

`@/*` maps to the project root (configured in tsconfig.json). Use `@/components/...`, `@/lib/...`, `@/constants/...`.

### Key Config Flags (app.json)

- `newArchEnabled: true` — React Native New Architecture
- `reactCompiler: true` — React Compiler (automatic memoization)
- `typedRoutes: true` — Type-safe routing
