/**
 * Researcher-verification acknowledgment cookie.
 *
 * Deliberately not HttpOnly: the ResearcherGate client component both writes it
 * on accept and reads it on mount to decide whether to show itself. That gate
 * decision lives entirely on the client so the storefront layout never has to
 * read cookies() — which is what keeps every storefront page CDN-cacheable
 * (ISR) instead of force-dynamic, the single biggest crawl-budget win for SEO.
 */
export const GATE_COOKIE = 'kairo_verified'
export const GATE_COOKIE_VALUE = '1'
export const GATE_MAX_AGE_SECONDS = 31536000 // 1 year

export function hasVerified(cookieValue: string | undefined): boolean {
  return cookieValue === GATE_COOKIE_VALUE
}

/** Client-only: read the verification cookie from document.cookie. */
export function readVerifiedCookie(): boolean {
  if (typeof document === 'undefined') return false
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${GATE_COOKIE}=([^;]*)`))
  return hasVerified(m?.[1])
}

export function gateCookieString(): string {
  return `${GATE_COOKIE}=${GATE_COOKIE_VALUE}; Max-Age=${GATE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}
