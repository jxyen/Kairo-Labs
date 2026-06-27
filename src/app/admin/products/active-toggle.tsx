'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setProductActive } from './actions'

export function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setProductActive(id, !active); router.refresh() })}
      className="text-black/60 hover:text-black disabled:opacity-50"
    >
      {active ? 'Deactivate' : 'Reactivate'}
    </button>
  )
}
