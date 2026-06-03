# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — Next.js dev server on port 3001 (Turbopack)
- `pnpm build` — Production build
- `pnpm start` — Production server (port 3001)
- `pnpm lint` — ESLint
- `pnpm exec tsc --noEmit` — TypeScript type check

## Purpose

Standalone Next.js 16 mini-app showing a worker's **roster status** (shift + cycle + calendar). Designed to be embedded as an iframe inside the mobile superapp (`apps/mobile`) and other parent shells. Mobile-only UI: capped at `max-w-md mx-auto`.

## Architecture

### Stack

- **Next.js 16** (App Router, Turbopack), React 19, TypeScript
- **Tailwind v4** + shadcn/ui (new-york) primitives (Card / Badge / Button / Alert / Skeleton)
- **@supabase/ssr** with cookie-based session
- **lucide-react** for icons only (Sun, Moon, BedDouble, CalendarDays, PlaneLanding, PlaneTakeoff, AlertCircle, Clock, RefreshCcw, FlaskConical)
- No state library, no client-side data fetching — everything is RSC + server actions

### Page

Single route `/` (`app/page.tsx`). Forced `dynamic = "force-dynamic"` so RSC re-fetches per request. Renders, in order, inside a `max-w-md` column:

1. `AttendanceHeader` — eyebrow `ИРЦ` + worker fullName + position · shiftGroup
2. `AttendanceHeroStatus` (client, live clock) — hero card with shift icon, current time, scheduled + actual time grid (2×2), progress bar, worked-duration label; falls back to a separate "Resting" layout when `today.type === null`
3. `AttendanceRosterCycle` — 14-day phase progress + "next phase" footer
4. `AttendanceRosterCalendar` (client) — 29-day grid with arrival/departure plane icons + late/early amber styling; click past on-duty days → bottom drawer with day details
5. `ScenarioSwitcher` (dev only, rendered only when `?scenario=` query is present) — dummy scenario picker

### Page resolution flow

```
URL ?scenario=… present → return dummy via getDummyRosterStatus(scenario)
otherwise:
  Promise.all([
    getMyRosterOverview(),     // bgs_attendance RPC
    getCurrentWorkerProfile()  // public.users by phone
  ])
  if RPC returns data → render real
  else → dummy + profile worker override (so name still resolves)
```

### Embedding contract (iframe / WebView)

- `app/layout.tsx` mounts `<SessionBridge>` + `<IframeResizer>` around children.
- `SessionBridge` (`components/bridge/session-bridge.tsx`) reads tokens from:
  1. `window.__BGS_TOKENS__` (RN WebView injected JS)
  2. URL hash `#at=…&rt=…&exp=…` (web iframe)
  3. `postMessage({ type: "bgs-attendance:refresh-tokens", tokens })` from parent
  Calls `supabase.auth.setSession(...)` → `router.refresh()` so the RSC re-renders with cookies.
- `IframeResizer` posts `{ type: "bgs-attendance:height", height }` to parent on every ResizeObserver tick.
- `NEXT_PUBLIC_PARENT_ORIGINS` env whitelists parent origins (currently `https://bgs.mn`, `https://bgs-mobile-app.vercel.app`, plus localhost dev URLs).

### Backend data flow

```
auth.uid() ──► public.current_bteg_id()  (joins profile.phone → target.sf_guard_user.id)
                       │
                       ▼
                worker_id (bigint, = users.bteg_id text)
                       │
                       ▼
        target.vw_worker_day_log_14d  (read-only Stitch/Singer sync)
                       │
                       ▼
   bgs_attendance.get_my_roster_overview(p_today date)  → jsonb
                       │
                       ▼
        actions/roster.ts (Supabase client w/ db.schema="bgs_attendance")
                       │
                       ▼
                  RosterStatusOverview  (types/attendance.ts)
```

`current_bteg_id` returns NULL when no session → RPC returns `null` → page falls back to dummy.

### `bgs_attendance` schema (Supabase)

Mini-app owned schema. Currently:

- **RPC `bgs_attendance.get_my_roster_overview(p_today date DEFAULT current_date)` → jsonb**, `SECURITY DEFINER`, `search_path = public, target, auth`. Returns:

```ts
{
  worker: { fullName, position, department, shiftGroup },
  today:  { type, label, scheduledStart, scheduledEnd,
            actualStart, actualEnd, workedMinutes, state },
  cycle:  { pattern, cycleStart, cycleDay, phase,
            phaseStart, phaseEnd, daysIntoPhase, daysRemainingPhase,
            nextPhaseStart, nextPhaseLabel },
  calendar: [{ date, dayOfMonth, dayLabel, phase, shiftType,
               isToday, isCycleStart, transition,
               isLate, isEarlyLeft,
               scheduledStart, scheduledEnd, actualStart, actualEnd,
               workedMinutes }, ...]
}
```

