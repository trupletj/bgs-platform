// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

// React `cache` нь хүсэлт бүрд key-ээр memoize хийнэ — өөр өөр schema-нд
// тус тусын client. Хүсэлт хооронд утга хуваалцахгүй.
const _build = cache(async (schema: string) => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
      ...(schema !== "public" ? { db: { schema } } : {}),
    }
  );
});

export const createClient = async () => _build("public");
export const createClientForSchema = (schema: string) => _build(schema);
