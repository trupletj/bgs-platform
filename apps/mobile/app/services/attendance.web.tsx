import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { S } from "@/constants/strings";

const MINI_APP_URL =
  process.env.EXPO_PUBLIC_BGS_ATTENDANCE_URL ??
  "https://bgs-attendance.vercel.app";

export default function AttendanceScreenWeb() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (!data.session) {
        setLoadError("Session олдсонгүй. Дахин нэвтэрнэ үү.");
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <Text className="text-gray-900 dark:text-white font-semibold text-base">
          {S.attendanceDetail.title}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
          {loadError}
        </Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center"
        >
          <ChevronLeft size={20} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          {S.attendanceDetail.title}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        {/* @ts-expect-error iframe is web-only */}
        <iframe
          src={`${MINI_APP_URL}/?embed=1&platform=web`}
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </View>
    </SafeAreaView>
  );
}
