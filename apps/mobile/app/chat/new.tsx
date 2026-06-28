import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BgsCard } from "@/components/bgs/card";
import { SearchBar } from "@/components/ui/search-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { alertDialog } from "@/lib/dialog";

export default function NewChatScreen() {
  const t = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: contacts } = useQuery({
    queryKey: queryKeys.contacts.list,
    queryFn: api.getContacts,
  });

  const createMutation = useMutation({
    mutationFn: (userId: string) => api.createDirectConversation(userId),
    onSuccess: (convId) => {
      if (convId) router.replace(`/chat/${convId}` as never);
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? "Чат эхлүүлж чадсангүй"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts ?? [];
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, search]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={S.chat.newChat} />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={S.contacts.search} />
      </View>

      {createMutation.isPending && (
        <View style={{ paddingVertical: 8, alignItems: "center" }}>
          <ActivityIndicator color={t.accent} />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: t.sub, fontWeight: "600" }}>
              {S.contacts.noContacts}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.faint, marginTop: 4 }}>
              {S.contacts.noContactsHint}
            </Text>
          </View>
        ) : (
          <BgsCard t={t} style={{ overflow: "hidden" }}>
            {filtered.map((c, i) => (
              <Pressable
                key={c.userId}
                onPress={() => !createMutation.isPending && createMutation.mutate(c.userId)}
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
                    {(c.name || "?").charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
                    {c.name || "—"}
                  </Text>
                  {!!(c.positionName || c.heltesName) && (
                    <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={1}>
                      {[c.positionName, c.heltesName].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </BgsCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
