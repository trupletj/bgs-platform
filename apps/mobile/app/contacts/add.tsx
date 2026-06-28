import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Users } from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { SearchBar } from "@/components/ui/search-bar";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { ScreenHeader } from "@/components/ui/screen-header";
import { UserRow } from "@/components/contacts/user-row";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { DirectoryUser } from "@/types";

export default function AddContactScreen() {
  const t = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: users } = useQuery({
    queryKey: queryKeys.contacts.search(debouncedSearch),
    queryFn: () => api.searchSystemUsers(debouncedSearch),
    enabled: tab === 0,
  });

  const { data: orgGroups } = useQuery({
    queryKey: queryKeys.contacts.orgGroups,
    queryFn: api.getOrgGroups,
    enabled: tab === 1,
  });

  const invalidatePeople = () => {
    qc.invalidateQueries({ queryKey: ["contacts"] });
  };

  const addMutation = useMutation({
    mutationFn: (userId: string) => api.sendContactRequest(userId),
    onSuccess: invalidatePeople,
  });

  const acceptMutation = useMutation({
    mutationFn: (requesterId: string) => api.respondContactRequest(requesterId, true),
    onSuccess: invalidatePeople,
  });

  const pending = addMutation.isPending || acceptMutation.isPending;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={S.contacts.add} />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        <SegmentTabs
          tabs={[S.contacts.tabSearch, S.contacts.tabOrg]}
          activeIndex={tab}
          onChange={setTab}
        />
        {tab === 0 && (
          <SearchBar value={search} onChangeText={setSearch} placeholder={S.contacts.search} />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 0 ? (
          (users ?? []).length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 14, color: t.faint }}>{S.contacts.empty}</Text>
            </View>
          ) : (
            <BgsCard t={t} style={{ overflow: "hidden" }}>
              {(users ?? []).map((u: DirectoryUser, i) => (
                <UserRow
                  key={u.id}
                  t={t}
                  user={u}
                  hasBorder={i > 0}
                  pending={pending}
                  onAdd={(usr) => addMutation.mutate(usr.id)}
                  onAccept={(usr) => acceptMutation.mutate(usr.id)}
                />
              ))}
            </BgsCard>
          )
        ) : (orgGroups ?? []).length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: t.faint }}>{S.contacts.empty}</Text>
          </View>
        ) : (
          <BgsCard t={t} style={{ overflow: "hidden" }}>
            {(orgGroups ?? []).map((g, i) => (
              <Pressable
                key={g.groupId}
                onPress={() => router.push(`/contacts/group/${g.groupId}` as never)}
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
          </BgsCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
