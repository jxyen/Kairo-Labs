"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  computeCartTotals,
  resolveCartLine,
  type CartLineInput,
  type CartTotals,
} from "@/lib/products";

const STORAGE_KEY = "kairo_cart_v1";

interface CartContextValue {
  /** Raw persisted lines — identity is (code, sizeMg). */
  items: CartLineInput[];
  /** Resolved totals (subtotal, discount, shipping, total, lines…). */
  totals: CartTotals;
  /** Total units incl. accessories — header badge. */
  count: number;
  /** Back-compat alias of `count`. */
  cart: number;
  /** Code of the most-recently-added line, for transient "✓ Added" feedback. */
  justAdded: string | null;
  /** Cart drawer open state. */
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  /**
   * Add to cart. `sizeMg` defaults to the product's first size (or null for
   * accessories — resolution normalizes it). Invalid codes are ignored.
   */
  add: (code: string, sizeMg?: string | null, qty?: number) => void;
  updateQty: (code: string, sizeMg: string | null, qty: number) => void;
  remove: (code: string, sizeMg: string | null) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (a: CartLineInput, code: string, sizeMg: string | null) =>
  a.code === code && a.sizeMg === sizeMg;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineInput[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage once on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* corrupt storage — start empty */
    }
    setHydrated(true);
  }, []);

  // Persist after hydration so we never clobber stored cart with the initial [].
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode / quota — non-fatal */
    }
  }, [items, hydrated]);

  const totals = useMemo(() => computeCartTotals(items), [items]);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const add = useCallback((code: string, sizeMg: string | null = null, qty = 1) => {
    // Normalize through the catalog: fills default size, validates the code,
    // collapses accessories to sizeMg=null. Unknown codes are dropped.
    const resolved = resolveCartLine({ code, sizeMg, qty });
    if (!resolved) return;

    setItems((prev) => {
      const i = prev.findIndex((l) => sameLine(l, resolved.code, resolved.sizeMg));
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + resolved.qty };
        return next;
      }
      return [...prev, { code: resolved.code, sizeMg: resolved.sizeMg, qty: resolved.qty }];
    });

    setJustAdded(code);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(null), 1300);
  }, []);

  const updateQty = useCallback((code: string, sizeMg: string | null, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((l) => !sameLine(l, code, sizeMg));
      return prev.map((l) => (sameLine(l, code, sizeMg) ? { ...l, qty: Math.min(99, qty) } : l));
    });
  }, []);

  const remove = useCallback((code: string, sizeMg: string | null) => {
    setItems((prev) => prev.filter((l) => !sameLine(l, code, sizeMg)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totals,
      count: totals.count,
      cart: totals.count,
      justAdded,
      open,
      openCart,
      closeCart,
      add,
      updateQty,
      remove,
      clear,
    }),
    [items, totals, justAdded, open, openCart, closeCart, add, updateQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
