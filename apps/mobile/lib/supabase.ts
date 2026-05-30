import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ljlywyhpxsutvrdeyyla.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqbHl3eWhweHN1dHZyZGV5eWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Mjg2ODgsImV4cCI6MjA3MzUwNDY4OH0.TSutzsEy-_-aihRE50NYYHcdwVyqtJ8ZZIyAujqcXLI";

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
