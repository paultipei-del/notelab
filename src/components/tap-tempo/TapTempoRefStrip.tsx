'use client'

import { rangeFor } from '@/lib/metronomeData'
import type { TapState } from './tapState'

interface TapTempoRefStripProps {
  state: TapState
}

/**
 * Read-only sibling of /metronome's TempoRangeCell — no info icon,
 * no clickable subdivisions. Shows the active range + position dot
 * once we have a BPM; dimmed placeholder copy in the empty state.
 *
 * Clicks on this strip do NOT fall through to the page's tap
 * handler — the strip is mounted in `<aside>` outside the
 * tap-stage's onClick boundary.
 */
export default function TapTempoRefStrip({ state }: TapTempoRefStripProps) {
  if (state.kind === 'empty') {
    return (
      <aside className="nl-tap-strip is-empty">
        <span className="nl-tap-strip__eyebrow">Tempo range</span>
        <div className="nl-tap-strip__head">
          <span className="nl-tap-strip__word">awaiting tempo</span>
          <span className="nl-tap-strip__bounds">— BPM</span>
        </div>
        <div className="nl-tap-strip__bar" aria-hidden />
        <div className="nl-tap-strip__labels">
          <span>20</span>
          <span>400</span>
        </div>
      </aside>
    )
  }

  const { range, position } = rangeFor(state.bpm)
  const pct = Math.round(position * 100)

  return (
    <aside className="nl-tap-strip">
      <span className="nl-tap-strip__eyebrow">Tempo range</span>
      <div className="nl-tap-strip__head">
        <span className="nl-tap-strip__word">{range.name}</span>
        <span className="nl-tap-strip__bounds">
          {range.min} – {range.max} BPM
        </span>
      </div>
      <div className="nl-tap-strip__bar">
        <div className="nl-tap-strip__fill" style={{ width: `${pct}%` }} />
        <div
          className="nl-tap-strip__dot"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="nl-tap-strip__labels">
        <span>{range.min}</span>
        <span>{range.max}</span>
      </div>
    </aside>
  )
}
