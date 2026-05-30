import { create } from "zustand";
import type { AttendanceWeek } from "@/types";

interface AttendanceState {
  currentWeek: AttendanceWeek | null;
  setWeekData: (data: AttendanceWeek) => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  currentWeek: null,
  setWeekData: (data) => set({ currentWeek: data }),
}));
