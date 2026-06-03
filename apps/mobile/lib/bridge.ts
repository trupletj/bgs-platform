// Bridge helpers — bgs.mn login embed (iframe / RN WebView)-аас ирэх
// `bgs:auth:tokens` postMessage event-ийг шүүж auth-store-руу хүргэх.
//
// bgs.mn-ийн `lib/embed.ts: postTokensToParent()`-тэй хосолсон ажиллана.

export const EMBED_TOKENS_EVENT = "bgs:auth:tokens";

export type EmbedTokens = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

/** postMessage event эсвэл WebView onMessage string-аас токеныг сэргээх. */
export function parseTokensFromMessage(raw: unknown): EmbedTokens | null {
  let data: any = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  if (data.type !== EMBED_TOKENS_EVENT) return null;
  const t = data.tokens;
  if (!t?.access_token || !t?.refresh_token) return null;
  return {
    access_token: String(t.access_token),
    refresh_token: String(t.refresh_token),
    expires_at: typeof t.expires_at === "number" ? t.expires_at : undefined,
  };
}
