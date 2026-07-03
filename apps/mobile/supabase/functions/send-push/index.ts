// Supabase Edge Function: send-push
//
// mobile.messages дээр INSERT болоход Database Webhook-оор дуудагдана.
// Тухайн чатын (sender-ээс бусад, muted биш, hidden биш) гишүүдийн Expo push
// token-уудыг олж, Expo Push API руу мэдэгдэл илгээнэ.
//
// Тохиргоо (function secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — автоматаар бэлэн
//   WEBHOOK_SECRET — webhook-ийн нууц утга (header: x-webhook-secret)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK = 100;

interface MessageRecord {
  id: number;
  conversation_id: number;
  sender_id: string | null;
  body: string | null;
  type: string | null;
}

interface WebhookPayload {
  type: string; // "INSERT"
  table: string;
  record: MessageRecord;
}

function previewBody(rec: MessageRecord): string {
  if (rec.type === "image") return "📷 Зураг";
  if (rec.type === "file") return "📎 Файл";
  const text = (rec.body ?? "").trim();
  return text.length > 140 ? text.slice(0, 140) + "…" : text || "Шинэ зурвас";
}

function fullName(u: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!u) return "";
  return `${u.last_name ?? ""} ${u.first_name ?? ""}`.trim();
}

Deno.serve(async (req) => {
  // 1) Webhook secret шалгах
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const rec = payload.record;
  if (!rec || payload.type !== "INSERT") {
    return new Response("ignored", { status: 200 });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "mobile" } }
  );

  // 2) Хүлээн авагч гишүүд (sender-ээс бусад, muted/hidden биш)
  let q = db
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", rec.conversation_id)
    .eq("muted", false)
    .is("hidden_at", null);
  if (rec.sender_id) q = q.neq("user_id", rec.sender_id);
  const { data: members, error: memErr } = await q;
  if (memErr) return new Response(memErr.message, { status: 500 });

  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return new Response("no recipients", { status: 200 });

  // 3) Token-ууд
  const { data: tokenRows, error: tokErr } = await db
    .from("push_tokens")
    .select("token")
    .in("user_id", userIds);
  if (tokErr) return new Response(tokErr.message, { status: 500 });
  const tokens = (tokenRows ?? []).map((r) => r.token);
  if (tokens.length === 0) return new Response("no tokens", { status: 200 });

  // 4) Гарчиг/их бие бүрдүүлэх (conversation + sender)
  const { data: conv } = await db
    .from("conversations")
    .select("type, title")
    .eq("id", rec.conversation_id)
    .maybeSingle();

  let senderName = "";
  if (rec.sender_id) {
    const pub = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: u } = await pub
      .from("users")
      .select("first_name, last_name")
      .eq("id", rec.sender_id)
      .maybeSingle();
    senderName = fullName(u);
  }

  const body = previewBody(rec);
  let title: string;
  let pushBody: string;
  if (conv?.type === "group") {
    title = conv.title ?? "Бүлэг";
    pushBody = senderName ? `${senderName}: ${body}` : body;
  } else if (conv?.type === "official") {
    title = conv.title ?? "Мэдэгдэл";
    pushBody = body;
  } else {
    // direct
    title = senderName || "Шинэ зурвас";
    pushBody = body;
  }

  const data = { conversationId: String(rec.conversation_id), type: "chat" };

  // 5) Expo Push API руу chunk-аар илгээх; үхсэн token-уудыг устгах
  const deadTokens: string[] = [];
  for (let i = 0; i < tokens.length; i += CHUNK) {
    const slice = tokens.slice(i, i + CHUNK);
    const messages = slice.map((to) => ({
      to,
      title,
      body: pushBody,
      data,
      sound: "default",
    }));
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });
      const json = await resp.json();
      const tickets = Array.isArray(json?.data) ? json.data : [];
      tickets.forEach((ticket: { status?: string; details?: { error?: string } }, idx: number) => {
        if (ticket?.status === "error" && ticket?.details?.error === "DeviceNotRegistered") {
          deadTokens.push(slice[idx]);
        }
      });
    } catch (e) {
      console.error("[send-push] expo push failed", e);
    }
  }

  if (deadTokens.length) {
    await db.from("push_tokens").delete().in("token", deadTokens);
  }

  return new Response(
    JSON.stringify({ sent: tokens.length - deadTokens.length, pruned: deadTokens.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
