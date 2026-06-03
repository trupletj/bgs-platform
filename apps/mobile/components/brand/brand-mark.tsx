import { View, Text } from "react-native";
import { OrbitMark, ORBIT_COLORS, type OrbitVariant } from "./orbit-mark";

/**
 * BGS lockup — Orbit mark + "BGS" wordmark (Space Grotesk 700).
 * Legacy `variant` ("orange" | "white" | "black")-ийг brand orbit variant руу буулгана.
 *   orange → primary (гэрэл дэвсгэрт), white → accent (улбар шар дэвсгэрт), black → mono.
 */
interface BrandMarkProps {
  height?: number;
  variant?: "orange" | "white" | "black";
  /** Зангилааны gap өнгийг дэвсгэртэй тааруулах. */
  background?: string;
  /** Зөвхөн тэмдэг (wordmark-гүй). */
  markOnly?: boolean;
}

const MAP: Record<
  NonNullable<BrandMarkProps["variant"]>,
  { orbit: OrbitVariant; word: string }
> = {
  orange: { orbit: "primary", word: ORBIT_COLORS.ink },
  white: { orbit: "accent", word: "#FFFFFF" },
  black: { orbit: "mono", word: ORBIT_COLORS.ink },
};

export function BrandMark({
  height = 26,
  variant = "orange",
  background,
  markOnly = false,
}: BrandMarkProps) {
  const m = MAP[variant];

  if (markOnly) {
    return <OrbitMark size={height} variant={m.orbit} background={background} />;
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: height * 0.34 }}>
      <OrbitMark size={height} variant={m.orbit} background={background} />
      <Text
        style={{
          fontFamily: "SpaceGrotesk_700Bold",
          fontSize: height * 0.96,
          lineHeight: height * 1.04,
          letterSpacing: -height * 0.03,
          color: m.word,
        }}
      >
        BGS
      </Text>
    </View>
  );
}
