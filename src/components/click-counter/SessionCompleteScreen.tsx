'use client'

interface SessionCompleteScreenProps {
  sets: number
  target: number
  elapsedMs: number
  onDismiss: () => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m} min ${rem < 10 ? '0' : ''}${rem} sec`
}

/**
 * Cream-backdrop overlay that takes over the viewport when the user
 * ends a session (either by completing all sets or clicking End
 * session). Preserves the content and styling of the legacy inline
 * overlay verbatim — the only change is that it's now its own file.
 */
export default function SessionCompleteScreen({
  sets,
  target,
  elapsedMs,
  onDismiss,
}: SessionCompleteScreenProps) {
  const totalReps = sets * target
  const summary =
    target > 0 && sets > 0
      ? `${sets} sets × ${target} reps`
      : `${sets} sets completed`

  return (
    <div className="nl-cc-overlay">
      <p className="nl-cc-overlay__title">Session complete.</p>
      <p className="nl-cc-overlay__summary">{summary}</p>
      <p className="nl-cc-overlay__time">
        {elapsedMs > 0 ? formatTime(elapsedMs) : ''}
      </p>
      <div className="nl-cc-overlay__stats">
        <div className="nl-cc-overlay__stat">
          <span className="nl-cc-overlay__stat-value">{sets}</span>
          <span className="nl-cc-overlay__stat-label">Sets</span>
        </div>
        <div className="nl-cc-overlay__stat">
          <span className="nl-cc-overlay__stat-value">{totalReps}</span>
          <span className="nl-cc-overlay__stat-label">Total reps</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="nl-cc-overlay__btn"
      >
        New session
      </button>
    </div>
  )
}
