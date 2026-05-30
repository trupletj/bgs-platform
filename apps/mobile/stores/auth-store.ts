import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  checkBiometricSupport,
  getBiometricEnabled,
  setBiometricEnabled as storeBiometricEnabled,
  promptBiometric,
} from "@/lib/biometric";
import type { User, VerifyUserResponse } from "@/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phone: string;
  error: string | null;
  verifyLoading: boolean;
  otpLoading: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  isUnlocked: boolean;

  initialize: () => Promise<void>;
  verifyUser: (phone: string, register: string) => Promise<void>;
  sendOtp: (phone: string, register: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  fetchDbUser: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkBiometricAvailability: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setUnlocked: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  phone: "",
  error: null,
  verifyLoading: false,
  otpLoading: false,
  biometricAvailable: false,
  biometricEnabled: false,
  isUnlocked: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const phone = session.user.phone?.replace("+976", "") ?? "";
        set({ session, isAuthenticated: true, phone });
        await get().fetchDbUser(phone);
      }

      await get().checkBiometricAvailability();
      const enabled = await getBiometricEnabled();
      if (enabled && !get().biometricAvailable) {
        await storeBiometricEnabled(false);
        set({ biometricEnabled: false });
      } else {
        set({ biometricEnabled: enabled });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const phone = session.user.phone?.replace("+976", "") ?? "";
          set({ session, isAuthenticated: true, phone });
          await get().fetchDbUser(phone);
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            phone: "",
          });
        }
      });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyUser: async (phone: string, register: string) => {
    set({ verifyLoading: true, error: null });
    try {
      const { data, error: fnError } = await supabase.functions.invoke<VerifyUserResponse>(
        "verify-user",
        { body: { phone, register } }
      );

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ verifyLoading: false });
    }
  },

  sendOtp: async (phone: string, register: string) => {
    set({ verifyLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: { data: { register_number: register.toUpperCase().trim() } },
      });
      if (error) throw error;
      set({ phone });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ verifyLoading: false });
    }
  },

  verifyOtp: async (phone: string, token: string) => {
    set({ otpLoading: true, error: null });
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token,
        type: "sms",
      });
      if (error) throw error;
      // OTP is proof of identity — mark as unlocked so the biometric overlay doesn't appear.
      set({ isUnlocked: true });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ otpLoading: false });
    }
  },

  fetchDbUser: async (phone: string) => {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, bteg_id, first_name, last_name, email, phone, position_name, department_name, department_id, heltes_id, heltes_name"
      )
      .eq("phone", phone)
      .maybeSingle();

    if (error || !data) return;

    // Fetch is_working from users_with_stats view
    const { data: statsData } = await supabase
      .from("users_with_stats")
      .select("is_working")
      .eq("bteg_id", data.bteg_id)
      .maybeSingle();

    const user: User = {
      id: data.id,
      name: `${data.last_name ?? ""} ${(data.first_name ?? "").toUpperCase()}`.trim(),
      role: data.position_name ?? "",
      department: data.department_name ?? "",
      departmentId: data.department_id ?? "",
      heltesId: data.heltes_id ?? "",
      heltesName: data.heltes_name ?? "",
      employeeId: data.bteg_id,
      email: data.email ?? "",
      phone: data.phone ?? "",
      isWorking: statsData?.is_working ?? false,
    };

    set({ user });
  },

  logout: async () => {
    await supabase.auth.signOut();
    await storeBiometricEnabled(false);
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isUnlocked: false,
      biometricEnabled: false,
      phone: "",
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  checkBiometricAvailability: async () => {
    const { supported } = await checkBiometricSupport();
    set({ biometricAvailable: supported });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    if (enabled) {
      const result = await promptBiometric();
      if (!result.success) return;
    }
    await storeBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  setUnlocked: () => set({ isUnlocked: true }),
}));
