// Zod schemas for the orders server actions. Kept out of actions.ts because a
// 'use server' module may only export async functions.
import { z } from 'zod'

const orderStatus = z.enum(['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'])
const paymentMethod = z.enum(['venmo', 'cashapp', 'zelle', 'card', 'applepay', 'googlepay', 'crypto', 'other'])

export const markPaidSchema = z.object({
  orderId: z.guid(),
  method: paymentMethod,
  reference: z.string().trim().max(200).optional(),
})

export const setStatusSchema = z.object({
  orderId: z.guid(),
  to: orderStatus,
  trackingNumber: z.string().trim().max(100).optional(),
})

export const saveNotesSchema = z.object({
  orderId: z.guid(),
  notes: z.string().max(5000),
})

export type MarkPaidInput = z.input<typeof markPaidSchema>
export type SetStatusInput = z.input<typeof setStatusSchema>
export type SaveNotesInput = z.input<typeof saveNotesSchema>
