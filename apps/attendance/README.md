# bgs-attendance

BGS super-app архитектурын **анхны mini-app**. Хэрэглэгчийн өөрийнх нь ирц (KPI + today clock + 14 хоног / долоо хоног overview)-ыг үзүүлдэг standalone Next.js аппликэйшн.

## Архитектур

- **Embedding:** `bgs.mn` (iframe) + `bgs-mobile-app` (`react-native-webview`) хоёрт зориулсан.
- **Auth bridge:** Parent supabase session-ы `access_token` + `refresh_token`-ыг URL hash (web) эсвэл `window.__BGS_TOKENS__` (mobile) -аар дамжуулж `supabase.auth.setSession()` дуудаж сэргээнэ.
- **Backend:** `bgs.mn`-тэй ижил Supabase project (`ljlywyhpxsutvrdeyyla`), нэг RPC chain: `current_bteg_id() → get_worker_attendance(...)`.

## Local dev

```bash
pnpm install
pnpm dev          # http://localhost:3001
```

Шууд test хийхэд `bgs.mn`-аас токеноо хуулж URL hash-д тавь:

```
http://localhost:3001/?embed=1#at=<access_token>&rt=<refresh_token>
```

## Deploy (Vercel)

Env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `NEXT_PUBLIC_PARENT_ORIGINS` (жишээ: `https://bgs.mn,https://www.bgs.mn`)

`next.config.ts` дотор CSP `frame-ancestors` header нь parent origins-ыг allow-лож iframe-ийг боломжтой болгоно.

## Folder structure

```
app/
  layout.tsx         # Root layout (SessionBridge + IframeResizer)
  page.tsx           # Overview хуудас (KPI + today + week)
  loading.tsx
  error.tsx
  globals.css
actions/
  attendance.ts      # bgs.mn-аас хуулсан, correction action хасагдсан
components/
  attendance/        # bgs.mn-аас хуулсан overview-only widget-үүд
  bridge/
    session-bridge.tsx
    iframe-resizer.tsx
  ui/                # shadcn primitive (card, badge, button, alert, skeleton)
lib/
  bridge.ts          # Token bridge utility
  format-attendance.ts
  utils.ts
types/
  attendance.ts      # bgs.mn-аас хуулсан, correction type хасагдсан
utils/supabase/
  client.ts
  server.ts
```
