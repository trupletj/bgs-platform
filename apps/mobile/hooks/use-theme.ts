import { useColorScheme } from "nativewind";
import { getTheme, type BgsTheme } from "@/lib/theme";

/** Идэвхтэй темийн өнгөнүүд (light/dark) — nativewind-ийн colorScheme дагана. */
export function useTheme(): BgsTheme {
  const { colorScheme } = useColorScheme();
  return getTheme(colorScheme === "dark");
}
