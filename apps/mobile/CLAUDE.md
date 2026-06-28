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
- `app/login.tsx` — **Native two-step OTP login** (register + phone → SMS code), no WebView. Calls `auth-store.requestOtp` (verify-user edge function → `signInWithOtp`) then `verifyOtp` (`auth.verifyOtp`). Same flow on web + native. (Previously embedded bgs.mn in a WebView/iframe; replaced for UX. `applyTokens` is kept in the store for any future deep-link/SSO.)
- `app/unlock.tsx` — Biometric lock screen (shown when session exists + biometricEnabled)
- `app/(tabs)/` — WeChat-style 4-tab bottom navigator, order: **Чат (Chat) · Харилцах (Contacts) · Үйлчилгээ (Mini-apps) · Миний (Profile)**. Custom floating-pill tab bar; default landing tab is Chat (`index`).
  - `index.tsx` — Chat list (WeChat-style), backed by the `mobile` schema (`api.getChatThreads` → `mobile.get_conversations`). `+` menu → new direct chat / new group / discover / scan. Default landing screen.
  - `mini-apps.tsx` — Services ("Үйлчилгээ"): a vertical list of services (`components/bgs/service-list.tsx`) from `constants/services.ts`, tap → `item.route`. (News, banners, notifications, the shift/QR card, and the notification bell were removed.)
  - `contacts.tsx` — Friend-model contacts: incoming requests, accepted contacts (tap-to-chat), my chat groups, my org groups. `+` → `/contacts/add`.
  - `profile.tsx` — User profile + settings; first row opens the digital ID / QR (`/profile/qr`).
- `app/chat/` — Chat conversation stack
  - `[id].tsx` — Conversation view: message bubbles + input bar. Real send via `api.sendChatMessage`; live updates via Supabase Realtime (`postgres_changes` on `mobile.messages`); marks read on open.
  - `new.tsx` — Pick from **accepted contacts** → `api.createDirectConversation` → open thread.
  - `new-group.tsx` — Multi-select **accepted contacts** + title + visibility (private/public) → `api.createGroupConversation` → open thread.
  - `discover.tsx` — Search **public groups** and send join requests (`api.searchPublicGroups` / `api.requestJoinGroup`).
  - `group/[id].tsx` — Group info: members, and for admins a visibility toggle + pending join-request approval. Opened by tapping the group title in the conversation header.
- `app/contacts/` — Contact management stack
  - `add.tsx` — Add people (segmented: search system users / browse org groups) → send friend request (`api.sendContactRequest`).
  - `group/[id].tsx` — Org group members (`api.getOrgGroupMembers`) with add/accept actions.
- `app/profile/` — Profile detail stack
  - `qr.tsx` — Digital ID card QR (formerly `(tabs)/scan.tsx`); brightness boost, mode segments.
  - `personal-info.tsx`, `documents.tsx`
- `app/services/` — Service detail screens (pushed from the mini-apps service grid)
  - `attendance.tsx` — Detailed attendance (Ирц): 14-day view with scheduled/punch times, late/early flags
  - `index.tsx` — Service grid by category + company files (segmented tabs)
- `app/modal.tsx` — Modal screen presented over tabs

Chat/contacts data: types `ChatThread`/`ChatMessage`/`EmployeeContact` in `types/index.ts`; query keys under `queryKeys.chat` and `queryKeys.phoneDirectory`. Chat/contacts UI components in `components/chat/` and `components/contacts/`.

Shared UI helpers: `components/ui/screen-header.tsx` (back + title + right slot — use on pushed screens instead of re-implementing headers); `lib/avatar-color.ts` (`avatarColor`/`avatarSoft` — deterministic per-name avatar colors for list rows); `lib/haptics.ts` (`tapLight`/`tapSuccess`); `hooks/use-debounced-value.ts` (debounce search inputs whose query key includes the term). Chat conversation (`app/chat/[id].tsx`) uses optimistic send (local outbox + realtime dedupe), paginated `get_messages` (limit 30, "load earlier"), and day separators. The Chat tab icon shows total unread (excludes official + muted) via `components/navigation/custom-tab-bar.tsx`.

Image/file messages: `messages.type` ∈ text/image/file/system with `attachment_url`/`attachment_name`/`attachment_mime`. Upload via `api.sendChatMedia` → public Storage bucket `chat-media` (random path) → `mobile.send_media_message` RPC (read-only on official; members only). UI: attach (+) button picks image (`expo-image-picker`) or file (`expo-document-picker`); image bubbles render with `expo-image`, file bubbles open via `Linking`. Note: `chat-media` is a **public** bucket (mirrors `leave-attachments`) — URLs are unguessable but unauthenticated-readable.

#### Chat backend — `mobile` schema (Supabase)

