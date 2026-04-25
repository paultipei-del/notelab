'use client'

import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'

export interface RetentionEntry {
  /** Topic display name. */
  name: string
  /** URL to the topic page (used as link target on dot click). */
  href: string
  /** Completed exercise count for this topic. */
  done: number
  /** Total exercise count for this topic. */
  total: number
}

interface Props {
  entries: RetentionEntry[]
}

type MasteryState = 'unseen' | 'started' | 'progressing' | 'mastered'

function masteryFor(done: number, total: number): MasteryState {
  if (total === 0 || done === 0) return 'unseen'
  const pct = done / total
  if (pct < 0.5) return 'started'
  if (pct < 0.9) return 'progressing'
  return 'mastered'
}

const COLOR: Record<MasteryState, string> = {
  unseen: '#DDD8CA',
  started: '#B5402A',
  progressing: '#E8A84A',
  mastered: '#3B6D11',
}

/**
 * Compact per-topic mastery strip. Renders one dot per entry, color-coded by
 * progress bracket. Each dot is a Link with a native title tooltip showing
 * the topic name and exact done/total.
 */
export default function RhythmRetentionStrip({ entries }: Props) {
  if (entries.length === 0) return null
  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 10px 0' }}>
        Your progress
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {entries.map(entry => {
          const state = masteryFor(entry.done, entry.total)
          const bg = COLOR[state]
          const label = `${entry.name}: ${entry.done}/${entry.total}`
          return (
            <Link
              key={entry.name}
              href={entry.href}
              title={label}
              aria-label={label}
              style={{ textDecoration: 'none', lineHeight: 0 }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: bg,
                  border: state === 'unseen' ? '1px solid #C8C4BA' : 'none',
                  transition: 'transform 0.12s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.18)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
