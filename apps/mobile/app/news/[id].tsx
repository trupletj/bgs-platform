import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Heart } from "lucide-react-native";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: news, isLoading } = useQuery({
    queryKey: queryKeys.news.detail(String(id)),
    queryFn: () => api.getNewsById(String(id)),
    enabled: !!id,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <ChevronLeft size={20} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Мэдээ</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FD6A02" />
        </View>
      ) : !news ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-sm text-gray-400 text-center">
            Мэдээ олдсонгүй.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-10">
          {news.imageUrl ? (
            <Image
              source={{ uri: news.imageUrl }}
              style={{ width: "100%", height: 200 }}
              contentFit="cover"
              transition={200}
            />
          ) : null}
          <View className="px-5 pt-5">
            <Text className="text-xs text-gray-400">{formatDate(news.date)}</Text>
            <Text className="text-xl font-bold text-gray-900 mt-2 leading-7">
              {news.title}
            </Text>
            <Text className="text-[15px] text-gray-700 mt-4 leading-6">
              {news.body || news.description}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-6">
              <Heart size={16} color="#EF4444" />
              <Text className="text-xs text-gray-500">{news.likes}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
