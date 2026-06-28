// Plain module (NOT 'use server'): zod schema + type for the Android push payload.
import { z } from 'zod'

export const pushPayloadSchema = z.object({
  app: z.string().min(1),       // Android package name, e.g. "com.venmo"
  title: z.string().default(''),
  text: z.string().default(''),
  postedAt: z.string().optional(), // ISO timestamp from the device
})

export type PushPayload = z.infer<typeof pushPayloadSchema>
