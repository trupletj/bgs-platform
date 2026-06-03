# bgs-requests — Хүсэлтүүд mini-app

BGS superapp-ийн **mini-app**. Ажилтны төрөл бүрийн хүсэлтийг (чөлөө, ээлж солилцоо, томилолт/аялал, бусад) нэг дороос үүсгэж, төлөвийг хянана. Хуучин mobile дэлгэцүүдийн (чөлөөний хүсэлт, ээлж солилцоо) логикийг энд нэгтгэнэ.

## Stack
- Next.js 16 (App Router, RSC) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (new-york) · `@supabase/ssr`
- `bgs.mn`, `bgs-platform/apps/*`-тэй ижил Supabase project.

## Embedding контракт (attendance mini-app-тай ижил)
- **`SessionBridge`** (`components/bridge/session-bridge.tsx`) — parent (mobile/bgs.mn)-аас token авч `setSession` хийнэ. Web: URL hash `#at=&rt=`; Mobile WebView: `window.__BGS_TOKENS__`; refresh: `postMessage({type:"bgs-requests:refresh-tokens"})`.
- **`IframeResizer`** (`components/bridge/iframe-resizer.tsx`) — content height-ийг parent-руу `postMessage({type:"bgs-requests:height"})`.
- **`NEXT_PUBLIC_PARENT_ORIGINS`** — CSP `frame-ancestors` (next.config.ts).
- Message prefix: **`bgs-requests:`** (attendance нь `bgs-attendance:`). Parent embedder тус тусдаа сонсоно.

## Port
- Dev: **`localhost:3002`** (attendance = 3001, bgs.mn = 3000).

## Supabase
- `utils/supabase/{client,server}.ts` — `@supabase/ssr`, publishable key. `createClientForSchema(schema)` нь `target` гэх мэт өөр schema-д.
- RLS-аар хэрэглэгчийн өөрийн дата. Хүсэлтийн хүснэгтүүд (`leave_requests` гэх мэт) аль хэдийн байгаа — дараа холбоно.

## Төлөв
- Одоогоор **scaffold** — `app/page.tsx` нь хүсэлтийн төрлүүдийг placeholder ("Удахгүй") болгон харуулна. Функц дараагийн алхамд нэмэгдэнэ.

## Конвенц
- Hooks: `bgs-platform/apps/attendance` болон `shared-context/CONVENTIONS.md` дагана. UI монгол хэлээр.
