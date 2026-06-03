import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { FileListItem } from "@/components/services/file-list-item";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export default function DocumentsScreen() {
  const D = S.documents;
  const { data: files } = useQuery({
    queryKey: queryKeys.files.all,
    queryFn: api.getFiles,
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
        <Text className="text-lg font-bold text-gray-900">{D.title}</Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-6 pt-2">
        <View className="rounded-2xl bg-white border border-gray-100 px-3">
          {files && files.length > 0 ? (
            files.map((item) => <FileListItem key={item.id} item={item} />)
          ) : (
            <Text className="text-sm text-gray-400 py-6 text-center">{D.empty}</Text>
          )}
        </View>

        <Text className="text-xs text-gray-400 mt-4 px-1 leading-5">{D.note}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
