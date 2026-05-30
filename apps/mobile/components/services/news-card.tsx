import { View, Text, Pressable } from "react-native";
import { Heart, ChevronRight } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { S } from "@/constants/strings";
import type { NewsItem } from "@/types";

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  return (
    <Card className="mb-3">
      <View className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 items-center justify-center">
        <Text className="text-gray-400 text-sm">BGS</Text>
      </View>
      <Text className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        {item.title}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3" numberOfLines={2}>
        {item.description}
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Heart size={14} color="#EF4444" />
          <Text className="text-xs text-gray-500">
            {item.likes} {S.notifications.likes}
          </Text>
        </View>
        <Pressable className="flex-row items-center gap-1">
          <Text className="text-xs text-primary font-medium">
            {S.notifications.readMore}
          </Text>
          <ChevronRight size={14} color="#2563EB" />
        </Pressable>
      </View>
    </Card>
  );
}
