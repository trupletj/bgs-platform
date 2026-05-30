import { View, Text, Pressable } from "react-native";
import { Info, ChevronRight } from "lucide-react-native";

interface NotificationBannerProps {
  message: string;
}

export function NotificationBanner({ message }: NotificationBannerProps) {
  return (
    <Pressable className="flex-row items-center bg-blue-50 dark:bg-blue-950 rounded-xl p-3 mb-3">
      <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
        <Info size={16} color="#FFFFFF" />
      </View>
      <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300" numberOfLines={2}>
        {message}
      </Text>
      <ChevronRight size={16} color="#2563EB" />
    </Pressable>
  );
}
