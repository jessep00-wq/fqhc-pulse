import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  /** Stripe price lookup key (also our internal product identifier). */
  lookupKey: string;
  name: string;
  priceCents: number;
  currency: string;
  kind: "product" | "bundle";
  slug: string;
  heroEmoji?: string | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (item: CartItem) => void;
  remove: (lookupKey: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (item) =>
        set((s) => {
          if (s.items.some((i) => i.lookupKey === item.lookupKey)) return { isOpen: true };
          return { items: [...s.items, item], isOpen: true };
        }),
      remove: (lookupKey) =>
        set((s) => ({ items: s.items.filter((i) => i.lookupKey !== lookupKey) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "measurewise_cart",
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export const cartSubtotalCents = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.priceCents, 0);
