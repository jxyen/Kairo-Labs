'use client'

import { useMemo, useState } from 'react'

// A peptide reconstitution calculator for laboratory use. Given the mass of
// lyophilized peptide in the vial, the volume of solvent (e.g. bacteriostatic
// water) added, and a target amount to withdraw, it derives the stock
// concentration, the volume to draw, the equivalent U-100 syringe graduation,
// and the number of equal withdrawals a vial yields. Pure display/math — no
// human-use guidance. All I/O framed as in-vitro handling of a reference material.

type MassUnit = 'mg' | 'mcg'

const U100_UNITS_PER_ML = 100

function toMcg(value: number, unit: MassUnit): number {
  return unit === 'mg' ? value * 1000 : value
}

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  // Trim trailing zeros but keep it readable.
  return Number(n.toFixed(digits)).toLocaleString('en-US', {
    maximumFractionDigits: digits,
  })
}

export function ReconstitutionCalculator() {
  const [vialMg, setVialMg] = useState('10')
  const [waterMl, setWaterMl] = useState('2')
  const [doseValue, setDoseValue] = useState('250')
  const [doseUnit, setDoseUnit] = useState<MassUnit>('mcg')

  const result = useMemo(() => {
    const vial = parseFloat(vialMg)
    const water = parseFloat(waterMl)
    const dose = parseFloat(doseValue)

    const valid =
      Number.isFinite(vial) && vial > 0 &&
      Number.isFinite(water) && water > 0 &&
      Number.isFinite(dose) && dose > 0

    if (!valid) return null

    const vialMcg = vial * 1000
    const doseMcg = toMcg(dose, doseUnit)
    const concMcgPerMl = vialMcg / water // mcg per mL
    const drawMl = doseMcg / concMcgPerMl // mL to withdraw for the target amount
    const units = drawMl * U100_UNITS_PER_ML // graduations on a U-100 syringe
    const withdrawals = vialMcg / doseMcg // equal target-sized withdrawals per vial

    return {
      concMgPerMl: concMcgPerMl / 1000,
      concMcgPerMl,
      drawMl,
      units,
      withdrawals,
      overDraw: drawMl > water,
    }
  }, [vialMg, waterMl, doseValue, doseUnit])

  return (
    <div className="rc-wrap">
      <div className="rc-grid">
        <Field
          label="Peptide in vial"
          suffix="mg"
          value={vialMg}
          onChange={setVialMg}
          hint="Total mass of lyophilized peptide stated on the vial / COA."
        />
        <Field
          label="Solvent added"
          suffix="mL"
          value={waterMl}
          onChange={setWaterMl}
          hint="Volume of bacteriostatic or sterile water used to reconstitute."
        />
        <div className="rc-field">
          <label className="rc-label" htmlFor="rc-dose">
            Target amount per draw
          </label>
          <div className="rc-inputrow">
            <input
              id="rc-dose"
              className="rc-input"
              inputMode="decimal"
              value={doseValue}
              onChange={(e) => setDoseValue(e.target.value)}
            />
            <div className="rc-unit-toggle" role="group" aria-label="Unit">
              {(['mcg', 'mg'] as MassUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`rc-unit ${doseUnit === u ? 'is-active' : ''}`}
                  aria-pressed={doseUnit === u}
                  onClick={() => setDoseUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <p className="rc-hint">The amount you intend to withdraw from the reconstituted stock.</p>
        </div>
      </div>

      <div className="rc-results" aria-live="polite">
        {!result ? (
          <p className="rc-empty">Enter a peptide mass, solvent volume, and target amount to see the results.</p>
        ) : (
          <>
            <div className="rc-out rc-out-primary">
              <div className="rc-out-label">Draw this volume</div>
              <div className="rc-out-value">
                {fmt(result.drawMl, 3)}<span className="rc-out-unit">mL</span>
              </div>
              <div className="rc-out-sub">
                = <strong>{fmt(result.units, 1)} units</strong> on a U-100 insulin syringe
              </div>
            </div>

            <div className="rc-out-row">
              <div className="rc-out">
                <div className="rc-out-label">Stock concentration</div>
                <div className="rc-out-value rc-out-value-sm">
                  {fmt(result.concMgPerMl, 3)}<span className="rc-out-unit">mg/mL</span>
                </div>
                <div className="rc-out-sub">{fmt(result.concMcgPerMl, 0)} mcg/mL</div>
              </div>
              <div className="rc-out">
                <div className="rc-out-label">Draws per vial</div>
                <div className="rc-out-value rc-out-value-sm">{fmt(result.withdrawals, 1)}</div>
                <div className="rc-out-sub">at this target amount</div>
              </div>
            </div>

            {result.overDraw && (
              <p className="rc-warn">
                The required draw exceeds the solvent volume in the vial — reduce the target amount or
                use less solvent for a more concentrated stock.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string
  suffix: string
  value: string
  onChange: (v: string) => void
  hint: string
}) {
  const id = `rc-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="rc-field">
      <label className="rc-label" htmlFor={id}>
        {label}
      </label>
      <div className="rc-inputrow">
        <input
          id={id}
          className="rc-input"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="rc-suffix">{suffix}</span>
      </div>
      <p className="rc-hint">{hint}</p>
    </div>
  )
}
