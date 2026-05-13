'use client'

interface SetsRowProps {
  sets: number
  setTarget: number
  /** Index of the set that just completed — fires the glow animation
   *  on that specific dot for the celebration window. */
  justFilled: number | null
}

/**
 * "SETS · ● ● ● ◯" row above the rep counter. Filled dots fill
 * left-to-right; the most recently filled dot pulses with an outer
 * glow during the set-completion celebration.
 */
export default function SetsRow({ sets, setTarget, justFilled }: SetsRowProps) {
  return (
    <div className="nl-cc-sets">
      <span className="nl-cc-sets__label">Sets</span>
      <div className="nl-cc-sets__dots">
        {Array.from({ length: setTarget }).map((_, i) => {
          const filled = i < sets
          const isJustFilled = i === justFilled
          return (
            <span
              key={i}
              className={
                'nl-cc-sets__dot' +
                (filled ? ' is-filled' : '') +
                (isJustFilled ? ' is-celebrating' : '')
              }
            />
          )
        })}
      </div>
    </div>
  )
}
