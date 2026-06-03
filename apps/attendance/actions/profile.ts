"use server";

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import type { WorkerProfileLite } from "@/types/attendance";

interface UsersRow {
  first_name: string | null;
  last_name: string | null;
  position_name: string | null;
  department_name: string | null;
  heltes_name: string | null;
}

export const getCurrentWorkerProfile = cache(
  async (): Promise<WorkerProfileLite | null> => {
    const supabase = await createClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user?.phone) return null;

    const { data, error } = await supabase
      .from("users")
      .select(
        "first_name, last_name, position_name, department_name, heltes_name",
      )
      .eq("phone", user.phone)
      .maybeSingle<UsersRow>();

    if (error) {
      console.error("[attendance] profile fetch failed:", error.message);
      return null;
    }
    if (!data) return null;

    const fullName =
      `${data.last_name ?? ""} ${(data.first_name ?? "").toUpperCase()}`.trim();

    return {
      fullName: fullName || "Ажилтан",
      position: data.position_name ?? "—",
      department: data.department_name ?? "",
      shiftGroup: data.heltes_name ?? "",
    };
  },
);
