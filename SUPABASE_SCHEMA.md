# Supabase Schema — BGS Platform

BGS платформын Supabase мэдээллийн сангийн бүтэц, ажиллах зарчим.

---

## Schema бүтэц

Мэдээллийн сан хоёр schema ашигладаг:

| Schema | Зориулалт |
|--------|-----------|
| `public` | Байгууллагын үндсэн мэдээлэл (хэрэглэгч, чиглэл гэх мэт) |
| `bgs_attendance` | Ирц, ээлж солилцооны мэдээлэл |

---

## public schema

### `public.users`

Байгууллагын бүх ажилтны бүртгэл. Supabase auth-аас **тусдаа** хөтлөгддөг.

```sql
id               uuid         -- BGS системийн дотоод UUID (auth_user_id-аас өөр байж болно)
auth_user_id     uuid         -- Supabase auth.users.id (холбоос)
bteg_id          text         -- BTEG системийн дугаар (хэрэглэгчийн өвөрмөц ID)
first_name       text
last_name        text
email            text
phone            text
register_number  text         -- Регистрийн дугаар (JWT metadata-д байдаг)
department_name  text
position_name    text
autobus_direction_id text     -- Хэрэглэгчийн үндсэн буудлын bteg_id
```

> **Чухал:** `public.users.id` болон `auth.users.id` (Supabase auth UUID) таарахгүй байж болно.
> Хэрэглэгчийг хайхдаа `auth_user_id` баганаар холбоно.
>
> ```typescript
> // Зөв арга: auth UUID → public.users.id
> const { data: pubUser } = await pub
>   .from("users")
>   .select("id")
>   .eq("auth_user_id", user.id)  // user.id = Supabase auth UUID
>   .maybeSingle();
> // pubUser.id → passenger_assignments.internal_user_id-тай таарна
> ```

### `public.autobus_direction`

Автобусны зогсоол/чиглэлийн лавлах мэдээлэл.

```sql
id       uuid    -- bus_routes.direction_id-тай холбогдоно
bteg_id  text    -- passenger_assignments.autobus_direction_id-тай холбогдоно
name     text    -- Зогсоолын нэр (жишээ: "Улаанбаатар", "Налайх")
zam_tsag integer -- Замын хугацаа (минутаар)
```

> **Анхаар:** `autobus_direction`-д **хоёр өөр ID** байдаг:
> - `id` (uuid) → `bus_routes.direction_id` руу заана
> - `bteg_id` (text) → `passenger_assignments.autobus_direction_id` руу заана
>
> Эдгээр хоёр нэг объектын өөр identifier тул хутгаж болохгүй.

### `public.eelj_groups`

Ээлжийн бүлгүүд (shift groups).

```sql
bteg_id  text  -- shift_exchange_groups.group_bteg_id-тай холбогдоно
```

---

## bgs_attendance schema

### `bgs_attendance.shift_exchanges`

Ээлж солилцооны гол бүртгэл. Нэг ээлж солилцоо = нэг ажлын өдрийн явах эсвэл ирэх аялал.

```sql
id                   bigint
name                 text          -- Ээлжийн нэр (жишээ: "Буух ээлж")
exchange_date        date          -- Аялалын огноо
direction            text          -- 'departing' (явах) | 'arriving' (ирэх)
status               text          -- 'draft' | 'published' | 'completed' | 'cancelled'
eelj_id              bigint UNIQUE -- Ээлжтэй холбох ID
open_for_registration boolean      -- Бусад компани зорчигч бүртгэж болох эсэх
published_at         timestamptz
created_by           uuid          -- public.users.id
```

**Status урсгал:**
```
draft → published → completed
              ↓
          cancelled
```

Зөвхөн `published` төлөвтэй ээлжүүдийг хэрэглэгчдэд харуулна.

### `bgs_attendance.buses`

Тухайн ээлж солилцооны автобусууд.

```sql
id               bigint
shift_exchange_id bigint        -- shift_exchanges.id
name             text          -- Автобусны нэр (жишээ: "Улаанбаатар 1")
direction        text          -- 'departing' | 'arriving'
capacity         integer       -- Суудлын тоо (default: 45)
departure_time   timestamptz   -- Хөдлөх цаг
trip_leader_id   uuid          -- public.users.id (ахлах)
is_active        boolean
```

### `bgs_attendance.bus_routes`

Автобусны маршрутын зогсоолууд.

