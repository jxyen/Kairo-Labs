'use server'

import { requireStaff } from '@/lib/auth/dal'
import { gscConfigured, gscQuery, GscError, type GscRow, type GscTotals } from '@/lib/seo/gsc'

export interface SeoSnapshot {
  configured: boolean
  error?: string
  range: { startDate: string; endDate: string; days: number }
  totals: GscTotals
  byDate: { date: string; clicks: number; impressions: number }[]
  topQueries: GscRow[]
  topPages: GscRow[]
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/**
 * One call powers the whole dashboard: overview totals, a daily trend, and the
 * top queries + pages for the selected window. GSC finalizes data ~2-3 days
 * late, so the window ends 3 days ago to avoid a false tail-off.
 */
export async function loadSeoSnapshot(days = 28, excludeBrand = false): Promise<SeoSnapshot> {
  await requireStaff()

  const endDate = isoDaysAgo(3)
  const startDate = isoDaysAgo(3 + days)
  const range = { startDate, endDate, days }

  const empty: GscTotals = { clicks: 0, impressions: 0, ctr: 0, position: 0 }

  if (!gscConfigured()) {
    return {
      configured: false,
      range,
      totals: empty,
      byDate: [],
      topQueries: [],
      topPages: [],
    }
  }

  try {
    const [overview, byDate, queries, pages] = await Promise.all([
      gscQuery({ startDate, endDate, dimensions: [], excludeBrand }),
      gscQuery({ startDate, endDate, dimensions: ['date'], rowLimit: 500, excludeBrand }),
      gscQuery({ startDate, endDate, dimensions: ['query'], rowLimit: 100, excludeBrand }),
      gscQuery({ startDate, endDate, dimensions: ['page'], rowLimit: 100, excludeBrand }),
    ])

    return {
      configured: true,
      range,
      totals: overview.totals,
      byDate: byDate.rows
        .map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topQueries: queries.rows.sort((a, b) => b.impressions - a.impressions),
      topPages: pages.rows.sort((a, b) => b.impressions - a.impressions),
    }
  } catch (e) {
    const msg = e instanceof GscError ? e.message : e instanceof Error ? e.message : String(e)
    return { configured: true, error: msg, range, totals: empty, byDate: [], topQueries: [], topPages: [] }
  }
}
