import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronLeft, Newspaper } from "lucide-react-native";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { NewsItem } from "@/types";

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/news/${item.id}` as never)}
      className="flex-row gap-3 bg-white rounded-2xl border border-gray-100 p-3 mb-3"
    >
      <View className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 items-center justify-center">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Newspaper size={22} color="#9CA3AF" />
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-gray-900 leading-5" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-500 mt-1 leading-4" numberOfLines={2}>
          {item.description}
        </Text>
        <Text className="text-[11px] text-gray-400 mt-1">{formatDate(item.date)}</Text>
      </View>
    </Pressable>
  );
}

export default function AllNewsScreen() {
  const { data: news, isLoading } = useQuery({
    queryKey: queryKeys.news.all,
    queryFn: () => api.getNews(50),
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
        <Text className="text-lg font-bold text-gray-900">Бүх мэдээ</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FD6A02" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 pb-8 pt-1">
          {news && news.length > 0 ? (
            news.map((item) => <NewsRow key={item.id} item={item} />)
          ) : (
            <Text className="text-sm text-gray-400 text-center mt-10">
              Мэдээ алга байна.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