```sql
id           bigint
bus_id       bigint  -- buses.id
direction_id uuid    -- public.autobus_direction.id (uuid!)
stop_order   integer -- Зогсоолын дараалал (1-ээс эхэлнэ)
```

### `bgs_attendance.passenger_assignments`

Зорчигч бүрийн автобус хуваарилалт. Системийн гол хүснэгт.

```sql
id                  bigint
shift_exchange_id   bigint    -- shift_exchanges.id
bus_id              bigint    -- buses.id (nullable: хуваарилагдаагүй бол null)
original_bus_id     bigint    -- buses.id — анхны автобус (шилжилт хийгдэхэд хадгалагдана)
internal_user_id    uuid      -- public.users.id (auth UUID биш!)
bteg_id             text      -- public.users.bteg_id
autobus_direction_id text     -- public.autobus_direction.bteg_id (буудлын ID)
is_confirmed        boolean   -- Ирц баталгаажсан эсэх
confirmed_at        timestamptz
confirmed_by        uuid      -- Баталгаажуулсан хүний public.users.id
submitted_by        uuid
```

**Шилжилт (Transfer) илрүүлэх логик:**

`transfer_passenger` RPC дуудагдахад мөр шинэ үүсдэггүй — байгаа мөрийг UPDATE хийнэ:

```
ӨМНӨ:  bus_id = A,  original_bus_id = NULL
ДАРАА: bus_id = B,  original_bus_id = A   ← анхных хадгалагдана
```

Хоёр баганыг харьцуулсан 3 тохиолдол:

```
original_bus_id = NULL         → Шилжилтгүй, жирийн зорчигч
original_bus_id = bus_id       → Шилжилтгүй, жирийн зорчигч
original_bus_id ≠ bus_id       → Шилжилт хийгдсэн зорчигч
```

Аялалын ахлахын жагсаалтад харуулах логик (автобус A-ийн хувьд):

```
Жирийн зорчигч:      bus_id = A  AND (original_bus_id IS NULL OR original_bus_id = A)
Шилжилт орж ирсэн:  bus_id = A  AND original_bus_id IS NOT NULL AND original_bus_id ≠ A
                     → fromBusName: original_bus_id-н автобусны нэр
Шилжилт гарсан:     original_bus_id = A  AND bus_id ≠ A
                     → toBusName: bus_id-н автобусны нэр
```

> **Анхаар:** "Шилжилт гарсан"-г хайхдаа `bus_id NOT IN (манай автобусууд)` гэж хязгаарлаж болохгүй.
> Нэг ахлах хоёр автобус (A, B) хариуцаж байхад зорчигч A→B шилжвэл `bus_id = B` нь
> "манай автобусууд"-д байдаг тул хасагдаж, A-ийн "Шилжилт гарсан"-д харагдахгүй болдог.
> Зөвхөн `original_bus_id = A AND bus_id ≠ A` нөхцөлөөр шүүх хэрэгтэй.

> **`bus_id = NULL` тохиолдол:** Зорчигчийн `bus_id` нь null болсон бол автобусаас **хасагдсан** гэсэн үг
> (шилжилт хийгдсэн биш). Эдгээрийг "Шилжилт гарсан"-д оруулахгүйн тулд
> `transferredOut` query-д `.not("bus_id", "is", null)` нэмнэ.

### `bgs_attendance.trip_leaders`

Аялалын ахлахуудын бүртгэл.

```sql
id        bigint
bus_id    bigint   -- buses.id
bteg_id   text     -- public.users.bteg_id
name      text
phone     text
is_active boolean
```

### `bgs_attendance.attendance_logs`

QR уншуулсан бүртгэл (audit log).

```sql
id                     bigint
passenger_assignment_id bigint      -- passenger_assignments.id
scanned_by             uuid         -- public.users.id
scanned_at             timestamptz
device_info            text
notes                  text
```

### `bgs_attendance.shift_exchange_groups`

Ээлж солилцоонд оролцож буй бүлгүүд.

```sql
id               bigint
shift_exchange_id bigint  -- shift_exchanges.id
group_bteg_id    text     -- public.eelj_groups.bteg_id
```

---

## RLS (Row Level Security) зарчим

Бүх хүснэгтэд RLS асаалттай. Зөвшөөрөл хоёр түвшинд:

### 1. Шууд уншлага (SELECT policy)

