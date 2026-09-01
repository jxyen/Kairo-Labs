import { describe, it, expect } from 'vitest'
import { addItem, setQty, removeItem, itemCount, orderTotals, itemFromProduct, shippingCost, type CartItem, type ShippingMethod } from '../../src/lib/cart/cart'

const mk = (sizeId: string, unitPrice: number, quantity = 1): CartItem =>
  ({ sizeId, productCode: 'P', productName: 'P', mg: '5 mg', unitPrice, quantity })

describe('cart', () => {
  it('merges quantity when the same size is added twice', () => {
    let items: CartItem[] = []
    items = addItem(items, mk('a', 50, 1))
    items = addItem(items, mk('a', 50, 2))
    expect(items).toHaveLength(1)
    expect(itemCount(items)).toBe(3)
  })
  it('setQty to 0 removes the line; removeItem drops it', () => {
    const items = addItem([], mk('a', 50, 2))
    expect(setQty(items, 'a', 0)).toHaveLength(0)
    expect(removeItem(items, 'a')).toHaveLength(0)
  })
  it('charges $9.99 shipping under $150 and free at/above', () => {
    expect(orderTotals([mk('a', 50, 1)]).shipping).toBeCloseTo(9.99, 2) // 50 < 150
    expect(orderTotals([mk('a', 160, 1)]).shipping).toBe(0)             // merch 160 >= 150 -> free (see report: brief's mk('a',80,2) merch=144 contradicts test 4)
  })
  it('gives no volume discount at qty 2 (the 2-unit tier was retired)', () => {
    const t = orderTotals([mk('a', 80, 2)])
    expect(t.subtotal).toBeCloseTo(160, 2)
    expect(t.discount).toBeCloseTo(0, 2)
    expect(t.merch).toBeCloseTo(160, 2)
    expect(t.shipping).toBe(0)              // merch 160 >= 150 -> free
    expect(t.total).toBeCloseTo(160, 2)
  })
  it('applies 5% at qty 3 and recomputes merch/total', () => {
    const t = orderTotals([mk('a', 50, 3)]) // subtotal 150, disc 7.50, merch 142.50 -> under 150
    expect(t.subtotal).toBeCloseTo(150, 2)
    expect(t.discount).toBeCloseTo(7.5, 2)
    expect(t.merch).toBeCloseTo(142.5, 2)
    expect(t.shipping).toBeCloseTo(9.99, 2)
    expect(t.total).toBeCloseTo(152.49, 2)
  })
  it('steps to 10% at qty 5 and 15% at qty 10', () => {
    expect(orderTotals([mk('a', 100, 5)]).discount).toBeCloseTo(50, 2)   // 10% of 500
    expect(orderTotals([mk('a', 100, 9)]).discount).toBeCloseTo(90, 2)   // still 10%
    expect(orderTotals([mk('a', 100, 10)]).discount).toBeCloseTo(150, 2) // 15% of 1000
  })
  it('excludes blends from the volume discount at every quantity', () => {
    const blend = (qty: number): CartItem => ({ ...mk('g', 87.99, qty), isBundle: true })
    for (const q of [3, 5, 10]) {
      const t = orderTotals([blend(q)])
      expect(t.discount).toBeCloseTo(0, 2)
      expect(t.subtotal).toBeCloseTo(87.99 * q, 2)  // still counts toward subtotal
    }
    // ...and toward free shipping
    expect(orderTotals([blend(3)]).shipping).toBe(0)
  })
  it('discounts peptide lines alongside an undiscounted blend line', () => {
    const t = orderTotals([mk('a', 50, 3), { ...mk('g', 87.99, 5), isBundle: true }])
    expect(t.subtotal).toBeCloseTo(589.95, 2)
    expect(t.discount).toBeCloseTo(7.5, 2)   // 5% of the 150 peptide line only
  })
  it('gives accessories the SAME volume tier as peptides', () => {
    // Deliberate: consumables ride the same ladder. `compareAt` (blends) is the only
    // exclusion -- do not reintroduce an isAccessory carve-out here without a decision.
    const syringes = (qty: number): CartItem => mk('SYRINGES', 19.99, qty)
    expect(orderTotals([syringes(2)]).discount).toBeCloseTo(0, 2)
    expect(orderTotals([syringes(3)]).discount).toBeCloseTo(3.0, 2)    // 5%  of 59.97
    expect(orderTotals([syringes(5)]).discount).toBeCloseTo(10.0, 2)   // 10% of 99.95
    expect(orderTotals([syringes(10)]).discount).toBeCloseTo(29.99, 2) // 15% of 199.90
  })
  it('an accessory and a peptide at the same qty get the same rate', () => {
    const a = orderTotals([mk('SYRINGES', 50, 5)]).discount
    const p = orderTotals([mk('BPC', 50, 5)]).discount
    expect(a).toBeCloseTo(p, 2)
    expect(a).toBeCloseTo(25, 2)
  })
  it('itemFromProduct leaves an accessory tier-eligible (isBundle false)', () => {
    const acc = {
      code: 'SYRINGES', name: 'Insulin Syringes', sub: '', category: 'Supplies', image: null,
      mechanism: '', tagline: '', purity: '', rating: 0, reviews: 0,
      bestseller: false, featured: false, blurb: '',
      sizes: [{ id: 'acc1', mg: 'box of 10', price: 19.99 }],
    } as unknown as import('../../src/lib/products').Product
    expect(itemFromProduct(acc, 0).isBundle).toBe(false)
  })
  it('itemFromProduct tags a blend via compareAt so the cart excludes it', () => {
    const base = {
      code: 'GLOW', name: 'GLOW Stack', sub: '', category: 'x', image: '/img/glow.png',
      mechanism: '', tagline: '', purity: '', rating: 0, reviews: 0,
      bestseller: false, featured: false, blurb: '',
      sizes: [{ id: 's9', mg: '70 mg', price: 87.99 }],
    }
    const blend = { ...base, compareAt: 114.99 } as unknown as import('../../src/lib/products').Product
    const plain = base as unknown as import('../../src/lib/products').Product
    expect(itemFromProduct(blend, 0).isBundle).toBe(true)
    expect(itemFromProduct(plain, 0).isBundle).toBe(false)
  })
  it('itemFromProduct snapshots the product image onto the line', () => {
    const product = {
      code: 'GLP3', name: 'GLP-3 (RT)', sub: '', category: 'x', image: '/img/glp3.png',
      mechanism: '', tagline: '', purity: '', rating: 0, reviews: 0,
      bestseller: false, featured: false, blurb: '',
      sizes: [{ id: 's1', mg: '10 mg', price: 69.99 }],
    } as unknown as import('../../src/lib/products').Product
    const line = itemFromProduct(product, 0)
    expect(line.image).toBe('/img/glp3.png')
    expect(line.sizeId).toBe('s1')
  })
})

