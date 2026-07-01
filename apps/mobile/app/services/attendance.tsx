import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, RefreshCw, X } from "lucide-react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { supabase } from "@/lib/supabase";
import { S } from "@/constants/strings";

const MINI_APP_URL =
  process.env.EXPO_PUBLIC_BGS_ATTENDANCE_URL ??
  "https://bgs-attendance.vercel.app";

type BootTokens = { at: string; rt: string; exp?: number };

export default function AttendanceScreen() {
  const router = useRouter();
  const webRef = useRef<WebView>(null);
  const [boot, setBoot] = useState<BootTokens | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

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
      webview.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: ${message} })); true;`,
      );
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleQRScanRequest() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    scannedRef.current = false;
    setShowCamera(true);
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setShowCamera(false);
    const payload = JSON.stringify({ type: "bgs:qr-scan-result", data });
    webRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} })); true;`,
    );
  }

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg?.type === "bgs:qr-scan-request") {
        void handleQRScanRequest();
      }
    } catch {}
  };

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center"
        >
          <ChevronLeft size={20} color="#6B7280" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-gray-900 dark:text-white">
          {S.attendanceDetail.title}
        </Text>
        <Pressable
          onPress={() => webRef.current?.reload()}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center"
        >
          <RefreshCw size={18} color="#6B7280" />
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          source={{ uri: `${MINI_APP_URL}/?embed=1&platform=mobile` }}
          injectedJavaScriptBeforeContentLoaded={injected}
          onMessage={onMessage}
          onLoadEnd={() => {
            if (isInitialLoad.current) {
              isInitialLoad.current = false;
              return;
            }
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          style={{ flex: 1, backgroundColor: "transparent" }}
          startInLoadingState
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator />
            </View>
          )}
          userAgent="BGSAttendanceMobile/1.0"
          pullToRefreshEnabled
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grant"
        />

        {showCamera && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.75)",
            }}
          >
            <View style={{ width: 280, height: 280, borderRadius: 16, overflow: "hidden" }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowCamera(false)}
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 24,
                padding: 12,
              }}
            >
              <X size={22} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