Зорчигч хэд хэдэн хүснэгтэд нэвтрэхийн тулд дараах policy-үүд нэмэгдсэн:

| Policy нэр | Хүснэгт | Тайлбар |
|---|---|---|
| `pa_self_select` | `passenger_assignments` | `current_user_id()` ашиглан өөрийн assignment уншина |
| `br_passenger_select` | `bus_routes` | Зорчигчийн хуваарьлагдсан автобусын маршрут уншина |
| `tl_passenger_select` | `trip_leaders` | Зорчигчийн автобусын ахлахын мэдээлэл уншина |
| `se_passenger_select` | `shift_exchanges` | Зорчигчийн ээлжийн мэдээлэл уншина |

```sql
-- pa_self_select: current_user_id() ашиглан өөрийн бүртгэл уншина
CREATE POLICY "pa_self_select"
ON bgs_attendance.passenger_assignments
FOR SELECT
USING (internal_user_id = current_user_id());

-- br_passenger_select: зорчигчийн автобусын маршрут
CREATE POLICY "br_passenger_select"
ON bgs_attendance.bus_routes
FOR SELECT
USING (bus_id IN (
  SELECT bus_id FROM bgs_attendance.passenger_assignments
  WHERE internal_user_id = current_user_id()
));

-- tl_passenger_select: зорчигчийн автобусын ахлах
CREATE POLICY "tl_passenger_select"
ON bgs_attendance.trip_leaders
FOR SELECT
USING (bus_id IN (
  SELECT bus_id FROM bgs_attendance.passenger_assignments
  WHERE internal_user_id = current_user_id()
));

-- se_passenger_select: зорчигчийн ээлж
CREATE POLICY "se_passenger_select"
ON bgs_attendance.shift_exchanges
FOR SELECT
USING (id IN (
  SELECT shift_exchange_id FROM bgs_attendance.passenger_assignments
  WHERE internal_user_id = current_user_id()
));
```

> **`current_user_id()` функц:** `auth.uid()` → `profile.auth_user_id` → `profile.phone` → `sf_guard_user.phone` → `bteg_id` → `public.users.id` гэсэн chain-ээр нэвтэрсэн хэрэглэгчийн `public.users.id`-г буцаана. `auth.uid()` шууд ашиглавал `public.users.id`-тай таарахгүй тул заавал энэ функцийг ашиглана.

### 2. SECURITY DEFINER RPC (бичих үйлдлүүд)

Бичих (INSERT/UPDATE/DELETE) үйлдлүүдийг **шууд хүснэгтэд хийхгүй** — зөвхөн SECURITY DEFINER функцүүдээр дамжуулна. Эдгээр функц RLS-г тойрч, дотооддоо зөвшөөрлийг шалгана.

| RPC нэр | Зориулалт |
|---------|-----------|
| `get_my_led_buses()` | Аялалын ахлахын хариуцсан автобусуудыг буцаана |
| `am_i_trip_leader()` | Одоогийн хэрэглэгч аялалын ахлах эсэхийг шалгана |
| `confirm_passenger(p_bteg_id, p_bus_id)` | Зорчигчийг бүртгэнэ |
| `unconfirm_passenger(p_bteg_id, p_bus_id)` | Бүртгэлийг цуцлана |
| `transfer_passenger(p_assignment_id, p_target_bus_id)` | Зорчигчийг өөр автобус руу шилжүүлнэ, `original_bus_id`-г хадгална |
| `reverse_transfer(p_assignment_id)` | Шилжилтийг буцаана — `bus_id = original_bus_id`, `original_bus_id = NULL`, `is_confirmed = false` |

**`transfer_passenger` RPC-ийн зарчим:**

```sql
CREATE OR REPLACE FUNCTION bgs_attendance.transfer_passenger(
  p_assignment_id bigint,
  p_target_bus_id bigint
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE bgs_attendance.passenger_assignments
  SET
    original_bus_id = COALESCE(original_bus_id, bus_id), -- анхны автобусыг хадгална
    bus_id = p_target_bus_id,
    is_confirmed = false,
    confirmed_at = NULL
  WHERE id = p_assignment_id;
END;
$$;
```

---

## Найдваргүй хэв маягууд

### 1. Embedded filter

Supabase-д `relation!inner(column)` + `.eq("relation.column", value)` хэлбэрийн filter найдваргүй байдаг.

