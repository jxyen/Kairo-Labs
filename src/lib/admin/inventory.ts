import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>
type RpcArgs = Database['public']['Functions']['apply_inventory_movement']['Args']

export type Reason = Database['public']['Enums']['inventory_reason']

export type InventoryRow = {
  sizeId: string
  sku: string
  mg: string
  price: number
  productName: string
  productCode: string
  quantityOnHand: number
  reorderThreshold: number
  updatedAt: string
  lowStock: boolean
}

export type Movement = {
  id: string
  delta: number
  reason: Reason
  note: string | null
  createdAt: string
}

// shape of the nested select below (supabase can't infer a non-literal/joined select cleanly)
type InventoryJoinRow = {
  size_id: string
  quantity_on_hand: number
  reorder_threshold: number
  updated_at: string
  product_sizes: {
    sku: string
    mg: string
    price: number
    products: { name: string; code: string }
  }
}

export async function listInventory(client: Client): Promise<InventoryRow[]> {
  const { data, error } = await client
    .from('inventory')
    .select(
      'size_id, quantity_on_hand, reorder_threshold, updated_at, product_sizes!inner(sku, mg, price, products!inner(name, code))',
    )
  if (error) throw error

  const rows: InventoryRow[] = ((data ?? []) as unknown as InventoryJoinRow[]).map((r) => ({
    sizeId: r.size_id,
    sku: r.product_sizes.sku,
    mg: r.product_sizes.mg,
    price: r.product_sizes.price,
    productName: r.product_sizes.products.name,
    productCode: r.product_sizes.products.code,
    quantityOnHand: r.quantity_on_hand,
    reorderThreshold: r.reorder_threshold,
    updatedAt: r.updated_at,
    lowStock: r.quantity_on_hand <= r.reorder_threshold,
  }))

  rows.sort((a, b) =>
    a.lowStock === b.lowStock ? a.sku.localeCompare(b.sku) : a.lowStock ? -1 : 1,
  )
  return rows
}

export async function listMovements(
  client: Client,
  sizeId: string,
  limit = 20,
): Promise<Movement[]> {
  const { data, error } = await client
    .from('inventory_movements')
    .select('id, delta, reason, note, created_at')
    .eq('size_id', sizeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((m) => ({
    id: m.id,
    delta: m.delta,
    reason: m.reason,
    note: m.note,
    createdAt: m.created_at,
  }))
}

export async function applyMovement(
  client: Client,
  args: { sizeId: string; delta: number; reason: Reason; note: string | null; createdBy: string | null },
): Promise<void> {
  // generated Args type marks every param non-null; the DB params are nullable, so cast through unknown
  const params = {
    p_size_id: args.sizeId,
    p_delta: args.delta,
    p_reason: args.reason,
    p_note: args.note,
    p_created_by: args.createdBy,
  } as unknown as RpcArgs
  const { error } = await client.rpc('apply_inventory_movement', params)
  if (error) throw new Error(error.message)
}

export async function restock(
  client: Client,
  args: { sizeId: string; qty: number; createdBy: string | null },
): Promise<void> {
  if (!Number.isInteger(args.qty) || args.qty <= 0) {
    throw new Error('Restock quantity must be a positive whole number.')
  }
  await applyMovement(client, {
    sizeId: args.sizeId,
    delta: args.qty,
    reason: 'restock',
    note: null,
    createdBy: args.createdBy,
  })
}

export async function adjust(
  client: Client,
  args: { sizeId: string; delta: number; note: string; createdBy: string | null },
): Promise<void> {
  if (!Number.isInteger(args.delta) || args.delta === 0) {
    throw new Error('Adjustment must be a non-zero whole number.')
  }
  if (!args.note.trim()) {
    throw new Error('Adjustment requires a note.')
  }
  await applyMovement(client, {
    sizeId: args.sizeId,
    delta: args.delta,
    reason: 'adjustment',
    note: args.note.trim(),
    createdBy: args.createdBy,
  })
}
