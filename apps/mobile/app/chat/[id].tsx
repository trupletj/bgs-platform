import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Megaphone,
  AlertCircle,
  MoreVertical,
  Plus,
  FileText,
  ImagePlus,
  Bell,
  BellOff,
  EyeOff,
} from "lucide-react-native";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { tapLight } from "@/lib/haptics";
import { confirmDialog, alertDialog } from "@/lib/dialog";
import type { ChatMessage, MessageAction } from "@/types";

const PAGE = 30;

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

export default function ChatThreadScreen() {
  const router = useRouter();
  const t = useTheme();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = String(id);
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [outbox, setOutbox] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: threads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });
  const thread = threads?.find((th) => th.id === threadId);

  const { data: base } = useQuery({
    queryKey: queryKeys.chat.messages(threadId),
    queryFn: () => api.getChatMessages(threadId, { limit: PAGE }),
  });

  // older (хуучин) + base (сүүлийн хуудас) + outbox (илгээж буй)
  const messages = useMemo(
    () => [...older, ...(base ?? []), ...outbox],
    [older, base, outbox]
  );

  const isOfficial = thread?.isOfficial ?? false;
  const lastId = messages[messages.length - 1]?.id;

  // Шинэ мессеж (доод тал) нэмэгдэхэд л доош гүйлгэнэ — хуучин ачаалахад биш
  useEffect(() => {
    if (lastId) requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [lastId]);

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
          api.markChatRead(threadId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, qc]);

  const loadEarlier = async () => {
    if (loadingMore || !hasMore) return;
    const oldest = messages[0]?.createdAt;
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const batch = await api.getChatMessages(threadId, { limit: PAGE, before: oldest });
      if (batch.length < PAGE) setHasMore(false);
      if (batch.length) setOlder((prev) => [...batch, ...prev]);
    } finally {
      setLoadingMore(false);
    }
  };

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

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    tapLight();
    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    setOutbox((prev) => [
      ...prev,
      {
        id: tempId,
        threadId,
        text,
        fromMe: true,
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        createdAt: now.toISOString(),
        pending: true,
      },
    ]);
    setDraft("");
    sendMutation.mutate({ tempId, body: text });
  };

  const muteMutation = useMutation({
    mutationFn: (v: boolean) => api.setMute(threadId, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chat.threads }),
  });
  const hideMutation = useMutation({
    mutationFn: () => api.hideConversation(threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
      router.back();
    },
  });

  const confirmHide = () => {
    setMenuOpen(false);
    confirmDialog({
      title: S.chat.hideChat,
      message: S.chat.hideChatConfirm,
      confirmText: S.chat.hideChat,
      destructive: true,
      onConfirm: () => hideMutation.mutate(),
    });
  };
  const toggleMute = () => {
    setMenuOpen(false);
    if (thread) muteMutation.mutate(!thread.muted);
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

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          backgroundColor: t.card,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={26} color={t.text} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}
          disabled={!thread?.isGroup}
          onPress={() => thread?.isGroup && router.push(`/chat/group/${threadId}` as never)}
        >
          <Text
            style={{ flex: 1, fontSize: 17, fontWeight: "700", color: t.text, letterSpacing: -0.3 }}
            numberOfLines={1}
          >
            {thread?.name ?? "Чат"}
          </Text>
          {thread?.isGroup && <ChevronRight size={18} color={t.faint} strokeWidth={2} />}
        </Pressable>
        {!isOfficial && !thread?.isGroup && (
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <MoreVertical size={22} color={t.text} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Өмнөх мессеж ачаалах */}
          {hasMore && messages.length >= PAGE && (
            <Pressable
              onPress={loadEarlier}
              style={{ alignSelf: "center", paddingVertical: 8, paddingHorizontal: 16 }}
            >
              {loadingMore ? (
                <ActivityIndicator color={t.sub} />
              ) : (
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.sub }}>
                  {S.chat.loadEarlier}
                </Text>
              )}
            </Pressable>
          )}

          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const showDay =
              !!m.createdAt && dayLabel(m.createdAt) !== dayLabel(prev?.createdAt);
            return (
              <View key={m.id}>
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
                    maxWidth: "78%",
                    alignSelf: m.fromMe ? "flex-end" : "flex-start",
                  }}
                >
                  {!m.fromMe && m.senderName && (
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
                    {m.failed && <AlertCircle size={12} color="#E5484D" strokeWidth={2} />}
                    <Text style={{ fontSize: 10.5, color: m.failed ? "#E5484D" : t.faint }}>
                      {m.failed ? S.chat.sendFailed : m.pending ? S.chat.sending : m.time}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

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
              paddingBottom: Platform.OS === "ios" ? 26 : 16,
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
          /* Input bar */
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: Platform.OS === "ios" ? 24 : 14,
              borderTopWidth: 1,
              borderTopColor: t.border,
              backgroundColor: t.card,
            }}
          >
            <Pressable
              onPress={() => setAttachOpen(true)}
              disabled={mediaMutation.isPending}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: t.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mediaMutation.isPending ? (
                <ActivityIndicator size="small" color={t.accent} />
              ) : (
                <Plus size={22} color={t.sub} strokeWidth={2} />
              )}
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={S.chat.inputPlaceholder}
              placeholderTextColor={t.faint}
              multiline
              style={{
                flex: 1,
                maxHeight: 110,
                fontSize: 14.5,
                color: t.text,
                backgroundColor: t.bg,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingTop: 9,
                paddingBottom: 9,
              }}
            />
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: draft.trim() ? t.accent : t.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={19} color={draft.trim() ? "#fff" : t.accent} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

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
              paddingBottom: Platform.OS === "ios" ? 34 : 18,
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

      {/* 1:1 чатын цэс (Чимээгүй / Чат нуух) */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: t.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 8,
              paddingBottom: Platform.OS === "ios" ? 34 : 18,
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: t.border }} />
            </View>
            <Pressable
              onPress={toggleMute}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 16 }}
            >
              {thread?.muted ? (
                <Bell size={22} color={t.accent} strokeWidth={2} />
              ) : (
                <BellOff size={22} color={t.accent} strokeWidth={2} />
              )}
              <Text style={{ fontSize: 15.5, fontWeight: "600", color: t.text }}>
                {thread?.muted ? S.chat.unmute : S.chat.mute}
              </Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 22 }} />
            <Pressable
              onPress={confirmHide}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 16 }}
            >
              <EyeOff size={22} color="#E5484D" strokeWidth={2} />
              <Text style={{ fontSize: 15.5, fontWeight: "600", color: "#E5484D" }}>
                {S.chat.hideChat}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
