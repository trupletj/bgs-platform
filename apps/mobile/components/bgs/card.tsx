import { View, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { BgsTheme } from "@/lib/theme";

interface BgsCardProps {
  t: BgsTheme;
  style?: ViewStyle;
  children: ReactNode;
}

export function BgsCard({ t, style, children }: BgsCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: t.dark ? 0.35 : 0.04,
          shadowRadius: 18,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
