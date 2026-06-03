import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { S } from "@/constants/strings";

const MINI_APP_URL =
  process.env.EXPO_PUBLIC_BGS_ATTENDANCE_URL ??
  "https://bgs-attendance.vercel.app";

type Tokens = { at: string; rt: string; exp?: number };

export default function AttendanceScreenWeb() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Initial: read supabase session and pass it to the iframe via URL hash.
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
      setTokens({
        at: data.session.access_token,
        rt: data.session.refresh_token,
        exp: data.session.expires_at,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh: when supabase rotates tokens, postMessage them to the iframe.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const w = iframeRef.current?.contentWindow;
      if (!w || !session) return;
      w.postMessage(
        {
          type: "bgs-attendance:refresh-tokens",
          tokens: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
        },
        "*",
      );
    });
    return () => sub.subscription.unsubscribe();
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

  if (!tokens) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const hash = `at=${encodeURIComponent(tokens.at)}&rt=${encodeURIComponent(
    tokens.rt,
  )}${tokens.exp ? `&exp=${tokens.exp}` : ""}`;
  const src = `${MINI_APP_URL}/?embed=1&platform=web#${hash}`;

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
          ref={iframeRef}
          src={src}
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </View>
    </SafeAreaView>
  );
}
