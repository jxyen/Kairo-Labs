'use client'
import { useRouter } from 'next/navigation'
import { ORDER_FILTERS, type OrderFilterKey } from './order-utils'

export function StatusFilter({ active }: { active: OrderFilterKey }) {
  const router = useRouter()
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--ink-muted)' }}>Show</span>
      <select
        value={active}
        onChange={(e) => {
          const key = e.target.value
          router.push(key === 'all' ? '/admin/orders' : `/admin/orders?status=${key}`)
        }}
        style={{ padding: '6px 10px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 13, background: '#fff' }}
      >
        {ORDER_FILTERS.map((f) => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>
    </label>
  )
}
