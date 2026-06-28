import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { SearchBar } from "@/components/ui/search-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { alertDialog } from "@/lib/dialog";
import type { GroupVisibility } from "@/types";

export default function NewGroupScreen() {
  const t = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("private");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data: contacts } = useQuery({
    queryKey: queryKeys.contacts.list,
    queryFn: api.getContacts,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createGroupConversation(
        title.trim(),
        Object.keys(selected).filter((k) => selected[k]),
        visibility
      ),
    onSuccess: (convId) => {
      if (convId) router.replace(`/chat/${convId}` as never);
    },
    onError: (e: any) => alertDialog("Алдаа", e?.message ?? "Бүлэг үүсгэж чадсангүй"),
  });

  const selectedCount = Object.values(selected).filter(Boolean).length;
  // Зөвхөн нэр шаардлагатай — гишүүн сонгох нь сонголттой (нээлттэй групп бол бусад нь дараа нэгдэнэ).
  const canCreate = title.trim().length > 0 && !createMutation.isPending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts ?? [];
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, search]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader
        title={S.chat.newGroup}
        right={
          <Pressable
            onPress={() => canCreate && createMutation.mutate()}
            disabled={!canCreate}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: canCreate ? t.accent : t.accentSoft,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: canCreate ? "#fff" : t.accent }}>
              {S.chat.create}
            </Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 10 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={S.chat.groupNamePlaceholder}
          placeholderTextColor={t.faint}
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: t.text,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        />
        {/* Visibility toggle */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["private", "public"] as GroupVisibility[]).map((v) => {
            const active = visibility === v;
            return (
              <Pressable
                key={v}
                onPress={() => setVisibility(v)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? t.accent : t.border,
                  backgroundColor: active ? t.accentSoft : t.card,
                }}
              >
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: active ? t.accent : t.text }}>
                  {v === "public" ? S.chat.public : S.chat.private}
                </Text>
                <Text style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>
                  {v === "public" ? S.chat.publicHint : S.chat.privateHint}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder={S.contacts.search} />
        {selectedCount > 0 && (
          <Text style={{ fontSize: 12.5, color: t.sub, marginLeft: 4 }}>
            {selectedCount} {S.chat.selectedCount}
          </Text>
        )}
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
            {filtered.map((c, i) => {
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
