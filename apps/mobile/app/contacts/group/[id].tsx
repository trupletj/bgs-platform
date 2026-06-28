import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { BgsCard } from "@/components/bgs/card";
import { UserRow } from "@/components/contacts/user-row";
import { ScreenHeader } from "@/components/ui/screen-header";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";

export default function OrgGroupMembersScreen() {
  const t = useTheme();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id);

  const { data: members } = useQuery({
    queryKey: queryKeys.contacts.orgGroupMembers(groupId),
    queryFn: () => api.getOrgGroupMembers(groupId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.contacts.orgGroupMembers(groupId) });
    qc.invalidateQueries({ queryKey: queryKeys.contacts.list });
    qc.invalidateQueries({ queryKey: queryKeys.contacts.requests });
  };

  const addMutation = useMutation({
    mutationFn: (userId: string) => api.sendContactRequest(userId),
    onSuccess: invalidate,
  });
  const acceptMutation = useMutation({
    mutationFn: (requesterId: string) => api.respondContactRequest(requesterId, true),
    onSuccess: invalidate,
  });
  const pending = addMutation.isPending || acceptMutation.isPending;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={S.contacts.members} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {(members ?? []).length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: t.faint }}>{S.contacts.empty}</Text>
          </View>
        ) : (
          <BgsCard t={t} style={{ overflow: "hidden" }}>
            {(members ?? []).map((u, i) => (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
