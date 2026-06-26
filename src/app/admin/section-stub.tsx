import { createClient } from '@/lib/supabase/server'
import type { TableName } from '@/lib/admin/sections'

export async function SectionStub({
  title,
  table,
  description,
}: {
  title: string
  table: TableName
  description: string
}) {
  const supabase = await createClient()
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

  return (
    <section>
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <span className="text-sm text-black/50">{count ?? 0} rows in <code>{table}</code></span>
      </header>
      <div className="rounded-lg border border-dashed border-black/20 bg-neutral-50 p-8 text-sm text-black/60">
        <p className="mb-2 font-medium text-black/80">This section is a foundation stub.</p>
        <p>{description}</p>
        <p className="mt-3">A feature terminal owns the build-out — see <code>docs/admin-features/</code>.</p>
      </div>
    </section>
  )
}
