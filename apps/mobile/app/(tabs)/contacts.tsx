import { useCallback, useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Users, ChevronRight } from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { ContactListItem } from "@/components/contacts/contact-list-item";
import { RequestRow } from "@/components/contacts/request-row";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { getTheme } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { tapSuccess } from "@/lib/haptics";
import { confirmDialog, alertDialog } from "@/lib/dialog";

function SectionLabel({ t, children }: { t: ReturnType<typeof getTheme>; children: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: t.sub,
        marginBottom: 6,
        marginLeft: 4,
        marginTop: 14,
      }}
    >
      {children}
    </Text>
  );
}

export default function ContactsScreen() {
  const t = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: contacts, refetch: refetchContacts } = useQuery({
    queryKey: queryKeys.contacts.list,
    queryFn: api.getContacts,
  });
  const { data: requests, refetch: refetchRequests } = useQuery({
    queryKey: queryKeys.contacts.requests,
    queryFn: api.getContactRequests,
  });
  const { data: orgGroups, refetch: refetchGroups } = useQuery({
    queryKey: queryKeys.contacts.orgGroups,
    queryFn: api.getOrgGroups,
  });
  const { data: threads, refetch: refetchThreads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });

  const [refreshing, setRefreshing] = useState(false);
  const refreshAll = useCallback(async () => {
    await Promise.all([refetchContacts(), refetchRequests(), refetchGroups(), refetchThreads()]);
  }, [refetchContacts, refetchRequests, refetchGroups, refetchThreads]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api.respondContactRequest(id, accept),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.requests });
      qc.invalidateQueries({ queryKey: queryKeys.contacts.list });
    },
  });

  const openChatMutation = useMutation({
    mutationFn: (userId: string) => api.createDirectConversation(userId),
    onSuccess: (convId) => {
      if (convId) router.push(`/chat/${convId}` as never);
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? "Чат нээж чадсангүй"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.removeContact(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.list }),
  });

  const confirmRemove = (userId: string) =>
    confirmDialog({
      title: S.contacts.remove,
      message: S.contacts.removeConfirm,
      confirmText: S.contacts.remove,
      destructive: true,
      onConfirm: () => removeMutation.mutate(userId),
    });

  const chatGroups = (threads ?? []).filter((th) => th.isGroup);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: "800", color: t.text, letterSpacing: -0.5 }}>
          {S.contacts.title}
        </Text>
        <Pressable
          onPress={() => router.push("/contacts/add" as never)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            backgroundColor: t.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={22} color={t.accent} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
      >
        {/* Requests */}
        {!!requests?.length && (
          <>
            <SectionLabel t={t}>{S.contacts.requests}</SectionLabel>
            <View>
              {requests.map((r, i) => (
                <RequestRow
                  key={r.requesterId}
                  t={t}
                  request={r}
                  hasBorder={i > 0}
                  disabled={respondMutation.isPending}
                  onAccept={(req) => {
                    tapSuccess();
                    respondMutation.mutate({ id: req.requesterId, accept: true });
                  }}
                  onDecline={(req) => respondMutation.mutate({ id: req.requesterId, accept: false })}
                />
              ))}
            </View>
          </>
        )}

        {/* Contacts */}
        <SectionLabel t={t}>{S.contacts.contactsSection}</SectionLabel>
        {contacts?.length ? (
          <View>
            {contacts.map((c, i) => (
              <ContactListItem
                key={c.userId}
                t={t}
                contact={c}
                hasBorder={i > 0}
                onPress={() => !openChatMutation.isPending && openChatMutation.mutate(c.userId)}
                onLongPress={() => confirmRemove(c.userId)}
              />
            ))}
          </View>
        ) : (
          <BgsCard t={t} style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: t.sub, fontWeight: "600" }}>
              {S.contacts.noContacts}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.faint, marginTop: 4 }}>
              {S.contacts.noContactsHint}
            </Text>
          </BgsCard>
        )}

        {/* Chat groups */}
        {!!chatGroups.length && (
          <>
            <SectionLabel t={t}>{S.contacts.chatGroups}</SectionLabel>
            <View>
              {chatGroups.map((g, i) => (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/chat/${g.id}` as never)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 11,
                    paddingHorizontal: 6,
                    paddingVertical: 9,
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
                    <Users size={22} color={t.accent} strokeWidth={2} />
                  </View>
                  <Text
                    style={{ flex: 1, fontSize: 15, fontWeight: "700", color: t.text }}
                    numberOfLines={1}
                  >
                    {g.name}
                  </Text>
                  <ChevronRight size={18} color={t.faint} strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Org groups */}
        {!!orgGroups?.length && (
          <>
            <SectionLabel t={t}>{S.contacts.orgGroups}</SectionLabel>
            <View>
              {orgGroups.map((g, i) => (
                <Pressable
                  key={g.groupId}
                  onPress={() => router.push(`/contacts/group/${g.groupId}` as never)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 11,
                    paddingHorizontal: 6,
                    paddingVertical: 9,
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
                    <Users size={22} color={t.accent} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: t.sub }}>
                      {g.memberCount} {S.contacts.membersCount}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={t.faint} strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
