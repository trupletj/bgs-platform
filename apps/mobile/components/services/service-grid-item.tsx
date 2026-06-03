import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getServiceIcon } from "@/lib/icon-map";
import { Badge } from "@/components/ui/badge";
import type { ServiceItem } from "@/types";

interface ServiceGridItemProps {
  item: ServiceItem;
  columns?: 3 | 4;
}

export function ServiceGridItem({ item, columns = 3 }: ServiceGridItemProps) {
  const Icon = getServiceIcon(item.icon);
  const router = useRouter();
  const widthClass = columns === 4 ? "w-1/4" : "w-1/3";

  return (
    <Pressable
      className={`${widthClass} items-center py-3`}
      onPress={() =>
        item.route
          ? router.push(item.route as any)
          : Alert.alert(item.title, "Энэ үйлчилгээ удахгүй нэмэгдэнэ.")
      }
    >
      <View className="relative">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${
            item.iconBg || "bg-blue-50 dark:bg-blue-950"
          }`}
        >
          <Icon size={22} color={item.iconColor || "#2563EB"} />
        </View>
        {item.badge && (
          <View className="absolute -top-1 -right-2">
            <Badge variant={item.badgeVariant || "info"} className="px-1.5 py-0.5">
              {item.badge}
            </Badge>
          </View>
        )}
      </View>
      <Text
        className="text-xs text-gray-700 dark:text-gray-300 text-center"
        numberOfLines={1}
      >
        {item.title}
      </Text>
    </Pressable>
  );
}
