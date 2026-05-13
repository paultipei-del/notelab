'use client'

import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import TargetPopover, { type TargetKind } from './TargetPopover'

interface ConfigStripProps {
  target: number
  setTarget: number
  onTargetChange: (v: number) => void
  onSetTargetChange: (v: number) => void
  onEndSession: () => void
}

interface CellProps {
  eyebrowDesktop: string
  eyebrowMobile: string
  value: number
  kind: TargetKind
  onChange: (v: number) => void
}

function ConfigCell({ eyebrowDesktop, eyebrowMobile, value, kind, onChange }: CellProps) {
  const [open, setOpen] = useState(false)
  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setOpen(v => !v)
  }
  return (
    <div className="nl-cc-cfg" onClick={e => e.stopPropagation()}>
      <span className="nl-cc-cfg__eyebrow">
        <span className="nl-cc-cfg__eyebrow--desktop">{eyebrowDesktop}</span>
        <span className="nl-cc-cfg__eyebrow--mobile">{eyebrowMobile}</span>
      </span>
      <button type="button" className="nl-cc-cfg__value" onClick={handleClick}>
        {value}
      </button>
      {open && (
        <TargetPopover
          kind={kind}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

/**
 * Bottom strip with two config cells (Reps per set / Sets per
 * session) and an End session action button. All elements
 * stopPropagation so clicks here never fire stage increments.
 */
export default function ConfigStrip({
  target,
  setTarget,
  onTargetChange,
  onSetTargetChange,
  onEndSession,
}: ConfigStripProps) {
  return (
    <aside className="nl-cc-strip" onClick={e => e.stopPropagation()}>
      <ConfigCell
        eyebrowDesktop="Reps per set"
        eyebrowMobile="Reps"
        value={target}
        kind="rep"
        onChange={onTargetChange}
      />
      <ConfigCell
        eyebrowDesktop="Sets per session"
        eyebrowMobile="Sets"
        value={setTarget}
        kind="set"
        onChange={onSetTargetChange}
      />
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onEndSession()
        }}
        className="nl-cc-strip__end"
      >
        <span className="nl-cc-strip__end-desktop">End session</span>
        <span className="nl-cc-strip__end-mobile">End</span>
      </button>
    </aside>
  )
}
