import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Web SSR-д `window` байхгүй тул AsyncStorage-ийн web shim
// (localStorage руу хандахад) алдаа гаргадаг. Web дээр SSR-аас цаагуур
// localStorage-ыг шууд ашиглаж, server side үед no-op stub өгнө.
const webStorage = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === "web" ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
