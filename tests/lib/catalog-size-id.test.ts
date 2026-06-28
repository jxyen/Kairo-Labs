import { vi } from 'vitest'
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { FREE_SHIP_THRESHOLD } from '../../src/lib/products'
import { getCatalog } from '../../src/lib/catalog/queries'

describe('catalog pricing prep', () => {
  beforeAll(() => { execSync('npm run db:seed', { stdio: 'inherit' }) })

  it('uses a $150 free-ship threshold', () => {
    expect(FREE_SHIP_THRESHOLD).toBe(150)
  })

  it('every live catalog size carries its product_sizes id', async () => {
    const products = await getCatalog()
    const sizes = products.flatMap((p) => p.sizes)
    expect(sizes.length).toBeGreaterThan(0)
    expect(sizes.every((s) => typeof s.id === 'string' && s.id.length > 0)).toBe(true)
  })
})
