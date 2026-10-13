import { create } from 'zustand';

// Mirrors the server cart. The server remains the source of truth, this store only caches it for the UI.
// status: idle | loading | ready | error
export const useCartStore = create((set) => ({
  cart: null,
  status: 'idle',
  isOpen: false,
  setCart: (cart) => set({ cart, status: 'ready' }),
  setStatus: (status) => set({ status }),
  resetCart: () => set({ cart: null, status: 'idle' }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