**Inference rules** (no explicit roster pattern column anywhere):

- `on_duty` for a day := row exists with `start_at` AND (day ≥ today OR `work_start_at` not null OR `udur_tsag_ajil + shunu_tsag_ajil > 0`). This handles office workers with always-present rows (rest day = 0 hours) and miners with absent rest rows.
- `shiftType` := `night` when `start_at.time > end_at.time`, else `day`.
- `transition` := `arrival` if first day of a consecutive on-duty run, `departure` if last day. Computed via `LAG`/`LEAD` over a ±28-day window so the displayed 29-day calendar doesn't false-mark its edges.
- `pattern` := heuristic from `current_group_name`: contains "өдөр шөнө" → `day-then-night`, else `day-only`.
- `phase`/`daysIntoPhase`/`daysRemainingPhase` := gaps-and-islands consecutive count of `on_duty` flag through a ±13-day window around today.
- `workedMinutes` := `work_duration * 60` (source column stores **hours** as bigint, despite the name).
- `state` (today only): `early-left` → `late` → `finished` → `active` → `not-checked-in` priority chain.

**PostgREST exposure**: schema is exposed via `ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, graphql_public, bgs_attendance'` (one-time, persisted on `authenticator` role).

**Migrations applied** (Supabase MCP `apply_migration`):
- `create_bgs_attendance_schema`
- `bgs_attendance_get_my_roster_overview` (+ v2…v8 iterations: window-nested fix, users.bteg_id text cast, transition lookback, calendar width, per-day details)

### Front-end Supabase client

`utils/supabase/server.ts`:

```ts
export const createClient = () => _build("public");
export const createClientForSchema = (schema: string) => _build(schema);
// _build is wrapped in React `cache()` so the same request reuses the same client
// across createClient() / createClientForSchema("bgs_attendance") calls.
```

NEVER use a module-level Map cache here — it leaks cookies across requests.

### Scenario switcher (dev)

`lib/dummy-attendance.ts` exports 10 `ScenarioKey`s — `day-active`, `day-not-checked-in`, `day-finished`, `day-late`, `day-early-left`, `night-active`, `night-not-checked-in`, `resting-mid`, `resting-near-end`, `transition-day-to-night`. Each builds a `RosterStatusOverview` anchored to `new Date()` so the calendar always looks real.

Hit any `?scenario=<key>` URL to force dummy mode (bypasses RPC). `<ScenarioSwitcher>` renders only in non-production builds **and** only when `?scenario=…` is already in the URL.

### Conventions

- Mongolian UI strings, hardcoded (no i18n yet).
- All cards use the shadcn `<Card>` primitive (`rounded-2xl border bg-card shadow-sm` is its default).
- Status palette: `emerald` (success/day shift), `indigo` (info/night shift), `amber` (late/early/warning), `cyan` (rest), `rose` (absent / destructive), `muted` (neutral/off-duty).
- Live clock uses `useEffect` + `setInterval(1000)` with `--:--:--` placeholder for first render to avoid hydration mismatch.
- Calendar week starts Sunday (`["Ня","Да","Мя","Лх","Пү","Ба","Бя"]`).
- Path alias `@/*` → project root.

### Key directories

- `app/` — route entry, layout, loading skeleton, error boundary
- `actions/` — server actions: `profile.ts` (worker profile by phone), `roster.ts` (`bgs_attendance` RPC), `attendance.ts` (legacy public RPCs — kept for backward compat, unused by current page)
- `components/attendance/` — domain widgets (header / hero-status / roster-cycle / roster-calendar / scenario-switcher)
- `components/bridge/` — `session-bridge`, `iframe-resizer`
- `components/ui/` — shadcn primitives
- `lib/` — `bridge.ts` (token reading helpers), `format-attendance.ts` (date / time formatters in Mongolian), `roster-helpers.ts` (labels + visuals), `dummy-attendance.ts` (scenarios), `utils.ts` (`cn`)
- `types/attendance.ts` — `RosterStatusOverview`, `RosterCalendarDay`, `TodayShift`, `RosterCycle`, `WorkerProfileLite`, `RosterTransition`, `DutyState`, `ShiftType`, `RotationPattern`, `RosterPhase`
- `utils/supabase/` — server + client supabase factories
