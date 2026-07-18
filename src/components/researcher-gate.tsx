'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { gateCookieString } from '@/lib/gate'
import { Logo } from '@/components/logo'

// Routes left ungated: educational, Research-Use-Only content that pulls cold
// organic search traffic. A hard modal on these pages tanks dwell time and
// blocks the SEO/conversion job they exist to do (Googlebot can't attest age
// either). The gate still guards the commercial surface — catalog, product,
// cart, checkout — where an add-to-cart intent actually forms.
const UNGATED_PREFIXES = ['/research', '/tools']

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

export function ResearcherGate() {
  const [age, setAge] = useState(false)
  const [researcher, setResearcher] = useState(false)
  const [exited, setExited] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const trapRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const ungated = UNGATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  // Lock body scroll while the gate is up; restore it when it goes away.
  // `ungated` pages never render the gate, so they must never lock scroll.
  useEffect(() => {
    if (dismissed || ungated) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [dismissed, ungated])

  // Move focus into the gate and keep it there while the gate is up.
  useEffect(() => {
    if (dismissed || ungated) return
    const dialog = dialogRef.current
    const trap = trapRef.current
    if (!dialog || !trap) return

    // Focus the dialog itself (it has tabIndex={-1}), not a control inside
    // it, so screen readers announce the dialog and its heading. The logo
    // above the card is deliberately excluded from this — see the `inert`
    // wrapper around it below — so it can never be the thing that gets
    // focused, on mount or otherwise.
    dialog.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !trap) return
      const items = Array.from(trap.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    // Belt-and-suspenders: the Tab handler above only re-routes focus once
    // it's already sitting on the trap's first/last item. Clicking the dark
    // scrim (which isn't focusable) drops document.activeElement to <body>
    // instead, so the very next Tab press falls outside that check entirely
    // and walks into the storefront behind the overlay (header nav, cart
    // button, "Add to cart" on product cards) — content the user can't even
    // see. A focusin listener catches focus landing ANYWHERE outside the
    // dialog, however it got there, and pulls it straight back in, which is
    // what actually keeps aria-modal="true" honest.
    function onFocusIn(e: FocusEvent) {
      if (!dialog || dialog.contains(e.target as Node)) return
      dialog.focus()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [dismissed, exited, ungated])

  if (dismissed || ungated) return null

  function accept() {
    document.cookie = gateCookieString()
    setDismissed(true)
  }

  const canEnter = age && researcher

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-5 backdrop-blur-md outline-none"
      style={{ background: 'rgba(14, 21, 18, 0.55)' }}
    >
      {/*
        `items-start` + `my-auto` (rather than `items-center`) on purpose:
        centering via `items-center` on the scroll container itself means
        content taller than the viewport overflows the START edge, and
        scrollTop can never go negative — so on a short viewport the top of
        the card (logo, heading, the paragraph explaining what you're
        affirming) is clipped and permanently unreachable. `my-auto` still
        centers the card when there's slack, but yields to the top when
        there isn't, keeping the whole thing scrollable into view.
      */}
      <div className="my-auto flex w-full max-w-[560px] flex-col items-center gap-6">
        {/*
          Logo inherits its text color; force it light so it reads on the
          dark scrim. It's deliberately OUTSIDE the focus trap below and
          marked `inert`: it doesn't need to be tabbable inside a mandatory
          modal, and a stray Tab press landing on it would soft-navigate a
          deep-linked visitor to "/" while the gate stays up.
        */}
        <div inert style={{ color: 'var(--paper)' }}>
          <Logo size={24} />
        </div>

        {/* The focus trap spans only the card and the Exit/Go-back control below it — not the logo above. */}
        <div ref={trapRef} className="flex w-full flex-col items-center gap-6">
          <div
            className="w-full p-7 sm:p-9"
            style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--r-2xl)',
              border: '1px solid var(--hair)',
              boxShadow: '0 24px 64px rgba(14, 21, 18, 0.24)',
            }}
          >
            {exited ? (
              <>
                <h2
                  id="gate-title"
                  className="text-[clamp(24px,4vw,32px)] font-bold tracking-tight"
                  style={{ color: 'var(--ink)' }}
                >
                  Research use only
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  Kairo Labs supplies research materials to qualified researchers only. We can&apos;t
                  let you continue to the catalog.
                </p>
                <button
                  type="button"
                  onClick={() => setExited(false)}
                  className="mt-6 text-[14px] font-semibold underline underline-offset-4"
                  style={{ color: 'var(--forest)' }}
                >
                  Go back
                </button>
              </>
            ) : (
              <>
                <h2
                  id="gate-title"
                  className="text-[clamp(26px,4.5vw,36px)] font-bold tracking-tight"
                  style={{ color: 'var(--ink)' }}
                >
                  Researcher verification
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  Kairo Labs supplies research peptides exclusively to qualified researchers and
                  laboratories for in vitro and laboratory use. Please confirm before continuing.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                  <GateCheckbox
                    checked={age}
                    onChange={setAge}
                    label={
                      <>
                        I am at least <strong>21 years of age</strong>.
                      </>
                    }
                  />
                  <GateCheckbox
                    checked={researcher}
                    onChange={setResearcher}
                    label={
                      <>
                        I confirm I am a <strong>qualified researcher</strong> purchasing for{' '}
                        <strong>in vitro / laboratory research</strong> only — not for human or
                        veterinary use.
                      </>
                    }
                  />
                </div>

                <button
                  type="button"
                  disabled={!canEnter}
                  aria-disabled={!canEnter}
                  onClick={accept}
                  className="mt-7 w-full rounded-full py-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed"
                  style={{
                    background: canEnter ? 'var(--emerald)' : 'var(--paper-band)',
                    color: canEnter ? '#fff' : 'var(--ink-ghost)',
                  }}
                >
                  Enter Kairo Labs →
                </button>

                <p className="mt-6 text-[12px] leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
                  By proceeding you affirm the statements above are true. Products are not for human
                  or veterinary use, not for use in diagnostic procedures, and have not been evaluated
                  by the U.S. Food and Drug Administration.
                </p>
              </>
            )}
          </div>

          {!exited && (
            <p className="text-[13px]" style={{ color: 'var(--ink-ghost)' }}>
              Not a researcher?{' '}
              <button
                type="button"
                onClick={() => setExited(true)}
                className="font-semibold underline underline-offset-4"
                style={{ color: 'var(--paper)' }}
              >
                Exit
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function GateCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: React.ReactNode
}) {
  // The input is nested inside the label instead of using htmlFor so the
  // whole row is clickable. Nesting alone already associates the label with
  // the control (for both the a11y tree and native click-forwarding) — do
  // NOT add htmlFor back on top of this: a label that both wraps its control
  // AND points at it via htmlFor double-fires the click in real browsers
  // (the input's own click plus the label's forwarded activation), which
  // toggles the checkbox twice and nets out unchecked. jsdom doesn't
  // reproduce that double-activation, so this only breaks in a real browser.
  return (
    <label
      className="flex cursor-pointer items-start gap-3 p-4 text-[15px] leading-relaxed transition-colors"
      style={{
        borderRadius: 'var(--r-lg)',
        border: `1px solid ${checked ? 'var(--emerald-line)' : 'var(--hair)'}`,
        background: checked ? 'var(--emerald-soft)' : 'transparent',
        color: 'var(--ink-soft)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[2px] h-[18px] w-[18px] shrink-0 accent-[var(--emerald)]"
      />
      <span>{label}</span>
    </label>
  )
}
