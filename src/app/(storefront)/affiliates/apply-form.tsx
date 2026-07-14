'use client'
import { useActionState } from 'react'
import { applyAffiliate } from '@/lib/affiliates/apply'
import { PLATFORMS, type ApplyAffiliateState } from '@/lib/affiliates/apply-schema'

export function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyAffiliateState, FormData>(applyAffiliate, null)

  if (state?.ok) {
    return (
      <div
        style={{
          border: '1px solid var(--emerald-line)',
          background: 'var(--emerald-soft)',
          borderRadius: 'var(--r-lg)',
          padding: '28px 26px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Application received
        </div>
        <p style={{ margin: '10px auto 0', maxWidth: 460, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-muted)' }}>
          Thanks for your interest in the Kairo Labs affiliate program. We review every application by hand —
          if it&rsquo;s a fit, we&rsquo;ll reach out by email with your affiliate link and terms.
        </p>
      </div>
    )
  }

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <FieldGroup title="About you">
        <div className="co-row2">
          <Field name="full_name" label="Full name" required autoComplete="name" />
          <Field name="email" label="Email" type="email" required autoComplete="email" />
        </div>
        <Field name="phone" label="Phone (optional)" type="tel" autoComplete="tel" />
      </FieldGroup>

      <FieldGroup title="Your audience">
        <div className="co-row2">
          <label className="co-field">
            <span className="co-label">Main platform</span>
            <select name="primary_platform" className="co-input" required defaultValue="">
              <option value="" disabled>
                Select&hellip;
              </option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <Field name="audience_size" label="Audience size / followers" placeholder="e.g. 45k" required />
        </div>
        <Field
          name="primary_handle"
          label="Handle or profile URL"
          placeholder="@yourhandle or https://…"
          required
        />
        <Field
          name="other_links"
          label="Other platforms / links (optional)"
          placeholder="Additional profiles, one per line"
          textarea
        />
      </FieldGroup>

      <FieldGroup title="Fit">
        <Field
          name="niche"
          label="Your niche & audience"
          placeholder="Who follows you and what your content is about — fitness, biohacking, research, etc."
          textarea
          required
        />
        <Field
          name="promo_plan"
          label="How would you promote Kairo Labs?"
          placeholder="Content formats, frequency, and where it would run."
          textarea
          required
        />
        <Field
          name="experience"
          label="Have you promoted similar products before? (optional)"
          placeholder="Brands, results, or affiliate programs you've run."
          textarea
        />
        <div className="co-row2">
          <Field name="website" label="Website (optional)" placeholder="https://…" />
          <Field name="referral_source" label="How did you hear about us? (optional)" />
        </div>
      </FieldGroup>

      <label className="co-check" style={{ alignItems: 'flex-start' }}>
        <input type="checkbox" name="agreed_terms" required style={{ marginTop: 3 }} />
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-muted)' }}>
          I am 21 or older and confirm that any promotion will present Kairo Labs products accurately as{' '}
          <strong>research-use-only</strong> materials — not for human or animal consumption — and comply with the
          rules of any platform I post on.
        </span>
      </label>

      {state && !state.ok && (
        <div style={{ fontSize: 13, color: 'crimson' }}>{state.error}</div>
      )}

      <button type="submit" className="btn btn-emerald" disabled={pending} style={{ alignSelf: 'flex-start', padding: '13px 28px' }}>
        {pending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <legend
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-ghost)',
          marginBottom: 2,
        }}
      >
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  placeholder,
  textarea,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <label className="co-field">
      <span className="co-label">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          className="co-input co-textarea"
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <input
          name={name}
          className="co-input"
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
      )}
    </label>
  )
}
