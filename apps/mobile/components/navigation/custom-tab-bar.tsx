import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, LayoutGrid, Users, User } from "lucide-react-native";
import { useTheme } from "@/hooks/use-theme";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const TAB_ICONS = [MessageCircle, Users, LayoutGrid, User] as const;
const TAB_LABELS = [S.tabs.chat, S.tabs.contacts, S.tabs.miniApps, S.tabs.profile];
// Чат таб (index 0) дээр нийт unread badge харуулна
const CHAT_TAB_INDEX = 0;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const { data: threads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });
  // Official нуугдсан + чимээгүй чатыг нийт unread-д тооцохгүй
  const totalUnread = (threads ?? [])
    .filter((th) => !th.isOfficial && !th.muted)
    .reduce((sum, th) => sum + (th.unread ?? 0), 0);

  return (
    <View
      style={{
        paddingTop: 9,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          marginHorizontal: 16,
          height: 60,
          borderRadius: 22,
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: t.dark ? 0.55 : 0.12,
          shadowRadius: 30,
          elevation: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingHorizontal: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[index];
          const label = TAB_LABELS[index];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const badge = index === CHAT_TAB_INDEX ? totalUnread : 0;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 6 }}
            >
              <View>
                <Icon
                  size={22}
                  color={isFocused ? t.accent : t.sub}
                  strokeWidth={isFocused ? 2.2 : 1.9}
                />
                {badge > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -10,
                      minWidth: 17,
                      height: 17,
                      borderRadius: 9,
                      backgroundColor: "#E5484D",
                      borderWidth: 1.5,
                      borderColor: t.card,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: "800", color: "#fff" }}>
                      {badge > 99 ? "99+" : badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isFocused ? "700" : "600",
                  color: isFocused ? t.accent : t.sub,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
