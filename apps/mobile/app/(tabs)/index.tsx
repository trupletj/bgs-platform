import { useCallback, useState } from "react";
import { ScrollView, View, Text, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useFocusEffect } from "expo-router";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatList } from "@/components/chat/chat-list";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";

export default function ChatScreen() {
  const router = useRouter();
  const t = useTheme();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: threads, refetch } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Чат руу буцаж ороход жагсаалтыг сэргээнэ (шинэ мессеж/чат)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = (threads ?? [])
    // Official (системийн) сувгийг одоогоор нуунa — дараа дахин нээнэ
    .filter((th) => !th.isOfficial)
    .filter(
      (th) =>
        th.name.toLowerCase().includes(search.toLowerCase()) ||
        th.lastMessage.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ChatHeader
        t={t}
        search={search}
        onSearch={setSearch}
        onNewChat={() => router.push("/chat/new" as never)}
        onNewGroup={() => router.push("/chat/new-group" as never)}
        onDiscover={() => router.push("/chat/discover" as never)}
        onScan={() => router.push("/profile/qr" as never)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
      >
        {threads === undefined ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <ActivityIndicator color={t.accent} />
          </View>
        ) : filtered.length > 0 ? (
          <ChatList
            t={t}
            threads={filtered}
            onPressThread={(th) => router.push(`/chat/${th.id}` as never)}
          />
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: t.faint }}>{S.chat.empty}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
