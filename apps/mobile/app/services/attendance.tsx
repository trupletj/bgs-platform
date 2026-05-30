import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { supabase } from "@/lib/supabase";
import { S } from "@/constants/strings";

const MINI_APP_URL =
  process.env.EXPO_PUBLIC_BGS_ATTENDANCE_URL ??
  "https://bgs-attendance.vercel.app";

type BootTokens = { at: string; rt: string; exp?: number };

// `bgs-attendance` mini-app-ыг WebView хэлбэрээр ачаалж supabase session-ыг
// `window.__BGS_TOKENS__`-аар дамжуулна. Token refresh болоход postMessage-аар
// мини-апп руу шинэ токеноо илгээнэ.
export default function AttendanceScreen() {
  const router = useRouter();
  const webRef = useRef<WebView>(null);
  const [boot, setBoot] = useState<BootTokens | null>(null);
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
      const s = data.session;
      if (!s) {
        setLoadError("Session олдсонгүй. Дахин нэвтэрнэ үү.");
        return;
      }
      setBoot({
        at: s.access_token,
        rt: s.refresh_token,
        exp: s.expires_at,
      });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const webview = webRef.current;
      if (!webview || !session) return;
      const message = JSON.stringify({
        type: "bgs-attendance:refresh-tokens",
        tokens: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
      });
      // mini-app дотор window.addEventListener("message") нь postMessage
      // event-ийг хүлээж авдаг (web pattern). RN WebView нь iframe-тэй
      // ижил injectJavaScript-аар үндсэн pattern-аар дамжуулна.
      webview.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: ${message} })); true;`,
      );
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
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

  if (!boot) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const injected = `
    window.__BGS_TOKENS__ = ${JSON.stringify(boot)};
    true;
  `;

  const onMessage = (_e: WebViewMessageEvent) => {
    // Mini-app-аас ирсэн height postMessage-ыг mobile-д үл хэрэглэнэ
    // (WebView өөрөө scroll хийнэ). Future: logout / open-link тогтоох боломжтой.
  };

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
      <WebView
        ref={webRef}
        source={{ uri: `${MINI_APP_URL}/?embed=1&platform=mobile` }}
        injectedJavaScriptBeforeContentLoaded={injected}
        onMessage={onMessage}
        style={{ flex: 1, backgroundColor: "transparent" }}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
