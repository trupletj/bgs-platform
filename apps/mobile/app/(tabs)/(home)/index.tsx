import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Plus, MessageSquarePlus, Users, QrCode, Compass, Search } from "lucide-react-native";
import { ChatList } from "@/components/chat/chat-list";
import { NativeIcon } from "@/components/ui/native-icon";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";

export default function ChatScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searching, setSearching] = useState(false);

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

  const menuItems = [
    { icon: MessageSquarePlus, sf: "square.and.pencil", label: S.chat.newChat, route: "/chat/new" },
    { icon: Users, sf: "person.2.fill", label: S.chat.newGroup, route: "/chat/new-group" },
    { icon: Compass, sf: "safari", label: S.chat.discover, route: "/chat/discover" },
    { icon: QrCode, sf: "qrcode", label: S.chat.scanQR, route: "/profile/qr" },
  ] as const;

  const go = (route: string) => {
    setMenuOpen(false);
    router.push(route as never);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: S.chat.title,
          headerTitleAlign: "center",
          // iOS — native frosted glass (iOS 26-д Liquid Glass автоматаар).
          // Android — энгийн өнгөт (Material-д glass nav bar байхгүй).
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect: t.dark ? "systemChromeMaterialDark" : "systemChromeMaterialLight",
          // iOS — backgroundColor тавихгүй (тавивал blur material идэвхгүй болж
          // дэлгэцийн дэвсгэр цайвараар харагдана). Android — энгийн өнгөт.
          headerStyle: Platform.OS === "ios" ? undefined : { backgroundColor: t.card },
          headerShadowVisible: false,
          headerTintColor: t.text,
          headerLeft: searching
            ? undefined
            : () => (
                <Pressable onPress={() => setSearching(true)} hitSlop={8}>
                  <NativeIcon sf="magnifyingglass" lucide={Search} size={22} color={t.text} />
                </Pressable>
              ),
          headerRight: searching
            ? undefined
            : () => (
                <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
                  <NativeIcon sf="plus" lucide={Plus} size={24} color={t.accent} />
                </Pressable>
              ),
          headerSearchBarOptions: searching
            ? {
                placeholder: S.chat.search,
                autoFocus: true,
                onChangeText: (e) => setSearch(e.nativeEvent.text),
                onCancelButtonPress: () => {
                  setSearch("");
                  setSearching(false);
                },
                onClose: () => setSearching(false),
                textColor: t.text,
                tintColor: t.accent,
                hintTextColor: t.faint,
                headerIconColor: t.text,
              }
            : undefined,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: t.bg }}
        contentInsetAdjustmentBehavior="automatic"
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

      {/* "+" цэс — bottom sheet */}
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
              paddingBottom: Math.max(insets.bottom, 18),
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: t.border }} />
            </View>
            {menuItems.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => go(item.route)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingHorizontal: 22,
                  paddingVertical: 15,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: t.border,
                }}
              >
                <NativeIcon sf={item.sf} lucide={item.icon} size={21} color={t.accent} />
                <Text style={{ fontSize: 15.5, fontWeight: "600", color: t.text }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
