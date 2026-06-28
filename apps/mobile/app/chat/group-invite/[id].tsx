import { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { SearchBar } from "@/components/ui/search-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { alertDialog } from "@/lib/dialog";

export default function GroupInviteScreen() {
  const t = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data: contacts } = useQuery({
    queryKey: queryKeys.contacts.list,
    queryFn: api.getContacts,
  });
  const { data: members } = useQuery({
    queryKey: queryKeys.chat.groupMembers(groupId),
    queryFn: () => api.getGroupMembers(groupId),
  });

  const memberIds = useMemo(
    () => new Set((members ?? []).map((m) => m.userId)),
    [members]
  );

  const addMutation = useMutation({
    mutationFn: async () => {
      const ids = Object.keys(selected).filter((k) => selected[k]);
      for (const uid of ids) {
        await api.addGroupMember(groupId, uid);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.groupMembers(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.groupDetail(groupId) });
      router.back();
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? "Гишүүн нэмж чадсангүй"),
  });

  // Аль хэдийн гишүүн болсон contact-уудыг хасна
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (contacts ?? [])
      .filter((c) => !memberIds.has(c.userId))
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [contacts, memberIds, search]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const canAdd = selectedCount > 0 && !addMutation.isPending;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title={S.chat.inviteTitle}
        right={
          <Pressable
            onPress={() => canAdd && addMutation.mutate()}
            disabled={!canAdd}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: canAdd ? t.accent : t.accentSoft,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: canAdd ? "#fff" : t.accent }}>
              {S.chat.add}
            </Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={S.contacts.search} />
      </View>

      {addMutation.isPending && (
        <View style={{ paddingVertical: 8, alignItems: "center" }}>
          <ActivityIndicator color={t.accent} />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {candidates.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: t.faint }}>{S.chat.allContactsAdded}</Text>
          </View>
        ) : (
          <BgsCard t={t} style={{ overflow: "hidden" }}>
            {candidates.map((c, i) => {
              const isSel = !!selected[c.userId];
              return (
                <Pressable
                  key={c.userId}
                  onPress={() => setSelected((prev) => ({ ...prev, [c.userId]: !prev[c.userId] }))}
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
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      borderWidth: isSel ? 0 : 1.5,
                      borderColor: t.border,
                      backgroundColor: isSel ? t.accent : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSel && <Check size={15} color="#fff" strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })}
          </BgsCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
