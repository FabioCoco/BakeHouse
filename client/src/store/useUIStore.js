import { create } from 'zustand';

// Global UI state that does not belong to a single page.
export const useUIStore = create((set) => ({
  isMobileNavOpen: false,
  setMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
}));
