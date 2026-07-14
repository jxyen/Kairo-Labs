import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'

// Bust a Data Cache tag (default: "catalog") after a direct DB edit that
// bypasses the admin server actions — e.g. a seed/rename script. Guarded by
// the Supabase service-role key so only holders of that server secret can call it.
//   POST /api/admin/revalidate?tag=catalog
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
export const dynamic = 'force-dynamic'

function authorize(request: Request): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  const got = Buffer.from(request.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export async function POST(request: Request) {
  let ok: boolean
  try {
    ok = authorize(request)
  } catch {
    return Response.json({ error: 'server misconfigured' }, { status: 500 })
  }
  if (!ok) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const tag = new URL(request.url).searchParams.get('tag') ?? 'catalog'
  revalidateTag(tag, 'max')
  return Response.json({ ok: true, revalidated: tag })
}
