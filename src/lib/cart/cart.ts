import { FREE_SHIP_THRESHOLD, volumeDiscount, type Product } from '@/lib/products'

export interface CartItem {
  sizeId: string
  productCode: string
  productName: string
  mg: string
  unitPrice: number
  quantity: number
  image?: string | null
}

const round2 = (n: number) => Math.round(n * 100) / 100
export const clampQty = (q: number) => Math.max(1, Math.min(99, Math.floor(q)))

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const i = items.findIndex((x) => x.sizeId === item.sizeId)
  if (i === -1) return [...items, { ...item, quantity: clampQty(item.quantity) }]
  const next = [...items]
  next[i] = { ...next[i], quantity: clampQty(next[i].quantity + item.quantity) }
  return next
}
export function setQty(items: CartItem[], sizeId: string, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, sizeId)
  return items.map((x) => (x.sizeId === sizeId ? { ...x, quantity: clampQty(qty) } : x))
}
export function removeItem(items: CartItem[], sizeId: string): CartItem[] {
  return items.filter((x) => x.sizeId !== sizeId)
}
export const itemCount = (items: CartItem[]) => items.reduce((n, x) => n + x.quantity, 0)
export const lineTotal = (x: CartItem) => round2(x.unitPrice * x.quantity)

export function orderTotals(items: CartItem[]) {
  const subtotal = round2(items.reduce((s, x) => s + x.unitPrice * x.quantity, 0))
  const discount = round2(items.reduce((s, x) => s + round2(round2(x.unitPrice * x.quantity) * volumeDiscount(x.quantity)), 0))
  const merch = round2(subtotal - discount)
  const shipping = merch > 0 && merch < FREE_SHIP_THRESHOLD ? 9.99 : 0
  return { subtotal, discount, merch, shipping, total: round2(merch + shipping) }
}

export function itemFromProduct(p: Product, sizeIdx: number, quantity = 1): CartItem {
  const s = p.sizes[sizeIdx]
  if (!s?.id) throw new Error(`size ${sizeIdx} of ${p.code} has no id`)
  return { sizeId: s.id, productCode: p.code, productName: p.name, mg: s.mg, unitPrice: s.price, quantity, image: p.image }
}
