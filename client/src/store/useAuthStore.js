import { create } from 'zustand';

// Holds only the user profile. The auth token is an httpOnly cookie and is never stored in JS.
export const useAuthStore = create((set) => ({
  user: null,
  status: 'idle', // idle | loading | authenticated | guest
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'guest' }),
  setStatus: (status) => set({ status }),
  clearAuth: () => set({ user: null, status: 'guest' }),
}));