describe('shippingCost', () => {
  it('standard: $9.99 under $150, free at/above', () => {
    expect(shippingCost('standard', 50)).toBeCloseTo(9.99, 2)
    expect(shippingCost('standard', 149.99)).toBeCloseTo(9.99, 2)
    expect(shippingCost('standard', 150)).toBe(0)
    expect(shippingCost('standard', 200)).toBe(0)
  })
  it('priority: $16.99 under $150, $11.99 at/above', () => {
    expect(shippingCost('priority', 50)).toBeCloseTo(16.99, 2)
    expect(shippingCost('priority', 149.99)).toBeCloseTo(16.99, 2)
    expect(shippingCost('priority', 150)).toBeCloseTo(11.99, 2)
    expect(shippingCost('priority', 300)).toBeCloseTo(11.99, 2)
  })
  it('empty cart is always free', () => {
    expect(shippingCost('standard', 0)).toBe(0)
    expect(shippingCost('priority', 0)).toBe(0)
  })
  it('orderTotals uses the selected method for shipping + total', () => {
    const items = [mk('a', 50, 1)] // merch 50
    expect(orderTotals(items, 'standard').shipping).toBeCloseTo(9.99, 2)
    expect(orderTotals(items, 'priority').shipping).toBeCloseTo(16.99, 2)
    expect(orderTotals(items, 'priority').total).toBeCloseTo(66.99, 2)
    expect(orderTotals(items).shipping).toBeCloseTo(9.99, 2) // defaults to standard
  })
})
