import { Platform } from "react-native";
import { SymbolView, type SymbolViewProps, type SymbolWeight } from "expo-symbols";
import type { LucideIcon } from "lucide-react-native";

/**
 * Платформын native icon: iOS дээр SF Symbol (expo-symbols), Android/web дээр
 * lucide. Material нэрийг гараар бүртгэх шаардлагагүй — lucide-г шууд дамжуулна.
 */
export function NativeIcon({
  sf,
  lucide: Lucide,
  size = 24,
  color,
  weight = "regular",
  strokeWidth = 2,
}: {
  sf: SymbolViewProps["name"];
  lucide: LucideIcon;
  size?: number;
  color: string;
  weight?: SymbolWeight;
  strokeWidth?: number;
}) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={sf}
        tintColor={color}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Lucide size={size} color={color} strokeWidth={strokeWidth} />;
}
