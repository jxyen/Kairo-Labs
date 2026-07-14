'use client'

import { useEffect, useRef, useState } from 'react'
import { gateCookieString } from '@/lib/gate'
import { Logo } from '@/components/logo'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

export function ResearcherGate() {
  const [age, setAge] = useState(false)
  const [researcher, setResearcher] = useState(false)
  const [exited, setExited] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const trapRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while the gate is up; restore it when it goes away.
  useEffect(() => {
    if (dismissed) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [dismissed])

  // Move focus into the gate and keep Tab inside it.
  useEffect(() => {
    if (dismissed) return
    const trap = trapRef.current
    if (!trap) return
    trap.querySelector<HTMLElement>(FOCUSABLE)?.focus()

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

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dismissed, exited])

  if (dismissed) return null

  function accept() {
    document.cookie = gateCookieString()
    setDismissed(true)
  }

  const canEnter = age && researcher

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-5 backdrop-blur-md"
      style={{ background: 'rgba(14, 21, 18, 0.55)' }}
    >
      {/* The focus trap spans the logo, the card AND the Exit link below it. */}
      <div ref={trapRef} className="flex w-full max-w-[560px] flex-col items-center gap-6">
        {/* Logo inherits its text color; force it light so it reads on the dark scrim. */}
        <div style={{ color: 'var(--paper)' }}>
          <Logo size={24} />
        </div>

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
