'use client'

import Link from 'next/link'
import { useState } from 'react'
import PianoRoll from '@/components/programs/harmony/PianoRoll'
import GrandStaff from '@/components/programs/harmony/GrandStaff'
import ChordReadout from '@/components/programs/harmony/ChordReadout'
import { useMidiInput, type MidiStatus } from '@/hooks/useMidiInput'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// Twelve major + twelve minor keys for the picker. Kept inline to avoid a
// trivial extra import; can be moved to a tonal-driven helper later.
const KEYS: string[] = [
  'C major', 'G major', 'D major', 'A major', 'E major', 'B major', 'F♯ major',
  'F major', 'B♭ major', 'E♭ major', 'A♭ major', 'D♭ major', 'G♭ major',
  'A minor', 'E minor', 'B minor', 'F♯ minor', 'C♯ minor', 'G♯ minor', 'D♯ minor',
  'D minor', 'G minor', 'C minor', 'F minor', 'B♭ minor', 'E♭ minor',
]

function statusLabel(status: MidiStatus, inputNames: string[]): string {
  switch (status) {
    case 'idle':         return 'Requesting MIDI access…'
    case 'unsupported':  return 'Web MIDI is not supported in this browser'
    case 'denied':       return 'MIDI permission denied'
    case 'no-inputs':    return 'MIDI access granted · no inputs connected'
    case 'connected':    return `Connected · ${inputNames.join(', ')}`
  }
}

export default function HarmonyPage() {
  const { heldNotes, status, inputNames } = useMidiInput()
  const [currentKey, setCurrentKey] = useState<string>('C major')

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Programs
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '32px' }}>
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: '#7A7060', marginBottom: '10px',
          }}>
            Harmony Playground
          </p>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 300,
            fontSize: 'clamp(28px,4vw,44px)',
            color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em',
          }}>
            Play It and See It
          </h1>
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400,
            color: '#7A7060', maxWidth: '560px', lineHeight: 1.7,
          }}>
            Plug in a MIDI controller. As you play, the piano roll, grand staff,
            and chord readout will all update in real time. Pick a key to anchor
            scale-degree and Roman-numeral analysis.
          </p>
        </div>

        {/* Toolbar: key picker + MIDI status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
          padding: '14px 18px', marginBottom: '20px',
          background: 'var(--cream-card-strong)',
          border: '1px solid var(--brown-faint)',
          borderRadius: 14,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: F, fontSize: 11, fontWeight: 500,
              letterSpacing: '1.5px', textTransform: 'uppercase' as const,
              color: 'var(--brown-muted)',
            }}>
              Key
            </span>
            <select
              value={currentKey}
              onChange={e => setCurrentKey(e.target.value)}
              style={{
                fontFamily: SERIF, fontSize: 16, color: 'var(--ink)',
                background: 'var(--cream-key)',
                border: '1px solid var(--brown-faint)',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              }}
            >
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>

          <span aria-hidden="true" style={{ color: 'var(--brown-faint)' }}>·</span>

          <span style={{
            fontFamily: F, fontSize: 12,
            color: status === 'connected' ? 'var(--forest)' : '#7A7060',
          }}>
            {statusLabel(status, inputNames)}
          </span>
        </div>

        {/* Stub visualizations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PianoRoll   heldNotes={heldNotes} currentKey={currentKey} />
          <GrandStaff  heldNotes={heldNotes} currentKey={currentKey} />
          <ChordReadout heldNotes={heldNotes} currentKey={currentKey} />
        </div>

      </div>
    </div>
  )
}
