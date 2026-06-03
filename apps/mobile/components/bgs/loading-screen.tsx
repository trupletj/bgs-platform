import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { BrandMark } from "@/components/brand/brand-mark";
import { getTheme } from "@/lib/theme";
import { useAuthStore } from "@/stores/auth-store";

interface LoadingScreenProps {
  /** Алдаа гарвал — мөнхийн spinner-ийн оронд мессеж + гарах товч. */
  error?: string;
}

export function LoadingScreen({ error }: LoadingScreenProps) {
  const t = getTheme(false);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: t.bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <BrandMark height={48} variant="orange" />

      {error ? (
        <>
          <Text
            style={{
              marginTop: 28,
              fontSize: 14,
              color: t.sub,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={logout}
            style={{
              marginTop: 20,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 14,
              backgroundColor: t.accent,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14.5, fontWeight: "700" }}>
              Дахин нэвтрэх
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator
            size="small"
            color={t.accent}
            style={{ marginTop: 28 }}
          />
          <Text style={{ marginTop: 14, fontSize: 13.5, color: t.sub, fontWeight: "500" }}>
            Бэлдэж байна...
          </Text>
        </>
      )}
    </View>
  );
}
