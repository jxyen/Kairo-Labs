import { describe, it, expect } from 'vitest'
import { createAdminClient } from '../../src/lib/supabase/admin'

describe('admin client', () => {
  it('connects with the service role and reads staff', async () => {
    const admin = createAdminClient()
    const { error } = await admin.from('staff').select('id').limit(1)
    expect(error).toBeNull()
  })
})
