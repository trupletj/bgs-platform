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
export function SessionBridge() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const apply = async (tokens: BridgeTokens, source: "hash" | "injected" | "refresh") => {
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      if (cancelled) return;
      if (error) {
        console.error("[bridge] setSession failed:", error.message);
        return;
      }
      if (source === "hash") {
        clearHash();
      }
      router.refresh();
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