Chat lives in a dedicated **`mobile`** Postgres schema (separate from `public`; exposed to PostgREST via the `authenticator` role's `pgrst.db_schemas`). The mobile client reaches it with `supabase.schema("mobile").rpc(...)` (helper `mobileDb()` in `lib/api.ts`). The default client still uses `public`.

- **Tables**: `mobile.conversations` (`type` ∈ direct/group/official, `direct_key` unique for 1:1, denormalized `last_message_at`/`last_message_preview`), `mobile.conversation_members` (`last_read_at` drives unread), `mobile.messages`.
- **Identity**: `mobile.me()` maps `auth.uid()` → `public.users.id` (via `users.auth_user_id`, falling back to `public.current_user_id()`). `sender_id`/`user_id` are `public.users.id`. RLS uses `mobile.is_member()` (SECURITY DEFINER, avoids recursion).
- **RPCs** (all SECURITY DEFINER): `get_conversations`, `get_messages`, `send_message`, `mark_read`, `create_direct_conversation`, `create_group_conversation`. An `AFTER INSERT` trigger on `messages` updates the conversation's last-message fields.
- **Realtime**: `mobile.messages` + `mobile.conversations` are in the `supabase_realtime` publication with `REPLICA IDENTITY FULL`. The conversation screen subscribes to `postgres_changes` (INSERT on `mobile.messages`, filtered by `conversation_id`) and invalidates the React Query cache; RLS is enforced on the realtime stream.
- **Official channels** (`type='official'`): system/announcement channels (e.g. "Хүний нөөц", "Цаг бүртгэл"), identified by a unique `channel_key` (`hr`, `attendance`) — **not backed by a person**. Readable by all authenticated users (RLS); read state via lazy `mark_read` membership.
  - **Read-only**: normal users cannot post. Enforced both in RLS (`msg_insert` excludes `type='official'`) and in `send_message` (raises for official). Writes go only through `mobile.post_official_message(channel_key, body, actions, sender)` (SECURITY DEFINER) — allowed for backend (no `auth.uid()`) or, when `conversations.post_permission` is set, a user with that `has_permission`. Currently `post_permission` is NULL (backend/automation only).
  - **Sender display**: `messages.sender_id` is nullable; for official channels `get_messages` returns `sender_name` = channel title (badge) and `sender_staff` = posting staff name when present (NULL for pure-system messages).
  - **Action buttons / quick replies**: `messages.actions` (jsonb) = array of `{label, kind: 'route'|'flow'|'reply', value}`. The conversation screen renders them as buttons under the bubble; `route` navigates, others are stubbed (`Alert`) pending real flows (e.g. a leave-request wizard). The composer is hidden for official channels.

#### Contacts (friend system) + "system users"

- **System user** = a `public.users` row with `auth_user_id IS NOT NULL` (i.e. has actually logged in / exists in `auth.users`). Only system users are searchable/addable — never the full `public.users` table.
- **`mobile.contacts`** table holds friend requests/links (`requester_id`, `addressee_id`, `status` ∈ pending/accepted/declined). RLS lets the two parties read their own rows; all writes go through RPCs.
- **RPCs**: `search_system_users`, `get_org_groups`, `get_org_group_members`, `get_contacts`, `get_contact_requests`, `send_contact_request` (auto-accepts a reciprocal pending), `respond_contact_request`, `remove_contact`. `mobile.contact_status(other)` returns `none|pending_out|pending_in|accepted|self`.
- **Org groups**: `user_groups.user_id = users.bteg_id`, `user_groups.group_id = eelj_groups.bteg_id`; `eelj_groups.name` is the group name. Used for "browse org structure" when adding contacts and the org-groups section of the Contacts tab.
- **Gating**: `create_direct_conversation` now requires an **accepted contact** (raises otherwise). The new-chat / new-group pickers list only `get_contacts`.

#### Group visibility + join requests

- `mobile.conversations.visibility` ∈ `private` | `public` (default `private`; only meaningful for `type='group'`). Set at creation (`create_group_conversation(p_title, p_member_ids, p_visibility)`) or later by an admin via `set_group_visibility`.
- **Public groups** are discoverable via `mobile.search_public_groups(query)` (returns `join_status` = member/pending/none). A user joins by `request_join_group`, which inserts a row in `mobile.group_join_requests` (pending). A **group admin** (member with `role='admin'`, the creator) sees pending requests via `get_group_join_requests` and approves/declines via `respond_group_join_request` (approve adds a `conversation_members` row). Private groups are invite-only (members added at creation).
- Helper `mobile.is_group_admin(conv_id)` gates admin-only RPCs/RLS. Group info/members: `get_group_detail`, `get_group_members`.
- **Adding members** (`mobile.add_group_member(conv_id, user_id)`): private groups → admin only; public groups → any member. In both cases the added user must be an **accepted contact of the inviter**. UI: group info screen (`app/chat/group/[id].tsx`) shows an add/invite button (label "Гишүүн нэмэх" for private-admin, "Урих" for public) → `app/chat/group-invite/[id].tsx` (multi-select contacts not already in the group).

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
- `app-store` tracks active segment tab index for home, services, and profile screens
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
- Mock data in `mock/data.ts` for user/files — swap for real APIs later

### Icons

- **Lucide React Native** (`lucide-react-native`) — requires `react-native-svg`
- Shared icon registry in `lib/icon-map.ts` — maps icon name strings to lucide components; used by both home and services grids

### Navigation

- Custom tab bar in `components/navigation/custom-tab-bar.tsx`
- Floating-pill tab bar with 4 equal tabs (Chat, Mini-apps, Contacts, Profile); active tab uses `t.accent`
- Service grid items navigate via `item.route` property (e.g. `"/services/attendance"`)

### Key Directories

- `app/services/` — Service detail screens (each service gets its own screen here)
- `components/bgs/service-list.tsx` — Vertical services list (Үйлчилгээ tab)
- `components/services/` — Service detail screen helpers (category section, grid item, grid, file list)
- `components/profile/` — Profile screen components (header, QR section, actions)
- `components/ui/` — Reusable UI primitives
- `lib/` — API client, Supabase client, biometric helpers, query keys, icon map
- `mock/data.ts` — Mock data (user, files)
- `constants/strings.ts` — All Mongolian UI strings
- `types/index.ts` — TypeScript interfaces

### Key Types

- `ServiceCategory` — `{ id, title, order }` for grouping services
- `ServiceItem` — `{ id, title, icon, route?, categoryId?, iconBg?, iconColor?, badge?, badgeVariant? }`
- `AttendanceDetailDay` — `{ dayDate, workStartAt, workEndAt, workDuration, statusId, isHotsorson, isErtTarsan, startAt, endAt }`
- `FileItem`, `User`, `AttendanceWeek`

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
