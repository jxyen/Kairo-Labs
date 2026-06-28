import { createPublicClient } from '@/lib/catalog/client'
import type { Database } from '@/lib/supabase/database.types'

export type PaymentMethod = Database['public']['Enums']['payment_method']

export interface PaymentAccount {
  method: PaymentMethod
  handle: string
  displayName: string
  instructions: string | null
  qrUrl: string | null
  sortOrder: number
}

const BUCKET = 'payment-qr'

export async function getActivePaymentAccounts(): Promise<PaymentAccount[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('payment_accounts')
    .select('method, handle, display_name, instructions, qr_path, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    method: r.method,
    handle: r.handle,
    displayName: r.display_name,
    instructions: r.instructions,
    qrUrl: r.qr_path ? supabase.storage.from(BUCKET).getPublicUrl(r.qr_path).data.publicUrl : null,
    sortOrder: r.sort_order,
  }))
}

export async function getPaymentAccountForMethod(method: PaymentMethod): Promise<PaymentAccount | null> {
  const all = await getActivePaymentAccounts()
  return all.find((a) => a.method === method) ?? null
}
