import { describe, it, expect } from 'vitest'
import { addItem, setQty, removeItem, itemCount, orderTotals, itemFromProduct, type CartItem } from '../../src/lib/cart/cart'

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
  it('applies a 10% volume discount at qty 2 and recomputes merch/total', () => {
    const t = orderTotals([mk('a', 80, 2)]) // subtotal 160, disc 16, merch 144 -> under 150
    expect(t.subtotal).toBeCloseTo(160, 2)
    expect(t.discount).toBeCloseTo(16, 2)
    expect(t.merch).toBeCloseTo(144, 2)
    expect(t.shipping).toBeCloseTo(9.99, 2)
    expect(t.total).toBeCloseTo(153.99, 2)
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
