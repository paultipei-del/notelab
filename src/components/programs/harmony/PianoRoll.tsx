'use client'

const F = 'var(--font-jost), sans-serif'

interface Props {
  heldNotes: Set<number>
  currentKey: string
}

/**
 * Stub piano-roll visualization. Eventually renders an 88-key piano with
 * highlighted held keys, scale-degree colouring keyed off `currentKey`,
 * and rolling MIDI history. For now, just prints the held MIDI numbers
 * and the key context so the parent wiring can be verified end-to-end.
 */
export default function PianoRoll({ heldNotes, currentKey }: Props) {
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
        Piano Roll · stub
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: 'var(--brown)', margin: '0 0 6px', lineHeight: 1.55 }}>
        Will render an 88-key piano keyboard with held keys highlighted in the
        current key's scale-degree palette. Future: rolling history strip,
        chord shape outline, octave markers.
      </p>
      <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', margin: 0 }}>
        Key: <strong style={{ color: 'var(--ink)' }}>{currentKey}</strong>{' · '}
        Held: <strong style={{ color: 'var(--ink)' }}>{sorted.length ? sorted.join(', ') : '—'}</strong>
      </p>
    </div>
  )
}
