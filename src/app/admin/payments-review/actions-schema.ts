import { z } from 'zod'

export const applyEventSchema = z.object({
  eventId: z.guid(),
  orderNumber: z.string().regex(/^KL-\d{8}-[A-Z0-9]{4}$/, 'Enter a valid order code'),
})

export const dismissEventSchema = z.object({ eventId: z.guid() })
