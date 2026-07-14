'use server'
import { refresh } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUSES = ['new', 'reviewing', 'approved', 'rejected'] as const

const setStatusSchema = z.object({
  id: z.guid(),
  status: z.enum(STATUSES),
})

const setNotesSchema = z.object({
  id: z.guid(),
  notes: z.string().max(4000),
})

export async function setApplicationStatus(id: string, status: string) {
  await requireStaff()
  const parsed = setStatusSchema.safeParse({ id, status })
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('affiliate_applications')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
  if (error) return { ok: false as const, error: error.message }
  refresh()
  return { ok: true as const }
}

export async function setApplicationNotes(id: string, notes: string) {
  await requireStaff()
  const parsed = setNotesSchema.safeParse({ id, notes })
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('affiliate_applications')
    .update({ admin_notes: parsed.data.notes || null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
  if (error) return { ok: false as const, error: error.message }
  refresh()
  return { ok: true as const }
}
