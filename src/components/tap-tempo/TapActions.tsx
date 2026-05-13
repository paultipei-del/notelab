'use client'

import type { TapState } from './tapState'

interface TapActionsProps {
  state: TapState
  onReset: () => void
  onSendToMetronome: () => void
}

/**
 * Reset (always enabled) + Use-in-metronome (enabled only when state
 * is stable). Both stopPropagation so clicks on either button don't
 * fall through to the stage-level tap handler.
 */
export default function TapActions({
  state,
  onReset,
  onSendToMetronome,
}: TapActionsProps) {
  const canSend = state.kind === 'stable'
  return (
    <div className="nl-tap-actions">
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onReset()
        }}
        className="nl-tap-actions__reset"
      >
        Reset
      </button>
      <button
        type="button"
        disabled={!canSend}
        onClick={e => {
          e.stopPropagation()
          if (canSend) onSendToMetronome()
        }}
        className="nl-tap-actions__send"
      >
        <span className="nl-tap-actions__send-desktop">Use in metronome →</span>
        <span className="nl-tap-actions__send-mobile">Use →</span>
      </button>
    </div>
  )
}
