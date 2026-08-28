// Thin, safe wrappers over posthog-js for client components.
//
// Every call is a no-op unless PostHog was actually initialised in the
// browser (see src/instrumentation-client.ts) — so components can call these
// unconditionally: during SSR, in tests, on /admin (where we don't init), or
// when NEXT_PUBLIC_POSTHOG_KEY is unset, nothing happens and nothing throws.
import posthog from 'posthog-js'

export type EventProps = Record<string, unknown>

function ready(): boolean {
  return typeof window !== 'undefined' && posthog.__loaded === true
}

/** Capture a custom product event (e.g. `order_placed`). */
export function track(event: string, props?: EventProps): void {
  if (!ready()) return
  try {
    posthog.capture(event, props)
  } catch {
    // Analytics must never break the storefront.
  }
}

/** Tie the current anonymous session to a known person (we use the checkout email). */
export function identify(distinctId: string, props?: EventProps): void {
  const id = distinctId.trim()
  if (!id || !ready()) return
  try {
    posthog.identify(id, props)
  } catch {
    // Analytics must never break the storefront.
  }
}
