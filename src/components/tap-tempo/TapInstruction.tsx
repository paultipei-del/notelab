'use client'

import type { TapState } from './tapState'

interface TapInstructionProps {
  state: TapState
}

/**
 * Context-aware instruction line. Empty state lists the inputs;
 * partial counts down the taps remaining; stable confirms in forest
 * green. Keyboard keys render in <kbd> elements styled like compact
 * mono pills (see globals.css). Mobile shortens the empty + partial
 * phrasing to fit single-line.
 */
export default function TapInstruction({ state }: TapInstructionProps) {
  if (state.kind === 'empty') {
    return (
      <p className="nl-tap-instruction is-empty">
        <span className="nl-tap-instruction__desktop">
          Tap anywhere — or press{' '}
          <kbd className="nl-tap-kbd">Space</kbd>{' '}
          <kbd className="nl-tap-kbd">T</kbd>{' '}
          <span className="nl-tap-instruction__or">or any key</span>
        </span>
        <span className="nl-tap-instruction__mobile">Tap anywhere to begin</span>
      </p>
    )
  }
  if (state.kind === 'partial') {
    const remaining = 6 - state.intervals
    return (
      <p className="nl-tap-instruction is-partial">
        <span className="nl-tap-instruction__desktop">
          <em>Keep tapping</em> —{' '}
          <em>
            {remaining} more
          </em>{' '}
          for a stable reading
        </span>
        <span className="nl-tap-instruction__mobile">
          <em>{remaining} more</em> for a stable reading
        </span>
      </p>
    )
  }
  return (
    <p className="nl-tap-instruction is-stable">
      <span className="nl-tap-instruction__desktop">
        Stable reading · keep tapping to refine
      </span>
      <span className="nl-tap-instruction__mobile">Stable reading</span>
    </p>
  )
}
