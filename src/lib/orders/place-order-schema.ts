import { z } from 'zod'

// Plain (non-'use server') module: a "use server" file may only export async
// functions, so the schema + types live here and are imported by both the
// server action (place-order.ts) and the client checkout form.
export const placeOrderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Enter a valid email'),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(1, 'ZIP is required'),
    country: z.string().min(1).default('US'),
  }),
  method: z.enum(['venmo', 'cashapp', 'zelle']),
  items: z.array(z.object({
    size_id: z.guid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1, 'Your cart is empty'),
})

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
export type PlaceOrderState = { ok: true; orderNumber: string } | { ok: false; error: string }
