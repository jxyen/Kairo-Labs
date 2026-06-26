import { describe, it, expect } from 'vitest'
import { productSlug } from '../../src/lib/products'

describe('productSlug', () => {
  it('derives a url-safe slug from code', () => {
    expect(productSlug({ code: 'BPC-157' } as never)).toBe('bpc-157')
    expect(productSlug({ code: 'New Product' } as never)).toBe('new-product')
  })
})
