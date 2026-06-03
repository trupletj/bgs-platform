import { View, Text, Pressable } from "react-native";
import type { BgsTheme } from "@/lib/theme";

interface SectionHeadProps {
  t: BgsTheme;
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHead({ t, title, action, onAction }: SectionHeadProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        paddingHorizontal: 2,
        paddingBottom: 12,
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: "700", color: t.text, letterSpacing: -0.2 }}>
        {title}
      </Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.accent }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
