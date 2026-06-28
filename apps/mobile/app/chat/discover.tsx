import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { SearchBar } from "@/components/ui/search-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { PublicGroup } from "@/types";

export default function DiscoverGroupsScreen() {
  const t = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: groups } = useQuery({
    queryKey: queryKeys.chat.publicGroups(debouncedSearch),
    queryFn: () => api.searchPublicGroups(debouncedSearch),
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => api.requestJoinGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "public-groups"] }),
  });

  const renderAction = (g: PublicGroup) => {
    if (g.joinStatus === "member") {
      return (
        <Pressable
          onPress={() => router.push(`/chat/${g.id}` as never)}
          style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: t.accentSoft }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: t.accent }}>{S.chat.joined}</Text>
        </Pressable>
      );
    }
    if (g.joinStatus === "pending") {
      return (
        <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.faint }}>
          {S.chat.joinPending}
        </Text>
      );
    }
    return (
      <Pressable
        onPress={() => !joinMutation.isPending && joinMutation.mutate(g.id)}
        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: t.accent }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{S.chat.join}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={S.chat.discoverTitle} />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={S.contacts.search} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {(groups ?? []).length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: t.faint }}>{S.chat.noPublicGroups}</Text>
          </View>
        ) : (
          <BgsCard t={t} style={{ overflow: "hidden" }}>
            {(groups ?? []).map((g, i) => (
              <View
                key={g.id}
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
                    {g.memberCount} {S.chat.membersCount}
                  </Text>
                </View>
                {renderAction(g)}
              </View>
            ))}
          </BgsCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
