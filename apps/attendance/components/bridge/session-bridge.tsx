"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  clearHash,
  listenForTokenRefresh,
  readTokensFromHash,
  readTokensFromInjected,
  type BridgeTokens,
} from "@/lib/bridge";

// Parent-аас (bgs.mn iframe эсвэл RN WebView) ирсэн токеноор supabase session
// сэргээж, дараа нь router.refresh() дуудаж RSC дахин fetch хийдэг.
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1500, 3000];

export function SessionBridge() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // setSession() дотоод getUser() баталгаажуулалт нь retry-гүй тул нэг богино
    // network blip-т ч бүтэн унадаг байсан — иймд энд нэмэлт retry-with-backoff.
    const apply = async (tokens: BridgeTokens, source: "hash" | "injected" | "refresh") => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (cancelled) return;
        if (!error) {
          if (source === "hash") {
            clearHash();
          }
          router.refresh();
          return;
        }
        console.error(
          `[bridge] setSession failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          error.message, error.code, error.status,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          if (cancelled) return;
        }
      }
    };

    (async () => {
      const injected = readTokensFromInjected();
      if (injected) {
        await apply(injected, "injected");
        return;
      }
      const hashTokens = readTokensFromHash();
      if (hashTokens) {
        await apply(hashTokens, "hash");
      }
    })();

    const unsubscribe = listenForTokenRefresh((tokens) => {
      void apply(tokens, "refresh");
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  return null;
}
