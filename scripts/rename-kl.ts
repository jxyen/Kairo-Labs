import { config } from 'dotenv'
config({ path: '.env.local' })

// Node lacks native WebSocket for supabase-js realtime; polyfill before init.
import ws from 'ws'
;(globalThis as unknown as Record<string, unknown>).WebSocket = ws

import { createClient } from '@supabase/supabase-js'

// Rename two products to their KL codes (display name + label image).
// Keeps `code` (and therefore URL slug + cart keys) unchanged.
const RENAMES = [
  { code: 'Tirzepatide', name: 'KL-2 TZ', image: '/products/kl-2-tz.png' },
  { code: 'Retatrutide', name: 'KL-3 RT', image: '/products/kl-3-rt.png' },
]

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  for (const r of RENAMES) {
    const { data, error } = await admin
      .from('products')
      .update({ name: r.name, image: r.image })
      .eq('code', r.code)
      .select('code,name,image')
    if (error) {
      console.error(`✗ ${r.code}:`, error.message)
      process.exitCode = 1
    } else if (!data?.length) {
      console.warn(`? ${r.code}: no row matched (nothing updated)`)
    } else {
      console.log(`✓ ${r.code} → name="${data[0].name}" image="${data[0].image}"`)
    }
  }
}

main()
