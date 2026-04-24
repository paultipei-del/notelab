'use client'

/**
 * Decorative musical-glyph layer for marketing surfaces. Glyphs sit
 * behind content (absolute positioning, pointer-events: none, low
 * opacity). Seed-driven positioning so the same `seed` always renders
 * the same layout — useful for server/client parity and predictable
 * placement across hot reloads.
 */

const GLYPHS = [
  '𝄞',   // treble clef
  '𝄢',   // bass clef
  '𝄐',   // fermata
  '♩',   // quarter note
  '♪',   // eighth note
  '♫',   // beamed eighths
  '♯',   // sharp
  '♭',   // flat
]

// Deterministic pseudo-random — xmur3 hash mixed with mulberry32.
function seeded(seed: number) {
  let a = seed | 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function GlyphBackdrop({
  density = 8,
  seed = 42,
}: {
  /** Roughly how many glyphs to scatter (default 8). */
  density?: number
  /** Seed for deterministic placement. */
  seed?: number
}) {
  const rand = seeded(seed)
  const glyphs = Array.from({ length: density }, (_, i) => {
    const glyph = GLYPHS[Math.floor(rand() * GLYPHS.length)]
    const left = `${Math.round(rand() * 92)}%`
    const top = `${Math.round(rand() * 92)}%`
    const size = 40 + Math.round(rand() * 80) // 40–120px
    const rotation = Math.round((rand() - 0.5) * 30) // -15..+15
    const opacity = 0.04 + rand() * 0.04 // 0.04..0.08
    return { key: i, glyph, left, top, size, rotation, opacity }
  })

  return (
    <div className="nl-glyph-backdrop" aria-hidden="true">
      {glyphs.map(g => (
        <span
          key={g.key}
          className="nl-glyph"
          style={{
            left: g.left,
            top: g.top,
            fontSize: `${g.size}px`,
            transform: `rotate(${g.rotation}deg)`,
            opacity: g.opacity,
          }}
        >
          {g.glyph}
        </span>
      ))}
    </div>
  )
}
