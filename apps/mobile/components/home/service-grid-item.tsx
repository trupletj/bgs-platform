import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getServiceIcon } from "@/lib/icon-map";
import type { ServiceItem } from "@/types";

interface ServiceGridItemProps {
  item: ServiceItem;
}

export function ServiceGridItem({ item }: ServiceGridItemProps) {
  const Icon = getServiceIcon(item.icon);
  const router = useRouter();

  return (
    <Pressable className="items-center p-3" onPress={() => item.route && router.push(item.route as any)}>
      <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 items-center justify-center mb-2">
        <Icon size={22} color="#2563EB" />
      </View>
      <Text className="text-xs text-gray-700 dark:text-gray-300 text-center">
        {item.title}
      </Text>
    </Pressable>
  );
}
