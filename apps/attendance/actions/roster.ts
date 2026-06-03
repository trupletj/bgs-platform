"use server";

import { cache } from "react";
import { createClientForSchema } from "@/utils/supabase/server";
import type { RosterStatusOverview } from "@/types/attendance";

export const getMyRosterOverview = cache(
  async (): Promise<RosterStatusOverview | null> => {
    const supabase = await createClientForSchema("bgs_attendance");
    const { data, error } = await supabase.rpc("get_my_roster_overview");
    if (error) {
      console.error(
        "[attendance] get_my_roster_overview failed:",
        error.code ?? "",
        error.message,
      );
      return null;
    }
    if (!data) return null;
    return data as RosterStatusOverview;
  },
);
