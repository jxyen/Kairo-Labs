import 'server-only'
import crypto from 'node:crypto'

/**
 * Minimal Google Search Console "Search Analytics" client.
 *
 * Self-contained on purpose: it signs the service-account JWT with Node's
 * built-in crypto and exchanges it for an access token, so it needs NO npm
 * dependency (no google-auth-library / googleapis). That keeps package.json
 * untouched, which matters for this repo's clean-commit workflow.
 *
 * Server env vars (never NEXT_PUBLIC_ — they must stay off the client bundle):
 *   GSC_SA_EMAIL        service-account client_email
 *   GSC_SA_PRIVATE_KEY  service-account private_key (-----BEGIN PRIVATE KEY----- block;
 *                       literal "\n" sequences are converted to real newlines)
 *   GSC_SITE_URL        property id, e.g. "sc-domain:kairolabs.org"
 *
 * One-time setup: create a GCP service account, enable the Search Console API,
 * and add GSC_SA_EMAIL as a user on the kairolabs.org GSC property.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export type GscDimension = 'query' | 'page' | 'date' | 'country' | 'device'

export interface GscRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscTotals {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscQueryParams {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  dimensions?: GscDimension[]
  rowLimit?: number
  /** Exact-page filter (full URL). */
  page?: string
  /** Drop brand queries (anything containing "kairo") — non-brand SEO view. */
  excludeBrand?: boolean
  searchType?: 'web' | 'image' | 'video' | 'news' | 'discover'
}

// RE2 (GSC's regex engine), case-insensitive. Catches kairo / kairo labs /
// kairolabs and misspellings that start with the brand stem.
const BRAND_REGEX = '(?i)kairo'

export function gscConfigured(): boolean {
  return Boolean(
    process.env.GSC_SA_EMAIL && process.env.GSC_SA_PRIVATE_KEY && process.env.GSC_SITE_URL,
  )
}

function privateKey(): string {
  return (process.env.GSC_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
}

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url')
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GSC_SA_EMAIL
  const key = privateKey()
  if (!email || !key) throw new Error('GSC service account env vars are not set')

  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  )
  const unsigned = `${header}.${claim}`
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(key).toString('base64url')
  const assertion = `${unsigned}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(`GSC token exchange failed: ${data.error_description || data.error || res.status}`)
  }
  return data.access_token
}

export class GscError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'GscError'
  }
}

export async function gscQuery(
  params: GscQueryParams,
): Promise<{ rows: GscRow[]; totals: GscTotals }> {
  const site = process.env.GSC_SITE_URL
  if (!site) throw new GscError('GSC_SITE_URL is not set', 500)

  const filterList: { dimension: string; operator: string; expression: string }[] = []
  if (params.excludeBrand) {
    filterList.push({ dimension: 'query', operator: 'excludingRegex', expression: BRAND_REGEX })
  }
  if (params.page) {
    filterList.push({ dimension: 'page', operator: 'equals', expression: params.page })
  }
  const filters = filterList.length ? [{ groupType: 'and', filters: filterList }] : undefined

  const body = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions ?? [],
    rowLimit: Math.min(Math.max(params.rowLimit ?? 250, 1), 25000),
    type: params.searchType ?? 'web',
    // "final" = only finalized rows (matches the Search Console UI). GSC lags
    // ~2-3 days; "all" would tack on fresh, still-aggregating days whose numbers
    // ramp up over the next few days and read as a false cliff to zero.
    dataState: 'final',
    ...(filters ? { dimensionFilterGroups: filters } : {}),
  }

  const token = await getAccessToken()
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    site,
  )}/searchAnalytics/query`

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { rows?: GscRow[]; error?: { message?: string } }

  if (!res.ok) {
    const msg =
      res.status === 403
        ? `Service account isn't a user on ${site}. In Search Console → Settings → Users and permissions, add ${process.env.GSC_SA_EMAIL} (Full or Restricted).`
        : data.error?.message || 'Search Console API error'
    throw new GscError(msg, res.status)
  }

  const rows = data.rows ?? []
  const agg = rows.reduce(
    (a, r) => {
      a.clicks += r.clicks || 0
      a.impressions += r.impressions || 0
      a.posW += (r.position || 0) * (r.impressions || 0)
      return a
    },
    { clicks: 0, impressions: 0, posW: 0 },
  )
  const totals: GscTotals = {
    clicks: agg.clicks,
    impressions: agg.impressions,
    ctr: agg.impressions ? agg.clicks / agg.impressions : 0,
    position: agg.impressions ? agg.posW / agg.impressions : 0,
  }
  return { rows, totals }
}
