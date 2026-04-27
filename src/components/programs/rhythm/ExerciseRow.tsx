'use client'

import Link from 'next/link'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const PREFIX_RE = /^#\d+\s*-\s*/
const METER_SUFFIX_RE = /\s*\((\d+\/\d+)\)\s*$/

/**
 * Strip insert-time `#N -` prefix and the trailing meter tag (`(3/4)`).
 * Defensive: the migration script removes the prefix from Supabase, but this
 * keeps the UI clean if the migration hasn't run yet.
 */
function displayTitle(raw: string, stripMeter: boolean): string {
  let t = raw.replace(PREFIX_RE, '')
  if (stripMeter) t = t.replace(METER_SUFFIX_RE, '')
  return t.trim()
}

interface Props {
  exercise: RhythmExerciseMeta
  progress: RhythmProgress | undefined
  globalIndex: number
  href: string
  isUnlocked: boolean
  isCurrent?: boolean
  /**
   * True when this row is a meter sibling of the exercise immediately above
   * (e.g. "Half & Whole Rests (3/4)" rendered under "Half & Whole Rests").
   * Variant rows: no number badge, indented, dimmer title, share their
   * parent's exercise number conceptually.
   */
  isMeterVariant?: boolean
}

export default function ExerciseRow({
  exercise, progress, globalIndex, href, isUnlocked, isCurrent, isMeterVariant,
}: Props) {
  const completed = progress?.completed ?? false
  const bestPct = progress?.best_timing ?? 0
  // Variants render with their parent's title (no trailing meter tag) — the
  // meter is already shown below the title via `beats/beat_type`.
  const title = displayTitle(exercise.title, !!isMeterVariant)

  // Layout deltas for variants: extra left padding to indent, no badge, a
  // small ↳ glyph in place of the badge to signal the parent relationship.
  const leftPad = isMeterVariant ? '40px' : '16px'
  const titleColor = isMeterVariant
    ? (isUnlocked ? '#7A7060' : '#B0AEA8')
    : (isUnlocked ? '#1A1A18' : '#B0AEA8')
  const titleSize = isMeterVariant ? '14px' : '16px'

  if (!isUnlocked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: `12px 16px 12px ${leftPad}`,
        background: '#FDFAF3',
        opacity: 0.5,
        cursor: 'default',
      }}>
        {isMeterVariant ? (
          <span aria-hidden="true" style={{ fontFamily: F, fontSize: '14px', color: '#DDD8CA', width: '20px', flexShrink: 0, textAlign: 'center' as const }}>↳</span>
        ) : (
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#DDD8CA', width: '28px', flexShrink: 0, textAlign: 'center' as const }}>{globalIndex}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: titleSize, fontWeight: 300, color: '#B0AEA8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{title}</p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0AEA8', margin: 0 }}>
            {exercise.beats}/{exercise.beat_type}
          </p>
        </div>
        <span aria-hidden="true" style={{ fontSize: 'var(--nl-text-compact)', opacity: 0.5, flexShrink: 0 }}>🔒</span>
      </div>
    )
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: `12px 16px 12px ${leftPad}`,
          background: isCurrent ? '#F2EDDF' : (isMeterVariant ? '#FDFAF3' : 'white'),
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#F9F7F2' }}
        onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? '#F2EDDF' : (isMeterVariant ? '#FDFAF3' : 'white') }}
      >
        {isMeterVariant ? (
          <span aria-hidden="true" style={{ fontFamily: F, fontSize: '14px', color: '#B0AEA8', width: '20px', flexShrink: 0, textAlign: 'center' as const }}>↳</span>
        ) : (
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0AEA8', width: '28px', flexShrink: 0, textAlign: 'center' as const }}>{globalIndex}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: titleSize, fontWeight: 300, color: titleColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{title}</p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
            {exercise.beats}/{exercise.beat_type}
          </p>
        </div>
        {completed && <span aria-hidden="true" style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#3B6D11', fontWeight: 500, flexShrink: 0 }}>✓</span>}
        {!completed && bestPct > 0 && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B5402A', flexShrink: 0 }}>{bestPct}%</span>}
        {!completed && bestPct === 0 && <span aria-hidden="true" style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', flexShrink: 0 }}>→</span>}
      </div>
    </Link>
  )
}
