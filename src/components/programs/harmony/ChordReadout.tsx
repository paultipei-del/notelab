'use client'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  heldNotes: Set<number>
  currentKey: string
}

/**
 * Stub chord readout. Eventually identifies the chord formed by the held
 * notes via Tonal.Chord.detect, renders its quality and inversion, the
 * Roman-numeral analysis in the current key, and a confidence indicator
 * when the spelling is ambiguous. For now, just shows what would be
 * fed into the analysis.
 */
export default function ChordReadout({ heldNotes, currentKey }: Props) {
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
        Chord Readout · stub
      </p>
      <p style={{
        fontFamily: SERIF, fontSize: 28, fontWeight: 300,
        color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.1,
      }}>
        {sorted.length === 0 ? '—' : sorted.length === 1 ? 'single note' : `${sorted.length}-note chord`}
      </p>
      <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', margin: '0 0 8px' }}>
        in {currentKey}
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: 'var(--brown)', margin: 0, lineHeight: 1.55 }}>
        Future: Tonal.Chord.detect output (e.g. "Cmaj7/E"), Roman-numeral
        in the current key (e.g. "I⁶⁵"), inversion label, and a small
        confidence indicator when the symbol is ambiguous.
      </p>
    </div>
  )
}
