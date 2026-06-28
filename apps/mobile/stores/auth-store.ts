import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";
import {
  checkBiometricSupport,
  getBiometricEnabled,
  setBiometricEnabled as storeBiometricEnabled,
  promptBiometric,
} from "@/lib/biometric";
import type { User } from "@/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  isUnlocked: boolean;

  initialize: () => Promise<void>;
  requestOtp: (phone: string, register: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  applyTokens: (tokens: {
    access_token: string;
    refresh_token: string;
  }) => Promise<void>;
  fetchDbUser: (phone: string, userId?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUserAvatar: (url: string) => void;
  checkBiometricAvailability: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setUnlocked: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  biometricAvailable: false,
  biometricEnabled: false,
  isUnlocked: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        set({ session, isAuthenticated: true });
        await get().fetchDbUser(session.user.phone ?? "", session.user.id);
      }

      await get().checkBiometricAvailability();
      const enabled = await getBiometricEnabled();
      if (enabled && !get().biometricAvailable) {
        await storeBiometricEnabled(false);
        set({ biometricEnabled: false });
      } else {
        set({ biometricEnabled: enabled });
      }

      // ВАЖНО: onAuthStateChange callback дотор Supabase дуудлагыг `await` хийж
      // БОЛОХГҮЙ — callback нь GoTrue-ийн navigator LockManager lock-ийг барьж
      // ажилладаг тул дотор нь setSession/getSession/query дуудвал deadlock болж,
      // setSession мөнхөд шийдэгдэхгүй (web дээр). Иймд async ажлыг setTimeout-оор
      // lock-аас гадуур хойшлуулна.
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({ session, isAuthenticated: true });
          setTimeout(() => {
            void get().fetchDbUser(session.user.phone ?? "", session.user.id);
          }, 0);
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
          });
        }
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Алхам 1: HR баталгаажуулалт (verify-user) → SMS OTP илгээх
  requestOtp: async (phone, register) => {
    set({ error: null });
    const normPhone = normalizePhone(phone);
    const reg = register.trim().toUpperCase();

    const { data: vData, error: vErr } = await supabase.functions.invoke("verify-user", {
      body: { phone: normPhone, register: reg },
    });
    if (vErr || (vData as any)?.error) {
      throw new Error(
        (vData as any)?.error ||
          "Бүртгэлтэй хэрэглэгч олдсонгүй эсвэл регистр буруу байна."
      );
    }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      phone: normPhone,
      options: { shouldCreateUser: true, data: { register_number: reg } },
    });
    if (otpErr) throw new Error(otpErr.message);
  },

  // Алхам 2: OTP баталгаажуулах → session
  verifyOtp: async (phone, token) => {
    set({ error: null });
    const normPhone = normalizePhone(phone);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normPhone,
      token,
      type: "sms",
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Session not returned");

    set({ session: data.session, isAuthenticated: true, isUnlocked: true });
    await get().fetchDbUser(data.session.user.phone ?? normPhone, data.session.user.id);
  },

  applyTokens: async (tokens) => {
    set({ error: null });
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      if (error) throw error;
      if (!data.session) throw new Error("Session not returned");

      set({ session: data.session, isAuthenticated: true, isUnlocked: true });
      await get().fetchDbUser(
        data.session.user.phone ?? "",
        data.session.user.id
      );
    } catch (e: any) {
      console.error("[auth] applyTokens failed:", e?.message ?? e);
      set({ error: e.message });
      throw e;
    }
  },

  fetchDbUser: async (phone: string, userId?: string) => {
    const COLS =
      "id, bteg_id, idcard_number, register_number, sf_guard_group_id, avatar_url, first_name, last_name, email, phone, position_name, department_name, department_id, heltes_id, heltes_name";

    const normPhone = normalizePhone(phone);

    // 1) auth_user_id-аар хайх — хамгийн найдвартай (формат/утаснаас хамаарахгүй).
    let data: Record<string, any> | null = null;
    let lastError: unknown = null;
    if (userId) {
      const r = await supabase
        .from("users")
        .select(COLS)
        .eq("auth_user_id", userId)
        .limit(1);
      if (r.error) lastError = r.error;
      else data = r.data?.[0] ?? null;
    }

    // 2) Олдоогүй бол утсаар fallback (auth_user_id алдаа өгсөн ч ажиллана).
    if (!data && normPhone) {
      const r = await supabase.from("users").select(COLS).eq("phone", normPhone).limit(1);
      if (r.error) lastError = r.error;
      else data = r.data?.[0] ?? null;
    }

    if (!data) {
      if (lastError) {
        // Query алдаа (network/permission) — signout хийхгүй, дахин оролдох боломжтой.
        console.error("[auth] fetchDbUser query error:", lastError);
        set({
          error: "Хэрэглэгчийн мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.",
        });
        return;
      }
      // Query амжилттай ч мөр олдсонгүй → бодитоор бүртгэлгүй → force logout.
      console.warn(
        "[auth] no user row — userId:",
        userId,
        "phone:",
        normPhone || "(empty)",
        "→ signing out"
      );
      await supabase.auth.signOut();
      await storeBiometricEnabled(false);
      set({
        session: null,
        user: null,
        isAuthenticated: false,
        isUnlocked: false,
        biometricEnabled: false,
        error:
          "Системд бүртгэлтэй ажилтны мэдээлэл олдсонгүй. Админтай холбогдоно уу.",
      });
      return;
    }

    const { data: statsData } = await supabase
      .from("users_with_stats")
      .select("is_working")
      .eq("bteg_id", data.bteg_id)
      .maybeSingle();

    // Ээлжийн (eelj) группын нэр — sf_guard_group_id-аар
    let shiftName = "";
    if (data.sf_guard_group_id) {
      const { data: grp } = await supabase
        .from("eelj_groups")
        .select("name")
        .eq("bteg_id", data.sf_guard_group_id)
        .maybeSingle();
      shiftName = (grp?.name ?? "").trim();
    }

    const user: User = {
      id: data.id,
      name: `${data.last_name ?? ""} ${(data.first_name ?? "").toUpperCase()}`.trim(),
      role: data.position_name ?? "",
      department: data.department_name ?? "",
      departmentId: data.department_id ?? "",
      heltesId: data.heltes_id ?? "",
      heltesName: data.heltes_name ?? "",
      employeeId: data.bteg_id,
      idCardNumber: data.idcard_number ?? "",
      attendanceNumber: (data.register_number ?? "").replace(/\D/g, ""),
      shiftName,
      avatarUrl: data.avatar_url ?? undefined,
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
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  setUserAvatar: (url) => {
    const u = get().user;
    if (u) set({ user: { ...u, avatarUrl: url } });
  },

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
