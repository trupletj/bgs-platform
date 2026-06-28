import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

export type ThemeMode = "light" | "dark" | "system";

const KEY = "bgs_theme_mode";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  loadMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  setMode: (mode) => {
    set({ mode });
    colorScheme.set(mode);
    AsyncStorage.setItem(KEY, mode).catch(() => {});
  },
  loadMode: async () => {
    const v = await AsyncStorage.getItem(KEY);
    const mode: ThemeMode = v === "light" || v === "dark" || v === "system" ? v : "system";
    set({ mode });
    colorScheme.set(mode);
  },
}));
