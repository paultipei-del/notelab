'use client'

interface TapCounterProps {
  /** Number of intervals captured so far (taps - 1), capped externally at 6. */
  filled: number
}

const TOTAL = 6

/**
 * Six-dot progress strip. Fills left-to-right as the user racks up
 * intervals. Capped at 6 — 7+ taps keeps all dots filled (stable
 * state). Used as a visual confidence meter.
 */
export default function TapCounter({ filled }: TapCounterProps) {
  return (
    <div className="nl-tap-counter" role="presentation" aria-hidden>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <span
          key={i}
          className={'nl-tap-counter__dot' + (i < filled ? ' is-on' : '')}
        />
      ))}
    </div>
  )
}
