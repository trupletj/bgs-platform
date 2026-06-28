import { useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Users,
  Check,
  X,
  Lock,
  Globe,
  UserPlus,
  Pencil,
  LogOut,
  Bell,
  BellOff,
} from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { getTheme } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { useAuthStore } from "@/stores/auth-store";
import { confirmDialog, alertDialog } from "@/lib/dialog";
import type { GroupVisibility } from "@/types";

function SectionLabel({ t, children }: { t: ReturnType<typeof getTheme>; children: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: t.sub,
        marginBottom: 8,
        marginLeft: 4,
        marginTop: 18,
      }}
    >
      {children}
    </Text>
  );
}

export default function GroupInfoScreen() {
  const t = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id);

  const myId = useAuthStore((s) => s.user?.id);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState("");

  const { data: threads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });
  const muted = threads?.find((th) => th.id === groupId)?.muted ?? false;

  const { data: detail } = useQuery({
    queryKey: queryKeys.chat.groupDetail(groupId),
    queryFn: () => api.getGroupDetail(groupId),
  });
  const { data: members } = useQuery({
    queryKey: queryKeys.chat.groupMembers(groupId),
    queryFn: () => api.getGroupMembers(groupId),
  });
  const { data: requests } = useQuery({
    queryKey: queryKeys.chat.groupRequests(groupId),
    queryFn: () => api.getGroupJoinRequests(groupId),
    enabled: detail?.isAdmin === true,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.chat.groupDetail(groupId) });
    qc.invalidateQueries({ queryKey: queryKeys.chat.groupMembers(groupId) });
    qc.invalidateQueries({ queryKey: queryKeys.chat.groupRequests(groupId) });
  };

  const visibilityMutation = useMutation({
    mutationFn: (v: GroupVisibility) => api.setGroupVisibility(groupId, v),
    onSuccess: invalidate,
  });
  const respondMutation = useMutation({
    mutationFn: ({ userId, accept }: { userId: string; accept: boolean }) =>
      api.respondGroupJoinRequest(groupId, userId, accept),
    onSuccess: invalidate,
  });
  const invalidateAll = () => {
    invalidate();
    qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
  };
  const muteMutation = useMutation({
    mutationFn: (v: boolean) => api.setMute(groupId, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chat.threads }),
  });
  const renameMutation = useMutation({
    mutationFn: (title: string) => api.setGroupTitle(groupId, title),
    onSuccess: () => {
      setRenameOpen(false);
      invalidateAll();
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? ""),
  });
  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.removeGroupMember(groupId, userId),
    onSuccess: invalidateAll,
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? ""),
  });
  const leaveMutation = useMutation({
    mutationFn: () => api.leaveGroup(groupId),
    onSuccess: () => {
      invalidateAll();
      router.replace("/(tabs)" as never);
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? ""),
  });

  const confirmRemove = (userId: string) =>
    confirmDialog({
      title: S.chat.removeMember,
      message: S.chat.removeMemberConfirm,
      confirmText: S.chat.removeMember,
      destructive: true,
      onConfirm: () => removeMutation.mutate(userId),
    });
  const confirmLeave = () =>
    confirmDialog({
      title: S.chat.leaveGroup,
      message: S.chat.leaveGroupConfirm,
      confirmText: S.chat.leaveGroup,
      destructive: true,
      onConfirm: () => leaveMutation.mutate(),
    });

  const isAdmin = detail?.isAdmin ?? false;
  const visibility = detail?.visibility ?? "private";

  const confirmVisibility = (v: GroupVisibility) => {
    if (v === visibility || visibilityMutation.isPending) return;
    confirmDialog({
      title: S.chat.visibility,
      message: v === "public" ? S.chat.confirmPublic : S.chat.confirmPrivate,
      onConfirm: () => visibilityMutation.mutate(v),
    });
  };
  // Энэ дэлгэцийг харж буй хүн гишүүн. private бол зөвхөн админ, public бол аль ч гишүүн урина.
  const canInvite = !!detail && (visibility === "public" || isAdmin);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={S.chat.groupInfo} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group identity */}
        <BgsCard t={t} style={{ padding: 20, alignItems: "center" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: t.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={30} color={t.accent} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "800", color: t.text, marginTop: 12 }}>
            {detail?.title ?? "Группа"}
          </Text>
          <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 3 }}>
            {detail?.memberCount ?? 0} {S.chat.membersCount} ·{" "}
            {visibility === "public" ? S.chat.public : S.chat.private}
          </Text>
        </BgsCard>

        {/* Settings: mute + rename */}
        <View style={{ marginTop: 14 }}>
          <BgsCard t={t} style={{ overflow: "hidden" }}>
            <Pressable
              onPress={() => muteMutation.mutate(!muted)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 13,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              {muted ? (
                <BellOff size={20} color={t.sub} strokeWidth={1.9} />
              ) : (
                <Bell size={20} color={t.sub} strokeWidth={1.9} />
              )}
              <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: t.text }}>
                {muted ? S.chat.unmute : S.chat.mute}
              </Text>
            </Pressable>
            {isAdmin && (
              <Pressable
                onPress={() => {
                  setRenameText(detail?.title ?? "");
                  setRenameOpen(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 13,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: 1,
                  borderTopColor: t.border,
                }}
              >
                <Pencil size={20} color={t.sub} strokeWidth={1.9} />
                <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: t.text }}>
                  {S.chat.rename}
                </Text>
              </Pressable>
            )}
          </BgsCard>
        </View>

        {/* Visibility (admin only) */}
        {isAdmin && (
          <>
            <SectionLabel t={t}>{S.chat.visibility}</SectionLabel>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["private", "public"] as GroupVisibility[]).map((v) => {
                const active = visibility === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => confirmVisibility(v)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? t.accent : t.border,
                      backgroundColor: active ? t.accentSoft : t.card,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {v === "public" ? (
                      <Globe size={18} color={active ? t.accent : t.sub} strokeWidth={2} />
                    ) : (
                      <Lock size={18} color={active ? t.accent : t.sub} strokeWidth={2} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: "700", color: active ? t.accent : t.text }}>
                        {v === "public" ? S.chat.public : S.chat.private}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: t.sub, marginTop: 1 }}>
                        {v === "public" ? S.chat.publicHint : S.chat.privateHint}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Join requests (admin only) */}
        {isAdmin && !!requests?.length && (
          <>
            <SectionLabel t={t}>{S.chat.joinRequests}</SectionLabel>
            <BgsCard t={t} style={{ overflow: "hidden" }}>
              {requests.map((r, i) => (
                <View
                  key={r.userId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 13,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: t.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 15,
                      backgroundColor: t.accentSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 17, fontWeight: "800", color: t.accent }}>
                      {(r.name || "?").charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
                      {r.name || "—"}
                    </Text>
                    {!!r.positionName && (
                      <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={1}>
                        {r.positionName}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Pressable
                      onPress={() =>
                        !respondMutation.isPending &&
                        respondMutation.mutate({ userId: r.userId, accept: false })
                      }
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: t.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={18} color={t.sub} strokeWidth={2.2} />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        !respondMutation.isPending &&
                        respondMutation.mutate({ userId: r.userId, accept: true })
                      }
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: t.accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={18} color="#fff" strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </BgsCard>
          </>
        )}

        {/* Members */}
        <SectionLabel t={t}>{S.chat.members}</SectionLabel>
        {canInvite && (
          <Pressable
            onPress={() => router.push(`/chat/group-invite/${groupId}` as never)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.accent,
              backgroundColor: t.accentSoft,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 15,
                backgroundColor: t.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={22} color={t.accent} strokeWidth={2} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: t.accent }}>
              {visibility === "public" ? S.chat.invite : S.chat.addMember}
            </Text>
          </Pressable>
        )}
        <BgsCard t={t} style={{ overflow: "hidden" }}>
          {(members ?? []).map((m, i) => (
            <View
              key={m.userId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 13,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: t.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 15,
                  backgroundColor: t.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "800", color: t.accent }}>
                  {(m.name || "?").charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
                  {m.name || "—"}
                </Text>
                {!!m.positionName && (
                  <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={1}>
                    {m.positionName}
                  </Text>
                )}
              </View>
              {m.role === "admin" && (
                <Text style={{ fontSize: 12, fontWeight: "700", color: t.accent }}>
                  {S.chat.admin}
                </Text>
              )}
              {isAdmin && m.userId !== myId && m.role !== "admin" && (
                <Pressable
                  onPress={() => confirmRemove(m.userId)}
                  hitSlop={8}
                  style={{ marginLeft: 4, padding: 4 }}
                >
                  <X size={18} color={t.faint} strokeWidth={2.2} />
                </Pressable>
              )}
            </View>
          ))}
        </BgsCard>

        {/* Leave group */}
        <Pressable
          onPress={confirmLeave}
          style={{
            marginTop: 18,
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogOut size={19} color="#E5484D" strokeWidth={2} />
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: "#E5484D" }}>
            {S.chat.leaveGroup}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Rename modal */}
      <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 30 }}
          onPress={() => setRenameOpen(false)}
        >
          <Pressable
            style={{ backgroundColor: t.card, borderRadius: 18, padding: 18, gap: 12 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: t.text }}>{S.chat.rename}</Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder={S.chat.renamePrompt}
              placeholderTextColor={t.faint}
              autoFocus
              style={{
                fontSize: 15,
                color: t.text,
                backgroundColor: t.bg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <Pressable
                onPress={() => setRenameOpen(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: t.sub }}>{S.chat.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={() => renameText.trim() && renameMutation.mutate(renameText.trim())}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: t.accent,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{S.chat.confirmYes}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
