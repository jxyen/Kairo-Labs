import { createPublicClient } from '@/lib/catalog/client'
import type { Database } from '@/lib/supabase/database.types'

export interface OrderPayment {
  orderNumber: string
  total: number
  paymentMethod: Database['public']['Enums']['payment_method']
  status: Database['public']['Enums']['order_status']
  paymentStatus: Database['public']['Enums']['payment_status']
  createdAt: string
}

export async function getOrderForPayment(orderNumber: string): Promise<OrderPayment | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase.rpc('get_order_for_payment', { p_order_number: orderNumber })
  if (error) throw error
  const row = (data ?? [])[0]
  if (!row) return null
  return {
    orderNumber: row.order_number,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  }
}
