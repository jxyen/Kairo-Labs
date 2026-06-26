import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type Staff = Database['public']['Tables']['staff']['Row']

export const getCurrentStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('*').eq('id', user.id).single()
  return data ?? null
})

export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff()
  if (!staff || !staff.active) redirect('/admin/login')
  return staff
}

export async function requireOwner(): Promise<Staff> {
  const staff = await requireStaff()
  if (staff.role !== 'owner') redirect('/admin')
  return staff
}