```typescript
// ❌ Буруу — зарим тохиолдолд бүх мөрийг буцаадаг
const { data } = await bgs
  .from("passenger_assignments")
  .select("id, shift_exchanges!inner(status)")
  .eq("shift_exchanges.status", "published");

// ✅ Зөв — хоёр алхмаар хийнэ
const { data: ses } = await bgs
  .from("shift_exchanges")
  .select("id")
  .eq("status", "published");
const publishedIds = (ses ?? []).map((s) => s.id);

const { data } = await bgs
  .from("passenger_assignments")
  .select("id")
  .in("shift_exchange_id", publishedIds);
```

---

### 2. `.gte()` / `.lte()` огнооны шүүлт — Next.js Turbopack crash

Next.js Turbopack дээр Supabase query-д `.gte()` / `.lte()` ашиглахад сервер crash болдог байна.

```typescript
// ❌ Турбопак дээр сервер crash болно
const { data } = await bgs
  .from("buses")
  .select("id, name, departure_time")
  .in("id", busIds)
  .gte("departure_time", startDate.toISOString())
  .lte("departure_time", endDate.toISOString());

// ✅ Зөв — бүгдийг татаад JavaScript-д шүүнэ
const { data } = await bgs
  .from("buses")
  .select("id, name, departure_time")
  .in("id", busIds);

const nowMs = Date.now();
const threeDays = 3 * 24 * 60 * 60 * 1000;
const filtered = (data ?? []).filter(
  (b) => Math.abs(new Date(b.departure_time).getTime() - nowMs) <= threeDays,
);
```

## Supabase client үүсгэх

```typescript
import { createClient, createClientForSchema } from "@/utils/supabase/server";

const pub = await createClient();                        // public schema
const bgs = await createClientForSchema("bgs_attendance"); // bgs_attendance schema
```

---

## Хэрэглэгч таних зарчим

JWT-аас `auth.uid()` авна. Гэвч `public.users.id` нь `auth.uid()`-тай **таарахгүй** байж болно — учир нь `public.users` нь BGS-ийн өөрийн системийн ID ашигладаг.

```
Supabase auth → user.id = "2f04b895-..."   ← JWT sub
public.users  → id = "8cf2fb2c-..."        ← BGS дотоод ID
               auth_user_id = "2f04b895-..." ← холбоос
```

Зорчигчийн `passenger_assignments`-г хайхдаа:

```typescript
// 1. auth UUID → public.users.id
const { data: pubUser } = await pub
  .from("users")
  .select("id")
  .eq("auth_user_id", user.id)
  .maybeSingle();

const internalUserId = pubUser?.id ?? user.id;

// 2. internal UUID-аар БҮХ assignment-г авна (олон автобус боломжтой)
const { data: asgns } = await bgs
  .from("passenger_assignments")
  .select("id, bus_id, is_confirmed, confirmed_at")
  .eq("internal_user_id", internalUserId)
  .not("bus_id", "is", null)
  .order("id", { ascending: false });
// → MyBusInfo[] буцаана (нэг зорчигч олон автобусанд бүртгэлтэй байж болно)
```

> **Анхаар:** `.limit(1).maybeSingle()` ашиглавал зөвхөн нэг автобус харагдана. Бүх бүртгэлийг авахын тулд limit хасна.

---

## Харилцааны диаграм

```
public.users
  │ id ──────────────────── passenger_assignments.internal_user_id
  │ bteg_id ─────────────── passenger_assignments.bteg_id
  │ bteg_id ─────────────── trip_leaders.bteg_id
  │ auth_user_id ────────── (Supabase auth.users.id)
  │ id ──────────────────── attendance_logs.scanned_by

public.autobus_direction
  │ id ──────────────────── bus_routes.direction_id
  │ bteg_id ─────────────── passenger_assignments.autobus_direction_id

bgs_attendance.shift_exchanges
  │ id ──────────────────── buses.shift_exchange_id
  │ id ──────────────────── passenger_assignments.shift_exchange_id
  │ id ──────────────────── shift_exchange_groups.shift_exchange_id

bgs_attendance.buses
  │ id ──────────────────── passenger_assignments.bus_id
  │ id ──────────────────── passenger_assignments.original_bus_id
  │ id ──────────────────── bus_routes.bus_id
  │ id ──────────────────── trip_leaders.bus_id

bgs_attendance.passenger_assignments
  │ id ──────────────────── attendance_logs.passenger_assignment_id
```
