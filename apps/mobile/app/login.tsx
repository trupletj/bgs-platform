import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { X } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { parseTokensFromMessage } from "@/lib/bridge";
import { BrandMark } from "@/components/brand/brand-mark";
import { getTheme } from "@/lib/theme";

const BGS_AUTH_URL =
  process.env.EXPO_PUBLIC_BGS_AUTH_URL ?? "https://bgs-mn.vercel.app";

const EMBED_URL = `${BGS_AUTH_URL}/?embed=1`;

export default function LoginScreen() {
  const applyTokens = useAuthStore((s) => s.applyTokens);
  const error = useAuthStore((s) => s.error);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = getTheme(false);

  const handleTokens = async (tokens: {
    access_token: string;
    refresh_token: string;
  }) => {
    try {
      await applyTokens(tokens);
      setDrawerOpen(false);
    } catch {
      // error displayed in banner from store
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <BrandMark height={48} variant="orange" />
          <Text
            style={{
              marginTop: 20,
              fontSize: 22,
              fontWeight: "700",
              color: t.text,
              letterSpacing: -0.3,
              textAlign: "center",
            }}
          >
            Тавтай морил
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: t.sub,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            BGS ажилтны нэгдсэн платформ
          </Text>
        </View>

        {error ? (
          <Text
            style={{
              color: "#B91C1C",
              fontSize: 13,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => setDrawerOpen(true)}
          style={({ pressed }) => ({
            width: "100%",
            maxWidth: 360,
            backgroundColor: t.accent,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "700",
              letterSpacing: -0.2,
            }}
          >
            BGS Нэвтрэх
          </Text>
        </Pressable>
      </View>

      <LoginDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTokens={handleTokens}
        theme={t}
      />
    </SafeAreaView>
  );
}

function LoginDrawer({
  visible,
  onClose,
  onTokens,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onTokens: (t: { access_token: string; refresh_token: string }) => Promise<void>;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityLabel="Хаах"
        />
        <View
          style={{
            height: "90%",
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.border,
                }}
              />
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{ position: "absolute", right: 12, top: 10, padding: 6 }}
            >
              <X size={20} color={theme.sub} />
            </Pressable>
          </View>

          {visible ? <EmbedFrame onTokens={onTokens} /> : null}
        </View>
      </View>
    </Modal>
  );
}

function EmbedFrame({
  onTokens,
}: {
  onTokens: (t: { access_token: string; refresh_token: string }) => Promise<void>;
}) {
  if (Platform.OS === "web") {
    return <WebEmbed onTokens={onTokens} />;
  }
  return <NativeEmbed onTokens={onTokens} />;
}

function WebEmbed({
  onTokens,
}: {
  onTokens: (t: { access_token: string; refresh_token: string }) => Promise<void>;
}) {
  useEffect(() => {
    const allowedOrigin = new URL(BGS_AUTH_URL).origin;
    const handler = (event: MessageEvent) => {
      if (event.origin !== allowedOrigin) return;
      const tokens = parseTokensFromMessage(event.data);
      if (!tokens) return;
      void onTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onTokens]);

  return (
    <iframe
      src={EMBED_URL}
      style={{ width: "100%", height: "100%", border: 0, flex: 1 }}
      title="BGS Login"
    />
  );
}

function NativeEmbed({
  onTokens,
}: {
  onTokens: (t: { access_token: string; refresh_token: string }) => Promise<void>;
}) {
  const webRef = useRef<WebView>(null);

  const onMessage = (e: WebViewMessageEvent) => {
    const tokens = parseTokensFromMessage(e.nativeEvent.data);
    if (!tokens) return;
    void onTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  };

  return (
    <WebView
      ref={webRef}
      source={{ uri: EMBED_URL }}
      onMessage={onMessage}
      style={{ flex: 1, backgroundColor: "transparent" }}
      startInLoadingState
      renderLoading={() => (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      )}
    />
  );
}
