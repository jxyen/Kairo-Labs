import { describe, it, expect } from 'vitest'
import { config } from '../../src/proxy'

describe('proxy config', () => {
  it('only runs on /admin routes', () => {
    expect(config.matcher).toContain('/admin/:path*')
  })
})
