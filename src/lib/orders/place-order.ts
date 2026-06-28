'use server'
import { createPublicClient } from '@/lib/catalog/client'
import { placeOrderSchema, type PlaceOrderState } from './place-order-schema'

export async function placeOrder(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  let items: unknown
  try { items = JSON.parse(String(formData.get('items') ?? '[]')) } catch { items = [] }

  const parsed = placeOrderSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    address: {
      line1: formData.get('line1'),
      line2: formData.get('line2') || undefined,
      city: formData.get('city'),
      state: formData.get('state'),
      postal_code: formData.get('postal_code'),
      country: formData.get('country') || 'US',
    },
    method: formData.get('method'),
    items,
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data

  const supabase = createPublicClient()
  const { data, error } = await supabase.rpc('place_order', {
    p_items: v.items,
    p_customer: { name: v.name, email: v.email, phone: v.phone ?? null, address: v.address },
    p_payment_method: v.method,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { order_number: string }
  return { ok: true, orderNumber: result.order_number }
}
