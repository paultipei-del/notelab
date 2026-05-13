'use client'

interface RepActionsProps {
  canUndo: boolean
  onUndo: () => void
  onResetStreak: () => void
}

/**
 * Undo (decrement by 1, disabled at count 0) + Reset streak (snap to
 * 0 with dissolve animation). Both stopPropagation so clicks don't
 * fall through to the stage-level tap handler.
 */
export default function RepActions({
  canUndo,
  onUndo,
  onResetStreak,
}: RepActionsProps) {
  return (
    <div className="nl-cc-actions">
      <button
        type="button"
        disabled={!canUndo}
        onClick={e => {
          e.stopPropagation()
          if (canUndo) onUndo()
        }}
        className="nl-cc-actions__btn"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onResetStreak()
        }}
        className="nl-cc-actions__btn nl-cc-actions__btn--reset"
      >
        Reset streak
      </button>
    </div>
  )
}
