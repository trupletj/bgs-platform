import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, QrCode, User } from "lucide-react-native";
import { getTheme } from "@/lib/theme";

const TAB_ICONS = [Home, QrCode, User] as const;
const TAB_LABELS = ["Нүүр", "QR код", "Профайл"];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = getTheme(false);

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
          const isCenter = index === 1;
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

          if (isCenter) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  alignItems: "center",
                  gap: 3,
                  transform: [{ translateY: -1 }],
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 38,
                    borderRadius: 14,
                    backgroundColor: isFocused ? t.accent : t.accentSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: t.accent,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isFocused ? 0.4 : 0,
                    shadowRadius: 16,
                    elevation: isFocused ? 6 : 0,
                  }}
                >
                  <Icon size={23} color={isFocused ? "#fff" : t.accent} strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: isFocused ? t.accent : t.sub,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 6 }}
            >
              <Icon
                size={22}
                color={isFocused ? t.accent : t.sub}
                strokeWidth={isFocused ? 2.2 : 1.9}
              />
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
