'use client'

import { useRouter } from 'next/navigation'
import type { AnswerMode, Clef } from '@/lib/sightReadingLevels'

interface SightReadingSessionCompleteProps {
  /** 0–1 accuracy ratio. Derived from correct/total. */
  score: number
  correct: number
  total: number
  /** Elapsed session time in milliseconds. */
  elapsed: number
  /** Previous best time in seconds (0 if no prior session). */
  prevBest: number
  /** True when the session's elapsed time beat the previous best. */
  isNewBest: boolean
  mode: AnswerMode
  clef: Clef
  /** Display label for the level (e.g. "Starter", "L1", "L10", or
   *  "Custom" for /note-id/custom sessions). */
  levelLabel: string
  /** Restart the same session. Engine-specific logic. */
  onPlayAgain: () => void
  /** Optional: enter the deck's browse mode. Currently only the
   *  Real Piano engine (StudyEngine) supplies this — /note-id has
   *  no browse mode so the Browse Cards button hides for those. */
  onBrowse?: () => void
}

const MODE_LABELS: Record<AnswerMode, string> = {
  letters: 'Letters',
  'full-piano': 'Full Piano',
  'real-piano': 'Real Piano',
}

const CLEF_LABELS: Record<Clef, string> = {
  treble: 'Treble',
  bass: 'Bass',
  grand: 'Grand',
}

/** Format ms as "Xm Ys" — sub-minute renders as "Ys". */
function formatElapsed(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${s}s`
}

/** Format seconds-as-number with one decimal (e.g. "12.4s"). Used
 *  for prev-best display — shorter sessions warrant precision. */
function formatBest(seconds: number): string {
  if (seconds <= 0) return '—'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toFixed(0)}s`
}

/** Convert "L3" → "Level 3"; "Starter" → "Starter"; "L10" → "Level 10". */
function expandLevelLabel(label: string): string {
  const m = label.match(/^L(\d+)$/)
  if (m) return `Level ${m[1]}`
  return label
}

/**
 * Unified session-complete overlay used by both play engines
 * (/note-id and /study). Replaces the engine-specific complete
 * screens that each previously rendered inline.
 *
 * Renders as a fullscreen cream-gradient overlay. The page beneath
 * is still mounted — `onPlayAgain` restarts the same session
 * in-place (engine-specific logic), while "Pick another level"
 * routes back to /sight-reading.
 */
export default function SightReadingSessionComplete({
  score,
  correct,
  total,
  elapsed,
  prevBest,
  isNewBest,
  mode,
  clef,
  levelLabel,
  onPlayAgain,
  onBrowse,
}: SightReadingSessionCompleteProps) {
  const router = useRouter()
  const elapsedSec = elapsed / 1000

  const accuracyText =
    total > 0 ? `${Math.round(score * 100)}%` : '—'
  const elapsedText = formatElapsed(elapsed)
  const bestText = isNewBest
    ? formatBest(elapsedSec)
    : formatBest(prevBest)

  const badge = `${MODE_LABELS[mode]} · ${CLEF_LABELS[clef]} · ${expandLevelLabel(levelLabel)}`
  const subText = `${correct} of ${total} notes · ${elapsedText}`

  return (
    <div className="nl-sr-complete-overlay" role="dialog" aria-modal="true">
      <div className="nl-sr-complete-card">
        <span className="nl-sr-complete-badge">{badge}</span>
        <h1 className="nl-sr-complete-title">Session complete.</h1>
        <p className="nl-sr-complete-sub">{subText}</p>

        <div className="nl-sr-complete-stats">
          <div className="nl-sr-complete-stat">
            <span className="nl-sr-complete-stat__label">Accuracy</span>
            <span className="nl-sr-complete-stat__value">{accuracyText}</span>
          </div>
          <div className="nl-sr-complete-stat">
            <span className="nl-sr-complete-stat__label">Time</span>
            <span className="nl-sr-complete-stat__value">{elapsedText}</span>
          </div>
          <div
            className={
              'nl-sr-complete-stat' +
              (isNewBest ? ' is-new-best' : '')
            }
          >
            <span className="nl-sr-complete-stat__label">
              {isNewBest && (
                <span
                  className="nl-sr-complete-stat__newdot"
                  aria-hidden
                />
              )}
              {isNewBest ? 'Best · new' : 'Best'}
            </span>
            <span className="nl-sr-complete-stat__value">{bestText}</span>
          </div>
        </div>

        <div className="nl-sr-complete-actions">
          <button
            type="button"
            className="nl-sr-complete-btn nl-sr-complete-btn--primary"
            onClick={onPlayAgain}
          >
            Play again
          </button>
          <button
            type="button"
            className="nl-sr-complete-btn nl-sr-complete-btn--secondary"
            onClick={() => router.push('/sight-reading')}
          >
            Pick another level
          </button>
          {onBrowse && (
            <button
              type="button"
              className="nl-sr-complete-btn nl-sr-complete-btn--secondary"
              onClick={onBrowse}
            >
              Browse cards
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
