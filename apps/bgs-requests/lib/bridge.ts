// Token bridge utility — Parent (bgs.mn / Expo) -ээс mini-app руу
// supabase session-ийг дамжуулах helper-үүд.
//
// Web: parent iframe.src дотор #at=<jwt>&rt=<refresh> хэлбэрээр URL hash-аар дамжуулна.
// Mobile: react-native-webview-ын injectedJavaScriptBeforeContentLoaded
// `window.__BGS_TOKENS__ = { at, rt }` үүсгэнэ.
// Refresh: parent дотор `onAuthStateChange` event тохиолдох тоолонд
// postMessage({ type: "bgs-requests:refresh-tokens", tokens }) илгээдэг.

export type BridgeTokens = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

declare global {
  interface Window {
    __BGS_TOKENS__?: { at?: string; rt?: string; exp?: number };
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

const REFRESH_MESSAGE_TYPE = "bgs-requests:refresh-tokens";
const HEIGHT_MESSAGE_TYPE = "bgs-requests:height";

export function readTokensFromHash(): BridgeTokens | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const at = params.get("at");
  const rt = params.get("rt");
  if (!at || !rt) return null;
  const exp = params.get("exp");
  return {
    access_token: at,
    refresh_token: rt,
    expires_at: exp ? Number(exp) : undefined,
  };
}

export function readTokensFromInjected(): BridgeTokens | null {
  if (typeof window === "undefined") return null;
  const w = window.__BGS_TOKENS__;
  if (!w?.at || !w?.rt) return null;
  return {
    access_token: w.at,
    refresh_token: w.rt,
    expires_at: w.exp,
  };
}

export function clearHash() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

export function postHeight(height: number) {
  if (typeof window === "undefined") return;
  // Web iframe parent.
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: HEIGHT_MESSAGE_TYPE, height }, "*");
  }
}

export function listenForTokenRefresh(
  handler: (tokens: BridgeTokens) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onMessage = (e: MessageEvent) => {
    const data = e.data;
    if (!data || typeof data !== "object") return;
    if (data.type !== REFRESH_MESSAGE_TYPE) return;
    const t = data.tokens;
    if (!t?.access_token || !t?.refresh_token) return;
    handler({
      access_token: String(t.access_token),
      refresh_token: String(t.refresh_token),
      expires_at: t.expires_at,
    });
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") return true;
  if (window.parent && window.parent !== window) return true;
  if (window.ReactNativeWebView) return true;
  return false;
}
