import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  canTransition,
  statusesForFilter,
  type OrderFilterKey,
  type OrderStatus,
  type PaymentMethod,
} from './order-utils'

type Client = SupabaseClient<Database>
type Tables = Database['public']['Tables']

export type OrderRow = Tables['orders']['Row']
export type OrderItemRow = Tables['order_items']['Row']
export type PaymentRow = Tables['payments']['Row']
export type ShipmentRow = Tables['shipments']['Row']

/** Thrown when staff request a status move the workflow doesn't allow. */
export class TransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Can't move an order from ${from} to ${to}.`)
    this.name = 'TransitionError'
  }
}

/** Thrown when "mark paid" is attempted on an order that is already paid. */
export class AlreadyPaidError extends Error {
  constructor() {
    super('This order is already marked paid.')
    this.name = 'AlreadyPaidError'
  }
}

const LIST_COLUMNS =
  'id, order_number, created_at, customer_name, total, payment_method, payment_status, status, shipping_method, order_items(product_name, mg, quantity)'

export interface OrderListRow {
  id: string
  order_number: string
  created_at: string
  customer_name: string
  total: number
  payment_method: PaymentMethod
  payment_status: OrderRow['payment_status']
  status: OrderStatus
  shipping_method: string
  order_items: Array<Pick<OrderItemRow, 'product_name' | 'mg' | 'quantity'>>
}

/** All orders, newest first, narrowed by a list-page bucket. */
export async function listOrders(client: Client, filter: OrderFilterKey): Promise<OrderListRow[]> {
  let query = client.from('orders').select(LIST_COLUMNS).order('created_at', { ascending: false })
  const statuses = statusesForFilter(filter)
  if (statuses) query = query.in('status', statuses)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ ...r, total: Number(r.total) }))
}

export type OrderDetail = OrderRow & {
  order_items: OrderItemRow[]
  payments: PaymentRow[]
  shipments: ShipmentRow[]
}

/** One order with its line items, recorded payments and shipments (each oldest first). */
export async function getOrder(client: Client, id: string): Promise<OrderDetail | null> {
  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*), payments(*), shipments(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const byCreated = <T extends { created_at: string }>(a: T, b: T) => a.created_at.localeCompare(b.created_at)
  return {
    ...data,
    payments: [...data.payments].sort(byCreated),
    shipments: [...data.shipments].sort(byCreated),
  }
}

async function requireOrder(client: Client, id: string, columns: string) {
  const { data, error } = await client.from('orders').select(columns).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Order not found.')
  return data as unknown as Partial<OrderRow> & { id: string }
}

/**
 * Move an order along the staff workflow (see STATUS_TRANSITIONS). When the
 * order ships with a tracking number, record it as a `shipments` row so the
 * Shipping section and the customer-facing status can pick it up later.
 */
export async function transitionOrderStatus(
  client: Client,
  { id, to, trackingNumber }: { id: string; to: OrderStatus; trackingNumber?: string },
): Promise<void> {
  const current = await requireOrder(client, id, 'id, status')
  const from = current.status as OrderStatus
  if (!canTransition(from, to)) throw new TransitionError(from, to)

  const { error } = await client
    .from('orders')
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  const tracking = trackingNumber?.trim()
  if (to === 'shipped' && tracking) {
    const { error: sErr } = await client
      .from('shipments')
      .insert({ order_id: id, tracking_number: tracking, status: 'shipped' })
    if (sErr) throw new Error(sErr.message)
  }
}

/** Replace the internal notes; blank input clears the column. */
export async function setOrderNotes(client: Client, id: string, notes: string): Promise<void> {
  const trimmed = notes.trim()
  const { error } = await client
    .from('orders')
    .update({ notes: trimmed || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Mark an unpaid order paid by hand. Customers sometimes pay with a different
 * app than they picked at checkout, so staff say which method they actually
 * saw: we set `orders.payment_method` first, then let the `mark_order_paid`
 * RPC do the flip + `payments` insert (it copies the method and total from
 * the order). `rpcClient` must be able to execute the RPC — it is revoked
 * from `authenticated`, so the action passes the service-role client for that
 * one call and the RLS client for everything else.
 */
export async function markOrderPaid(
  client: Client,
  rpcClient: Client,
  { id, method, reference }: { id: string; method: PaymentMethod; reference?: string },
): Promise<string> {
  const current = await requireOrder(client, id, 'id, order_number, payment_status, payment_method')
  if (current.payment_status === 'paid') throw new AlreadyPaidError()

  if (current.payment_method !== method) {
    const { error } = await client.from('orders').update({ payment_method: method }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  const { data: orderNumber, error: rpcErr } = await rpcClient.rpc('mark_order_paid', { p_order_id: id })
  if (rpcErr) throw new Error(rpcErr.message)

  const ref = reference?.trim()
  if (ref) {
    // The RPC stamps the order number as the reference; replace it with what staff typed.
    const { error } = await client
      .from('payments')
      .update({ reference: ref })
      .eq('order_id', id)
      .eq('reference', current.order_number!)
    if (error) throw new Error(error.message)
  }
  return orderNumber
}
