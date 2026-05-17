'use client'

const F = 'var(--font-jost), sans-serif'

interface Props {
  heldNotes: Set<number>
  currentKey: string
}

/**
 * Stub grand-staff visualization. Eventually renders the held notes as a
 * single chord on a grand staff using VexFlow, with the key signature
 * derived from `currentKey`, enharmonic spelling driven by Tonal, and
 * automatic ledger lines / accidentals. For now, prints the would-be
 * staff caption so the parent wiring can be verified end-to-end.
 */
export default function GrandStaff({ heldNotes, currentKey }: Props) {
  const sorted = Array.from(heldNotes).sort((a, b) => a - b)
  return (
    <div style={{
      background: 'var(--cream-key)',
      border: '1px solid var(--brown-faint)',
      borderRadius: 16,
      padding: '20px 24px',
    }}>
      <p style={{
        fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400,
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        color: '#B0ACA4', margin: '0 0 10px',
      }}>
        Grand Staff · stub
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: 'var(--brown)', margin: '0 0 6px', lineHeight: 1.55 }}>
        Will render held MIDI notes as a single chord on a VexFlow grand staff,
        with key signature from <strong style={{ color: 'var(--ink)' }}>{currentKey}</strong>,
        Tonal-driven enharmonic spelling (Bb vs A♯ depending on key), and
        auto-split between treble and bass at middle C.
      </p>
      <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', margin: 0 }}>
        {sorted.length === 0 ? 'No notes held' : `${sorted.length} note${sorted.length === 1 ? '' : 's'} held: ${sorted.join(', ')}`}
      </p>
    </div>
  )
}
