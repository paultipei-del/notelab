'use client'

/**
 * Three tiny looping demos shown inside /landing "What's inside"
 * cards. All pure CSS animation (keyframes defined in globals.css),
 * no external libraries. Each loop auto-pauses under
 * prefers-reduced-motion.
 */

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// ── Flashcard flip demo ─────────────────────────────────────────
export function MicroFlashcard() {
  return (
    <div className="nl-micro-flashcard" aria-hidden="true">
      <div className="nl-micro-flashcard__inner">
        <div className="nl-micro-flashcard__face">
          <div>
            <p
              style={{
                fontFamily: F,
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#9A9081',
                margin: '0 0 6px 0',
              }}
            >
              Question
            </p>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: '15px',
                fontWeight: 500,
                color: '#2A2318',
                margin: 0,
                letterSpacing: '0.01em',
                lineHeight: 1.3,
              }}
            >
              Major 6th ascending
            </p>
          </div>
        </div>
        <div className="nl-micro-flashcard__face nl-micro-flashcard__face--back">
          <div>
            <p
              style={{
                fontFamily: F,
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#B5402A',
                margin: '0 0 6px 0',
              }}
            >
              Answer
            </p>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: '14px',
                fontWeight: 400,
                color: '#2A2318',
                margin: 0,
                letterSpacing: '0.01em',
                lineHeight: 1.3,
                fontStyle: 'italic',
              }}
            >
              “My Bonnie Lies Over the Ocean”
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Piano-detection micro demo ──────────────────────────────────
/**
 * Five notes cycling across treble staff lines with a brief pulse on
 * each appearance. Uses staggered keyframe animations so each note's
 * visibility offsets don't need a JS loop.
 */
export function MicroPianoDetect() {
  return (
    <div aria-hidden="true" style={{ width: '100%', maxWidth: '240px', margin: '0 auto' }}>
      <svg viewBox="0 0 240 80" width="100%" height="80" role="img">
        {/* Staff (sw=12, top line at y=12). */}
        {[12, 24, 36, 48, 60].map((y, i) => (
          <line key={i} x1="0" y1={y} x2="240" y2={y} stroke="#D9CFAE" strokeWidth="1" />
        ))}
        {/* Treble clef baseline on the G4 line (= top + 3*sw = 48). Codebase
            canonical from StaffCard / TwoNoteGrandStaff: fontSize/sw ≈ 4.17;
            here pulled to 44 to keep the scroll inside the 80-tall viewbox. */}
        <text x="4" y="48" fontSize="44" fontFamily="Bravura, serif" fill="#1A1A18">𝄞</text>

        {/* 5 notes on each line (treble: E4, G4, B4, D5, F5). Notehead
            fontSize = 3.5*sw renders the head at ~1 staff-space tall, the
            visual proportion that reads as "a note on a line". */}
        {[
          { x: 80, y: 60, cls: 'nl-micro-note-1' },   // E4
          { x: 115, y: 48, cls: 'nl-micro-note-2' },  // G4
          { x: 150, y: 36, cls: 'nl-micro-note-3' },  // B4
          { x: 185, y: 24, cls: 'nl-micro-note-4' },  // D5
          { x: 220, y: 12, cls: 'nl-micro-note-5' },  // F5
        ].map((n, i) => (
          <g key={i} style={{ opacity: 0, animation: `${n.cls} 4s ease-in-out infinite` }}>
            <text x={n.x} y={n.y} fontSize="42" fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">{String.fromCodePoint(0xe0a4)}</text>
            <circle cx={n.x} cy={n.y} r="14" fill="none" stroke="#4CAF50" strokeWidth="1.2" opacity="0.6" />
          </g>
        ))}
      </svg>
      <p
        style={{
          textAlign: 'center',
          fontFamily: F,
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7A7060',
          margin: '6px 0 0 0',
        }}
      >
        Listening…
      </p>
    </div>
  )
}

// ── Level-progression micro demo ────────────────────────────────
/**
 * 10 dots filling in sequence over a 6-second loop. Each dot has its
 * own `animation-delay` so the fill travels left-to-right.
 */
export function MicroProgress() {
  return (
    <div aria-hidden="true" style={{ width: '100%', maxWidth: '240px', margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '20px 0',
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#D9CFAE',
              animation: 'nl-micro-level 6s ease-in-out infinite',
              animationDelay: `${i * 0.45}s`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: F,
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7A7060',
          margin: 0,
        }}
      >
        Level 1 — 10
      </p>
    </div>
  )
}
