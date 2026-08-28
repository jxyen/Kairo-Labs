// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResearcherGate } from '@/components/researcher-gate'
import { GATE_COOKIE } from '@/lib/gate'

// The gate reads usePathname() to decide whether the route is ungated; outside
// a Next router it returns null, so pin it to a gated storefront route.
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`
  }
}

const ageBox = () => screen.getByRole('checkbox', { name: /21 years of age/i })
const researcherBox = () =>
  screen.getByRole('checkbox', { name: /qualified researcher/i })
const enterBtn = () =>
  screen.getByRole('button', { name: /enter kairo labs/i }) as HTMLButtonElement

beforeEach(clearCookies)
afterEach(() => {
  cleanup()
  clearCookies()
})

describe('ResearcherGate', () => {
  it('disables the enter button until both boxes are checked', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    expect(enterBtn().disabled).toBe(true)

    await user.click(ageBox())
    expect(enterBtn().disabled).toBe(true)

    await user.click(researcherBox())
    expect(enterBtn().disabled).toBe(false)
  })

  it('re-disables the button if a box is unchecked again', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    await user.click(ageBox())
    await user.click(researcherBox())
    expect(enterBtn().disabled).toBe(false)

    await user.click(ageBox())
    expect(enterBtn().disabled).toBe(true)
  })

  it('writes the cookie and removes the overlay on accept', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    await user.click(ageBox())
    await user.click(researcherBox())
    await user.click(enterBtn())

    expect(document.cookie).toContain(`${GATE_COOKIE}=1`)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows a dead-end message on exit and writes no cookie', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    await user.click(screen.getByRole('button', { name: /exit/i }))

    expect(screen.getByText(/qualified researchers only/i)).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(document.cookie).not.toContain(GATE_COOKIE)
  })

  it('returns to the gate from the dead-end screen', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    await user.click(screen.getByRole('button', { name: /exit/i }))
    await user.click(screen.getByRole('button', { name: /go back/i }))

    expect(enterBtn().disabled).toBe(true)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('does not dismiss on Escape', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    await user.keyboard('{Escape}')

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(document.cookie).not.toContain(GATE_COOKIE)
  })

  it('locks body scroll while up and restores it on accept', async () => {
    const user = userEvent.setup()
    render(<ResearcherGate />)

    expect(document.body.style.overflow).toBe('hidden')

    await user.click(ageBox())
    await user.click(researcherBox())
    await user.click(enterBtn())

    expect(document.body.style.overflow).toBe('')
  })

  // Real-browser regression guard: GateCheckbox's <label> wraps its <input>
  // (so the whole row is clickable) and must NOT also carry htmlFor pointing
  // at the input. A label that both wraps its control and points at it via
  // htmlFor forwards a *second* synthetic click to the input on top of the
  // input's own click, so a click landing on the checkbox square itself
  // double-toggles and nets out unchecked — while clicking the label text
  // (which has no native click of its own to double up with) still works.
  // jsdom does NOT reproduce that double-activation (a programmatic/simulated
  // click on the input only ever fires once), so a behavioral test that
  // clicks the checkbox and asserts it becomes checked would pass even with
  // the bug reintroduced — it can't tell one click from two. Instead we pin
  // the markup invariant that actually prevents the double-fire: the label
  // must have no `for` attribute.
  it('does not put htmlFor on the label wrapping either checkbox (would double-toggle it in a real browser)', () => {
    render(<ResearcherGate />)

    const ageLabel = ageBox().closest('label')
    const researcherLabel = researcherBox().closest('label')
    expect(ageLabel).not.toBeNull()
    expect(researcherLabel).not.toBeNull()
    expect(ageLabel!.hasAttribute('for')).toBe(false)
    expect(researcherLabel!.hasAttribute('for')).toBe(false)
  })

  // Regression guard: autofocus used to land on the logo's <Link href="/">
  // (it was the first focusable element inside the old, single focus trap).
  // A visitor arriving at a deep link who reflexively hits Enter would get
  // soft-navigated to "/" while the gate stayed up. Initial focus must go to
  // the dialog itself, not any link.
  it('moves initial focus to the dialog, not a link', () => {
    render(<ResearcherGate />)

    const dialog = screen.getByRole('dialog')
    expect(document.activeElement).toBe(dialog)
    expect(document.activeElement?.tagName).not.toBe('A')
  })

  // Regression guard: the logo must be structurally outside the tab trap and
  // marked non-interactive (`inert`), so it can never be reached via Tab
  // while the gate is up. jsdom/user-event don't implement `inert` focus
  // suppression, so we can only assert the markup that a real browser acts
  // on — not that Tab actually skips it.
  it('keeps the logo link outside the focus trap and marks it inert', () => {
    render(<ResearcherGate />)

    const dialog = screen.getByRole('dialog')
    const logoLink = dialog.querySelector('a[href="/"]')
    expect(logoLink).not.toBeNull()
    expect(logoLink!.closest('[inert]')).not.toBeNull()
  })

  // Regression guard: aria-modal="true" is only honest if focus genuinely
  // cannot land outside the dialog. Simulate what happens after a scrim
  // click drops focus to <body> and a subsequent Tab reaches real
  // storefront content behind the overlay (header nav, cart button, etc.) —
  // focusing that content directly, the way Tab would.
  it('pulls focus back inside the dialog if it lands outside', () => {
    render(<ResearcherGate />)

    const outside = document.createElement('button')
    outside.textContent = 'outside the gate'
    document.body.appendChild(outside)

    try {
      outside.focus()
      expect(document.activeElement).not.toBe(outside)
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    } finally {
      document.body.removeChild(outside)
    }
  })
})
