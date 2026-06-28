import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/hooks/use-theme";

interface ScreenHeaderProps {
  title: string;
  /** Баруун талын үйлдэл (товч г.м.) */
  right?: ReactNode;
  /** Буцах товчны үйлдэл (default: router.back) */
  onBack?: () => void;
}

/** Дэлгэцийн нийтлэг толгой — буцах товч + гарчиг + баруун slot */
export function ScreenHeader({ title, right, onBack }: ScreenHeaderProps) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={6}
        style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
      >
        <ChevronLeft size={26} color={t.text} strokeWidth={2} />
      </Pressable>
      <Text
        style={{ flex: 1, fontSize: 19, fontWeight: "800", color: t.text, letterSpacing: -0.3 }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
