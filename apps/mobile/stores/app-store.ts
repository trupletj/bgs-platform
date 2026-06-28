import { create } from "zustand";

interface AppState {
  homeTab: number;
  servicesTab: number;
  profileTab: number;
  leaveTab: number;
  setHomeTab: (tab: number) => void;
  setServicesTab: (tab: number) => void;
  setProfileTab: (tab: number) => void;
  setLeaveTab: (tab: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  homeTab: 0,
  servicesTab: 0,
  profileTab: 0,
  leaveTab: 0,
  setHomeTab: (tab) => set({ homeTab: tab }),
  setServicesTab: (tab) => set({ servicesTab: tab }),
  setProfileTab: (tab) => set({ profileTab: tab }),
  setLeaveTab: (tab) => set({ leaveTab: tab }),
}));
