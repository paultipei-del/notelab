'use client'

import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export interface OverviewEntry {
  /** Sub-program slug used in the link href (e.g. 'fundamentals'). */
  slug: string
  /** Sub-program display name (e.g. 'Fundamentals'). */
  title: string
  /** Completed exercise count across all topics in the sub-program. */
  done: number
  /** Total exercise count across all topics in the sub-program. */
  total: number
}

interface Props {
  entries: OverviewEntry[]
}

type MasteryState = 'unseen' | 'started' | 'progressing' | 'mastered'

function masteryFor(done: number, total: number): MasteryState {
  if (total === 0 || done === 0) return 'unseen'
  const pct = done / total
  if (pct < 0.5) return 'started'
  if (pct < 0.9) return 'progressing'
  return 'mastered'
}

const FILL: Record<MasteryState, string> = {
  unseen: '#C8C4BA',
  started: '#B5402A',
  progressing: '#E8A84A',
  mastered: '#3B6D11',
}

/**
 * Top-level overview strip for /programs/rhythm — one block per sub-program,
 * proportionally filled with the mastery color of that sub-program. Sits above
 * the sub-program cards (does not replace them).
 */
export default function RhythmTopLevelOverview({ entries }: Props) {
  if (entries.length === 0) return null

  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 10px 0' }}>
        Your progress
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))`, gap: '10px' }}>
        {entries.map(entry => {
          const state = masteryFor(entry.done, entry.total)
          const pct = entry.total > 0 ? Math.round(entry.done / entry.total * 100) : 0
          const fill = FILL[state]
          return (
            <Link
              key={entry.slug}
              href={`/programs/rhythm/${entry.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  background: '#FDFAF3',
                  border: '1px solid #DDD8CA',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8CA' }}
              >
                <p style={{ fontFamily: SERIF, fontSize: '15px', fontWeight: 400, color: '#2A2318', margin: '0 0 8px 0', lineHeight: 1.2 }}>
                  {entry.title}
                </p>
                <div style={{ height: '6px', background: '#EDE8DF', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: fill, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                  {entry.done} / {entry.total} exercises complete
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
