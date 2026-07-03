import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  InputAccessoryView,
  Platform,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Megaphone,
  AlertCircle,
  Check,
  CheckCheck,
  Plus,
  FileText,
  ImagePlus,
} from "lucide-react-native";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { setActiveChatThread } from "@/lib/push";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { tapLight } from "@/lib/haptics";
import { confirmDialog, alertDialog } from "@/lib/dialog";
import { avatarColor, avatarSoft } from "@/lib/avatar-color";
import { NativeIcon } from "@/components/ui/native-icon";
import type { ChatMessage, MessageAction } from "@/types";

const PAGE = 30;
const ACCESSORY_ID = "chat-composer";

function dayLabel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Өнөөдөр";
  if (d.toDateString() === yest.toDateString()) return "Өчигдөр";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function MsgAvatar({
  url,
  name,
  size,
}: {
  url?: string;
  name?: string;
  size: number;
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 3 }}
        contentFit="cover"
      />
    );
  }
  const initial = (name?.charAt(0) || "?").toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: avatarSoft(name ?? "?"),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.42, fontWeight: "800", color: avatarColor(name ?? "?") }}>
        {initial}
      </Text>
    </View>
  );
}

export default function ChatThreadScreen() {
  const router = useRouter();
  const t = useTheme();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const mainInputRef = useRef<TextInput>(null);
  const accessoryInputRef = useRef<TextInput>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = String(id);
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [outbox, setOutbox] = useState<ChatMessage[]>([]);

  const { data: threads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });
  const thread = threads?.find((th) => th.id === threadId);

  // Хуудаслалт: "дараагийн хуудас" = хуучин мессежүүд (cursor = хамгийн
  // эртний мессежийн created_at). pages[0] = хамгийн сүүлийн PAGE мессеж.
  const { data: pages, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.chat.messages(threadId),
      queryFn: ({ pageParam }) =>
        api.getChatMessages(threadId, { limit: PAGE, before: pageParam ?? undefined }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => (last.length < PAGE ? undefined : last[0]?.createdAt),
    });

  // Хуудас бүр доторх дараалал ASC; хуудсуудыг урвуулж (хуучин→шинэ) flatten.
  const server = useMemo(
    () => [...(pages?.pages ?? [])].reverse().flat(),
    [pages]
  );

  // Сервер дээр орсон, надаас гарсан мессежүүд (текст + цаг) — өөрийн send
  // realtime-аар буцаж ирэхэд optimistic давхар bubble-ийг арилгахад ашиглана.
  const serverMine = useMemo(
    () =>
      server
        .filter((m) => m.fromMe && m.text && m.createdAt)
        .map((m) => ({ text: m.text.trim(), t: new Date(m.createdAt!).getTime() })),
    [server]
  );

  // server (хуучин→шинэ) + outbox (илгээж буй).
  // pending outbox-оос серверт echo болсныг (ижил текст, <60с) хасна.
  // failed-ийг хэзээ ч хасахгүй — retry боломжтой байх ёстой.
  const messages = useMemo(() => {
    const live = outbox.filter((o) => {
      if (o.failed || !o.createdAt) return true;
      const ot = new Date(o.createdAt).getTime();
      const txt = o.text.trim();
      return !serverMine.some((s) => s.text === txt && Math.abs(s.t - ot) < 60_000);
    });
    return [...server, ...live];
  }, [server, outbox, serverMine]);

  // inverted FlatList-д шинэ→хуучин дараалал хэрэгтэй (index 0 = хамгийн шинэ)
  const data = useMemo(() => [...messages].reverse(), [messages]);

  const isOfficial = thread?.isOfficial ?? false;
  const isDirect = !!thread && !thread.isGroup && !isOfficial;

  // Read receipt — DM-д нөгөө талын сүүлд уншсан хугацаа (epoch ms)
  const { data: peerReadAtRaw } = useQuery({
    queryKey: queryKeys.chat.peerReadAt(threadId),
    queryFn: () => api.getPeerReadAt(threadId),
    enabled: isDirect,
    refetchInterval: isDirect ? 15_000 : false,
    staleTime: 10_000,
  });
  const peerReadAt = peerReadAtRaw ? new Date(peerReadAtRaw).getTime() : 0;

  // Дэлгэц фокус авах бүрт нөгөө талын уншсан төлвийг шинэчилнэ;
  // мөн идэвхтэй чатыг тэмдэглэж push banner-ийг (foreground) дарна.
  useFocusEffect(
    useCallback(() => {
      setActiveChatThread(threadId);
      if (isDirect) {
        qc.invalidateQueries({ queryKey: queryKeys.chat.peerReadAt(threadId) });
      }
      return () => setActiveChatThread(null);
    }, [isDirect, threadId, qc])
  );

  // Нээгдэх үед уншсан болгох
  useEffect(() => {
    api.markChatRead(threadId).then(() => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
    });
  }, [threadId, qc]);

  // Realtime — шинэ мессеж ирэхэд сүүлийн хуудсыг шинэчилнэ
  useEffect(() => {
    const channel = supabase
      .channel(`mobile:messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "mobile",
          table: "messages",
          filter: `conversation_id=eq.${threadId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.chat.messages(threadId) });
          qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
          if (isDirect) {
            qc.invalidateQueries({ queryKey: queryKeys.chat.peerReadAt(threadId) });
          }
          api.markChatRead(threadId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, qc, isDirect]);

  const sendMutation = useMutation({
    mutationFn: (vars: { tempId: string; body: string }) => api.sendChatMessage(threadId, vars.body),
    onSuccess: (_real, vars) => {
      // optimistic-г устгаж, сүүлийн хуудсыг realtime/refetch-ээр шинэчилнэ
      setOutbox((prev) => prev.filter((m) => m.id !== vars.tempId));
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(threadId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
    },
    onError: (_e, vars) => {
      setOutbox((prev) =>
        prev.map((m) => (m.id === vars.tempId ? { ...m, pending: false, failed: true } : m))
      );
    },
  });

  const makeOutboxItem = (tempId: string, text: string): ChatMessage => {
    const now = new Date();
    return {
      id: tempId,
      threadId,
      text,
      fromMe: true,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      createdAt: now.toISOString(),
      pending: true,
    };
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    tapLight();
    const tempId = `temp-${Date.now()}`;
    setOutbox((prev) => [...prev, makeOutboxItem(tempId, text)]);
    setDraft("");
    sendMutation.mutate({ tempId, body: text });
  };

  // Алдаа гарсан мессежийг ижил tempId-аар дахин илгээх (давхар bubble гарахгүй)
  const retrySend = (tempId: string) => {
    const item = outbox.find((m) => m.id === tempId);
    if (!item) return;
    tapLight();
    setOutbox((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, pending: true, failed: false } : m))
    );
    sendMutation.mutate({ tempId, body: item.text });
  };

  const confirmDeleteFailed = (tempId: string) => {
    confirmDialog({
      title: S.chat.deleteFailed,
      message: S.chat.sendFailed,
      confirmText: S.chat.deleteFailed,
      destructive: true,
      onConfirm: () => setOutbox((prev) => prev.filter((m) => m.id !== tempId)),
    });
  };

  const mediaMutation = useMutation({
    mutationFn: (file: { uri: string; name: string; mime: string; kind: "image" | "file" }) =>
      api.sendChatMedia(threadId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(threadId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? "Илгээж чадсангүй"),
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alertDialog(S.chat.title, S.chat.mediaPermission);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    mediaMutation.mutate({
      uri: a.uri,
      name: a.fileName ?? "image.jpg",
      mime: a.mimeType ?? "image/jpeg",
      kind: "image",
    });
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    mediaMutation.mutate({
      uri: a.uri,
      name: a.name ?? "file",
      mime: a.mimeType ?? "application/octet-stream",
      kind: "file",
    });
  };

  const chooseImage = () => {
    setAttachOpen(false);
    pickImage();
  };
  const chooseFile = () => {
    setAttachOpen(false);
    pickFile();
  };

  const handleAction = (a: MessageAction) => {
    if (a.kind === "route" && a.value) {
      router.push(a.value as never);
    } else {
      alertDialog(thread?.name ?? S.chat.title, S.chat.actionSoon);
    }
  };

  // Зурвас бичих хэсэг. iOS дээр гарт (keyboard) native-аар бэхлэгдэхийн тулд
  // InputAccessoryView дотор хуулбарыг рендерлэнэ; гар хаалттай үед normal bar.
  const renderComposer = (ref: RefObject<TextInput | null>, accessory = false) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: accessory ? 8 : Math.max(insets.bottom, 10),
        borderTopWidth: 1,
        borderTopColor: t.border,
        backgroundColor: t.card,
      }}
    >
      <Pressable
        onPress={() => setAttachOpen(true)}
        disabled={mediaMutation.isPending}
        hitSlop={6}
        style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }}
      >
        {mediaMutation.isPending ? (
          <ActivityIndicator size="small" color={t.accent} />
        ) : (
          <NativeIcon sf="plus" lucide={Plus} size={24} color={t.sub} />
        )}
      </Pressable>
      <TextInput
        ref={ref}
        value={draft}
        onChangeText={setDraft}
        placeholder={S.chat.inputPlaceholder}
        placeholderTextColor={t.faint}
        multiline
        inputAccessoryViewID={Platform.OS === "ios" ? ACCESSORY_ID : undefined}
        onFocus={
          !accessory && Platform.OS === "ios"
            ? () => accessoryInputRef.current?.focus()
            : undefined
        }
        style={{
          flex: 1,
          minHeight: 38,
          // iOS дээр гар нээлттэй үед бодит composer нь accessory хувилбар (гарт
          // бэхлэгдсэн) — доорх inline хувилбар нь зөвхөн амрах төлөв. Түүнийг
          // өсгөвөл inverted FlatList-ийн frame багасч, бичих бүрд жагсаалт дээшээ
          // "өөрөө гүйлгэдэг". Тиймээс inline-iOS хувилбарын өндрийг тогтмол барина.
          maxHeight: Platform.OS === "ios" && !accessory ? 38 : 120,
          fontSize: 15,
          color: t.text,
          backgroundColor: t.bg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: t.border,
          paddingHorizontal: 14,
          paddingTop: 9,
          paddingBottom: 9,
        }}
      />
      <Pressable
        onPress={handleSend}
        disabled={!draft.trim()}
        hitSlop={6}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: draft.trim() ? t.accent : t.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NativeIcon
          sf="paperplane.fill"
          lucide={Send}
          size={18}
          color={draft.trim() ? "#fff" : t.accent}
        />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Custom header — contacts-маягийн flat header (Expo Go-д ажиллана) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          backgroundColor: t.bg,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", marginLeft: -4 }}
        >
          <NativeIcon sf="chevron.backward" lucide={ChevronLeft} size={26} color={t.text} />
        </Pressable>

        {thread?.isGroup ? (
          <Pressable
            style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
            onPress={() => router.push(`/chat/group/${threadId}` as never)}
          >
            <MsgAvatar url={thread?.avatarUrl} name={thread?.name} size={34} />
            <Text
              style={{ flex: 1, fontSize: 18, fontWeight: "800", color: t.text, letterSpacing: -0.3 }}
              numberOfLines={1}
            >
              {thread?.name ?? "Чат"}
            </Text>
            <NativeIcon sf="chevron.right" lucide={ChevronRight} size={18} color={t.faint} />
          </Pressable>
        ) : (
          <Text
            style={{ flex: 1, fontSize: 18, fontWeight: "800", color: t.text, letterSpacing: -0.3 }}
            numberOfLines={1}
          >
            {thread?.name ?? "Чат"}
          </Text>
        )}

        {/* DM-д баруун талд харилцагчийн зураг → хэрэглэгчийн мэдээлэл хуудас */}
        {isDirect && (
          <Pressable onPress={() => router.push(`/chat/user/${threadId}` as never)} hitSlop={8}>
            <MsgAvatar url={thread?.avatarUrl} name={thread?.name} size={34} />
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={data}
          inverted
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color={t.sub} />
              </View>
            ) : null
          }
          renderItem={({ item: m, index }) => {
            // inverted дараалал тул index+1 нь хронологийн хувьд өмнөх (хуучин) мессеж
            const prev = data[index + 1];
            const showDay =
              !!m.createdAt && dayLabel(m.createdAt) !== dayLabel(prev?.createdAt);
            // Read receipt төлөв (зөвхөн DM, өөрийн мессеж)
            const receiptState =
              isDirect && m.fromMe && !m.failed
                ? m.pending
                  ? "sent"
                  : m.createdAt && new Date(m.createdAt).getTime() <= peerReadAt
                    ? "read"
                    : "delivered"
                : null;
            return (
              <View>
                {showDay && (
                  <View style={{ alignItems: "center", marginVertical: 8 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.faint,
                        fontWeight: "600",
                        backgroundColor: t.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      {dayLabel(m.createdAt)}
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 6,
                    maxWidth: thread?.isGroup ? "86%" : "78%",
                    alignSelf: m.fromMe ? "flex-end" : "flex-start",
                  }}
                >
                  {thread?.isGroup && !m.fromMe && (
                    <MsgAvatar url={m.senderAvatarUrl} name={m.senderName} size={28} />
                  )}
                  <View style={{ flexShrink: 1, alignItems: m.fromMe ? "flex-end" : "flex-start" }}>
                  {!m.fromMe && m.senderName && (thread?.isGroup || isOfficial) && (
                    <Text style={{ fontSize: 11, color: t.faint, marginBottom: 3, marginLeft: 6 }}>
                      {m.senderName}
                      {m.senderStaff ? ` · ${m.senderStaff}` : ""}
                    </Text>
                  )}
                  <View
                    style={{
                      backgroundColor: m.fromMe ? t.accent : t.card,
                      borderWidth: m.fromMe ? 0 : 1,
                      borderColor: t.border,
                      borderRadius: 18,
                      borderBottomRightRadius: m.fromMe ? 5 : 18,
                      borderBottomLeftRadius: m.fromMe ? 18 : 5,
                      paddingHorizontal: m.kind === "image" ? 4 : 14,
                      paddingVertical: m.kind === "image" ? 4 : 9,
                      opacity: m.pending ? 0.6 : 1,
                    }}
                  >
                    {m.kind === "image" && m.attachmentUrl ? (
                      <Pressable onPress={() => Linking.openURL(m.attachmentUrl!)}>
                        <Image
                          source={{ uri: m.attachmentUrl }}
                          style={{ width: 210, height: 210, borderRadius: 14 }}
                          contentFit="cover"
                          transition={150}
                        />
                      </Pressable>
                    ) : m.kind === "file" && m.attachmentUrl ? (
                      <Pressable
                        onPress={() => Linking.openURL(m.attachmentUrl!)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 }}
                      >
                        <FileText size={22} color={m.fromMe ? "#fff" : t.accent} strokeWidth={2} />
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: m.fromMe ? "#fff" : t.text,
                            maxWidth: 180,
                          }}
                          numberOfLines={1}
                        >
                          {m.attachmentName ?? "Файл"}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={{ fontSize: 14.5, color: m.fromMe ? "#fff" : t.text, lineHeight: 20 }}>
                        {m.text}
                      </Text>
                    )}
                  </View>
                  {!!m.actions?.length && (
                    <View style={{ marginTop: 6, gap: 6 }}>
                      {m.actions.map((a, ai) => (
                        <Pressable
                          key={ai}
                          onPress={() => handleAction(a)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: t.accent,
                            backgroundColor: t.accentSoft,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.accent }}>
                            {a.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {m.failed ? (
                    <Pressable
                      onPress={() => retrySend(m.id)}
                      onLongPress={() => confirmDeleteFailed(m.id)}
                      hitSlop={6}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 3,
                        alignSelf: "flex-end",
                        marginHorizontal: 6,
                      }}
                    >
                      <AlertCircle size={12} color="#E5484D" strokeWidth={2} />
                      <Text style={{ fontSize: 10.5, color: "#E5484D", fontWeight: "600" }}>
                        {S.chat.sendFailed} · {S.chat.retry}
                      </Text>
                    </Pressable>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 3,
                        alignSelf: m.fromMe ? "flex-end" : "flex-start",
                        marginHorizontal: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10.5, color: t.faint }}>
                        {m.pending ? S.chat.sending : m.time}
                      </Text>
                      {receiptState === "sent" && (
                        <Check size={13} color={t.faint} strokeWidth={2.5} />
                      )}
                      {receiptState === "delivered" && (
                        <CheckCheck size={13} color={t.faint} strokeWidth={2.5} />
                      )}
                      {receiptState === "read" && (
                        <CheckCheck size={13} color={t.accent} strokeWidth={2.5} />
                      )}
                    </View>
                  )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Read-only official суваг — бичих талбар нуугдана */}
        {isOfficial ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 14),
              borderTopWidth: 1,
              borderTopColor: t.border,
              backgroundColor: t.card,
            }}
          >
            <Megaphone size={16} color={t.faint} strokeWidth={2} />
            <Text style={{ fontSize: 12.5, color: t.faint, fontWeight: "500" }}>
              {S.chat.readOnly}
            </Text>
          </View>
        ) : (
          renderComposer(mainInputRef)
        )}
      </View>

      {/* iOS — гарт native-аар бэхлэгдсэн composer */}
      {Platform.OS === "ios" && !isOfficial && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          {renderComposer(accessoryInputRef, true)}
        </InputAccessoryView>
      )}

      {/* Хавсаргах цэс (web + native) */}
      <Modal
        visible={attachOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachOpen(false)}
      >
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setAttachOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: t.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: t.border }} />
            </View>
            <Pressable
              onPress={chooseImage}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 16 }}
            >
              <ImagePlus size={22} color={t.accent} strokeWidth={2} />
              <Text style={{ fontSize: 15.5, fontWeight: "600", color: t.text }}>{S.chat.attachImage}</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 22 }} />
            <Pressable
              onPress={chooseFile}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 16 }}
            >
              <FileText size={22} color={t.accent} strokeWidth={2} />
              <Text style={{ fontSize: 15.5, fontWeight: "600", color: t.text }}>{S.chat.attachFile}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
