import { View, Pressable, Text } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home,
  LayoutGrid,
  ScanLine,
  Bell,
  User,
} from "lucide-react-native";
import { S } from "@/constants/strings";

const TAB_ICONS = [Home, LayoutGrid, ScanLine, Bell, User] as const;
const TAB_LABELS = [
  S.tabs.home,
  S.tabs.services,
  S.tabs.scan,
  S.tabs.notifications,
  S.tabs.profile,
];

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View className="flex-row bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-6 pt-2 px-2">
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const isCenter = index === 2;
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
            <View key={route.key} className="flex-1 items-center" style={{ marginTop: -20 }}>
              <Pressable
                onPress={onPress}
                className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
              >
                <Icon size={24} color="#FFFFFF" />
              </Pressable>
              <Text className="text-[10px] mt-1 text-primary font-medium">
                {label}
              </Text>
            </View>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center py-1"
          >
            <Icon
              size={22}
              color={isFocused ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              className={`text-[10px] mt-1 ${
                isFocused ? "text-primary font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
