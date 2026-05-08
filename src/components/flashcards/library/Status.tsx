'use client'

export type StatusState = 'unstarted' | 'in-progress' | 'mastered'
export type StatusDensity = 'default' | 'compact'

export interface StatusProps {
  state: StatusState
  density?: StatusDensity
  /** Total card count — only required for 'unstarted'. */
  totalCards?: number
  /** Cards currently due — only required for 'in-progress'. */
  due?: number
  /** Percentage learned (0-100) — required for 'in-progress'. */
  percentLearned?: number
  /** Human-readable last-seen label — used by 'mastered' (and optionally 'in-progress'). */
  lastSeen?: string
  /** Unique-id suffix so multiple SVG gradients on a page don't collide. */
  instanceKey?: string
}

export default function Status(props: StatusProps) {
  const { state, density = 'default' } = props
  if (state === 'unstarted') {
    return <StatusUnstarted density={density} totalCards={props.totalCards ?? 0} />
  }
  if (state === 'mastered') {
    return (
      <StatusMastered
        density={density}
        lastSeen={props.lastSeen}
        instanceKey={props.instanceKey}
      />
    )
  }
  return (
    <StatusInProgress
      density={density}
      due={props.due ?? 0}
      percentLearned={props.percentLearned ?? 0}
    />
  )
}

function StatusUnstarted({
  totalCards,
  density,
}: {
  totalCards: number
  density: StatusDensity
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <div
        style={{
          fontStyle: 'italic',
          fontSize: density === 'compact' ? 12 : 13,
          color: '#8a7560',
        }}
      >
        Not started
      </div>
      <div
        style={{
          fontSize: density === 'compact' ? 11 : 12,
          color: '#a89878',
          fontStyle: 'italic',
        }}
      >
        · {totalCards} cards
      </div>
    </div>
  )
}

function StatusInProgress({
  due,
  percentLearned,
  density,
}: {
  due: number
  percentLearned: number
  density: StatusDensity
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: density === 'compact' ? 10 : 12,
      }}
    >
      {due > 0 ? (
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: density === 'compact' ? 14 : 15,
            color: '#a0381c',
            fontWeight: 500,
            flex: '0 0 auto',
          }}
        >
          <span style={{ fontWeight: 600 }}>{due}</span>
          <span style={{ fontStyle: 'italic', marginLeft: 4 }}>due</span>
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: density === 'compact' ? 12 : 13,
            color: '#5a4028',
            flex: '0 0 auto',
          }}
        >
          in progress
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flex: density === 'compact' ? '0 0 auto' : '1 1 auto',
          maxWidth: 120,
          minWidth: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: density === 'compact' ? 60 : 50,
            height: 3,
            background: 'rgba(139, 105, 20, 0.15)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, percentLearned))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #c9a449 0%, #d4af37 100%)',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: density === 'compact' ? 11 : 12,
            color: '#8a7560',
            flex: '0 0 auto',
          }}
        >
          {percentLearned}%
        </div>
      </div>
    </div>
  )
}

function StatusMastered({
  lastSeen,
  density,
  instanceKey,
}: {
  lastSeen?: string
  density: StatusDensity
  instanceKey?: string
}) {
  // Each gradient instance needs a unique id — Safari/Firefox can render
  // the wrong stop colors when multiple inline SVGs share an id.
  const gradId = `gilt-check-${density}-${instanceKey ?? 'x'}`
  const size = density === 'compact' ? 12 : 14
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f4e5a1" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
        </defs>
        <path
          d="M3 7.5 L6 10.5 L11 4.5"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div
        style={{
          fontStyle: 'italic',
          fontSize: density === 'compact' ? 12 : 13,
          color: '#8b6914',
        }}
      >
        Mastered
      </div>
      {lastSeen && (
        <div
          style={{
            fontSize: density === 'compact' ? 11 : 12,
            color: '#a89878',
            fontStyle: 'italic',
          }}
        >
          · {lastSeen}
        </div>
      )}
    </div>
  )
}
