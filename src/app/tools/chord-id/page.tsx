import Link from 'next/link'
import { HarmonyPlayground } from '@/components/HarmonyPlayground'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export const metadata = {
  title: 'Chord Identifier — NoteLab',
  description:
    'Real-time chord identification from any MIDI keyboard. See chord names, ' +
    'Roman numeral analysis, and proper enharmonic spelling. Free, runs in your browser.',
}

export default function ChordIdToolPage() {
  return (
    <div className="nl-tool-page">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/tools" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Tools
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: 28, marginBottom: 32 }}>
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: '#7A7060', marginBottom: 10,
          }}>
            Tool
          </p>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 300,
            fontSize: 'clamp(28px,4vw,44px)',
            color: '#2A2318', marginBottom: 12, letterSpacing: '0.02em',
          }}>
            Chord Identifier
          </h1>
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-body)',
            color: '#7A7060', maxWidth: 600, lineHeight: 1.7,
          }}>
            Play any chord on your MIDI keyboard or computer keyboard. See
            the chord name, how it&apos;s spelled, and what it does in any key.
          </p>
        </div>

        <HarmonyPlayground />

      </div>
    </div>
  )
}
