import { describe, it, expect } from 'vitest'
import {
  itemsSummary,
  canTransition,
  nextStatuses,
  STATUS_TRANSITIONS,
  ORDER_FILTERS,
  resolveFilter,
  statusesForFilter,
  formatMoney,
  formatAddress,
} from '@/app/admin/orders/order-utils'

const ALL_STATUSES = ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'] as const

describe('itemsSummary', () => {
  it('formats a single line as "qty× name mg"', () => {
    expect(itemsSummary([{ product_name: 'GHK-Cu', mg: '50 mg', quantity: 3 }])).toBe('3× GHK-Cu 50 mg')
  })
  it('joins multiple lines with a comma', () => {
    expect(itemsSummary([
      { product_name: 'GHK-Cu', mg: '50 mg', quantity: 3 },
      { product_name: 'BPC-157', mg: '5 mg', quantity: 1 },
    ])).toBe('3× GHK-Cu 50 mg, 1× BPC-157 5 mg')
  })
  it('omits the mg when the line has none', () => {
    expect(itemsSummary([{ product_name: 'Bacteriostatic Water', mg: null, quantity: 2 }])).toBe('2× Bacteriostatic Water')
  })
  it('returns an em dash for an order with no items', () => {
    expect(itemsSummary([])).toBe('—')
  })
})

describe('status transitions', () => {
  it('lets a pending order be cancelled but not skipped ahead', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true)
    expect(canTransition('pending', 'paid')).toBe(false) // mark paid goes through the RPC, not a status edit
    expect(canTransition('pending', 'shipped')).toBe(false)
  })
  it('moves paid → fulfilled → shipped → delivered', () => {
    expect(canTransition('paid', 'fulfilled')).toBe(true)
    expect(canTransition('fulfilled', 'shipped')).toBe(true)
    expect(canTransition('shipped', 'delivered')).toBe(true)
  })
  it('lets a paid order ship directly without a separate fulfilled step', () => {
    expect(canTransition('paid', 'shipped')).toBe(true)
  })
  it('never moves backwards', () => {
    expect(canTransition('shipped', 'paid')).toBe(false)
    expect(canTransition('delivered', 'shipped')).toBe(false)
    expect(canTransition('fulfilled', 'paid')).toBe(false)
  })
  it('allows cancelling from any live status', () => {
    for (const s of ['pending', 'paid', 'fulfilled', 'shipped', 'delivered'] as const) {
      expect(canTransition(s, 'cancelled')).toBe(true)
    }
  })
  it('treats cancelled and refunded as terminal', () => {
    expect(nextStatuses('cancelled')).toEqual([])
    expect(nextStatuses('refunded')).toEqual([])
    expect(canTransition('cancelled', 'cancelled')).toBe(false)
  })
  it('covers every order status in the table', () => {
    expect(Object.keys(STATUS_TRANSITIONS).sort()).toEqual([...ALL_STATUSES].sort())
  })
})

describe('list filters', () => {
  it('falls back to "all" for unknown or missing keys', () => {
    expect(resolveFilter(undefined)).toBe('all')
    expect(resolveFilter('bogus')).toBe('all')
    expect(resolveFilter('to_ship')).toBe('to_ship')
  })
  it('"all" applies no status constraint', () => {
    expect(statusesForFilter('all')).toBeNull()
  })
  it('maps the staff-facing buckets to order statuses', () => {
    expect(statusesForFilter('needs_payment')).toEqual(['pending'])
    expect(statusesForFilter('to_ship')).toEqual(['paid', 'fulfilled'])
    expect(statusesForFilter('shipped')).toEqual(['shipped', 'delivered'])
    expect(statusesForFilter('cancelled')).toEqual(['cancelled', 'refunded'])
  })
  it('partitions every status into exactly one bucket', () => {
    const seen = ORDER_FILTERS.filter((f) => f.key !== 'all').flatMap((f) => statusesForFilter(f.key) ?? [])
    expect([...seen].sort()).toEqual([...ALL_STATUSES].sort())
  })
})

describe('formatMoney', () => {
  it('renders two decimals with a dollar sign', () => {
    expect(formatMoney(111.08)).toBe('$111.08')
    expect(formatMoney(5)).toBe('$5.00')
  })
  it('accepts numeric strings from postgres and adds thousands separators', () => {
    expect(formatMoney('1234.5')).toBe('$1,234.50')
  })
})

describe('formatAddress', () => {
  it('renders the jsonb shipping address as postal lines', () => {
    expect(formatAddress({ line1: '12 Lab Way', line2: 'Suite 4', city: 'Austin', state: 'TX', postal_code: '78701', country: 'US' }))
      .toEqual(['12 Lab Way', 'Suite 4', 'Austin, TX 78701', 'US'])
  })
  it('skips missing optional parts', () => {
    expect(formatAddress({ line1: '12 Lab Way', city: 'Austin', state: 'TX', postal_code: '78701' }))
      .toEqual(['12 Lab Way', 'Austin, TX 78701'])
  })
  it('returns no lines for a missing or malformed address', () => {
    expect(formatAddress(null)).toEqual([])
    expect(formatAddress('not an object')).toEqual([])
  })
})
