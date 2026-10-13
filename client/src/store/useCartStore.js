import { create } from 'zustand';

// Mirrors the server cart. The server remains the source of truth, this store only caches it for the UI.
export const useCartStore = create((set) => ({
  cart: null,
  isOpen: false,
  setCart: (cart) => set({ cart }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
