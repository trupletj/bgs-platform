import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { S } from "@/constants/strings";
import { useAuthStore } from "@/stores/auth-store";

interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ label, value, last }: InfoRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 flex-1 text-right ml-4" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function PersonalInfoScreen() {
  const user = useAuthStore((s) => s.user);
  const P = S.personalInfo;

  if (!user) return null;

  const empCode = user.employeeId.replace(/^BGS-?/i, "") || user.employeeId;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <ChevronLeft size={20} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">{P.title}</Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-6 pt-2">
        <View className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <InfoRow label={P.name} value={user.name || P.empty} />
          <InfoRow label={P.role} value={user.role || P.empty} />
          <InfoRow label={P.department} value={user.department || P.empty} />
          <InfoRow label={P.heltes} value={user.heltesName || P.empty} />
          <InfoRow label={P.employeeCode} value={empCode || P.empty} />
          <InfoRow label={P.idCardNumber} value={user.idCardNumber || P.empty} />
          <InfoRow label={P.email} value={user.email || P.empty} />
          <InfoRow label={P.phone} value={user.phone || P.empty} last />
        </View>

        <Text className="text-xs text-gray-400 mt-4 px-1 leading-5">{P.note}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
