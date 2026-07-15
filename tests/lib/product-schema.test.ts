import { describe, it, expect } from 'vitest'
import { productSchema } from '../../src/app/admin/products/schema'

const base = {
  code: 'ACC-TEST',
  name: 'Alcohol Prep Pads',
  sizes: [{ mg: 'box of 100', price: 9.99, sku: 'SWABS' }],
}

describe('productSchema category', () => {
  it('accepts the Accessories category', () => {
    const r = productSchema.safeParse({ ...base, category: 'Accessories' })
    expect(r.success).toBe(true)
  })

  it('accepts an existing peptide category', () => {
    const r = productSchema.safeParse({ ...base, category: 'Recovery & Repair' })
    expect(r.success).toBe(true)
  })

  it('rejects an unknown category', () => {
    const r = productSchema.safeParse({ ...base, category: 'Nonsense' })
    expect(r.success).toBe(false)
  })
})
