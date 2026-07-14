/**
 * Researcher-verification acknowledgment cookie.
 *
 * Deliberately not HttpOnly: the client component writes it on accept, and the
 * storefront layout reads it on the server to decide whether to mount the gate.
 */
export const GATE_COOKIE = 'kairo_verified'
export const GATE_COOKIE_VALUE = '1'
export const GATE_MAX_AGE_SECONDS = 31536000 // 1 year

export function hasVerified(cookieValue: string | undefined): boolean {
  return cookieValue === GATE_COOKIE_VALUE
}

export function gateCookieString(): string {
  return `${GATE_COOKIE}=${GATE_COOKIE_VALUE}; Max-Age=${GATE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}
