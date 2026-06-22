"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface CartContextValue {
  cart: number;
  justAdded: string | null;
  add: (code: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const add = useCallback((code: string) => {
    setCart((c) => c + 1);
    setJustAdded(code);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(null), 1300);
  }, []);

  return (
    <CartContext.Provider value={{ cart, justAdded, add }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
