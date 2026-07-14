// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResearcherGate } from '@/components/researcher-gate'
import { GATE_COOKIE } from '@/lib/gate'

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
})
