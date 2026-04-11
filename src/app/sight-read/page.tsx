'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SlidingPills from '@/components/SlidingPills'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

type Clef = 'treble' | 'bass' | 'grand'

const LEVELS: Record<Clef, { id: string; label: string; desc: string }[]> = {
  treble: [
    { id: 'sight-read-treble-free', label: 'Starter',   desc: 'C4 to F5 — full staff' },
    { id: 'sight-read-treble-1',    label: 'Level 1',   desc: 'C4 and G4 — two anchors' },
    { id: 'sight-read-treble-2',    label: 'Level 2',   desc: 'C4 through G4 — five notes' },
    { id: 'sight-read-treble-3',    label: 'Level 3',   desc: 'C4 through C5 — one octave' },
    { id: 'sight-read-treble-4',    label: 'Level 4',   desc: 'C4 through A5 — extended' },
    { id: 'sight-read-treble-5',    label: 'Level 5',   desc: 'A3 through C6 — full range' },
    { id: 'sight-read-treble-6',    label: 'Level 6',   desc: 'C4–G4 with sharps & flats' },
    { id: 'sight-read-treble-7',    label: 'Level 7',   desc: 'C4–C5 with sharps & flats' },
    { id: 'sight-read-treble-8',    label: 'Level 8',   desc: 'C4–A5 with sharps & flats' },
    { id: 'sight-read-treble-9',    label: 'Level 9',   desc: 'A3–C6 with sharps & flats' },
    { id: 'sight-read-treble-10',   label: 'Level 10',  desc: 'F3 to E6 — full chromatic' },
  ],
  bass: [
    { id: 'sight-read-bass-free',   label: 'Starter',   desc: 'G2 to C4 — full staff' },
    { id: 'sight-read-bass-1',      label: 'Level 1',   desc: 'C4 and F3 — two anchors' },
    { id: 'sight-read-bass-2',      label: 'Level 2',   desc: 'C4 through F3 — five notes' },
    { id: 'sight-read-bass-3',      label: 'Level 3',   desc: 'C4 through C3 — one octave' },
    { id: 'sight-read-bass-4',      label: 'Level 4',   desc: 'C4 through E2 — extended' },
    { id: 'sight-read-bass-5',      label: 'Level 5',   desc: 'E4 through C2 — full range' },
    { id: 'sight-read-bass-6',      label: 'Level 6',   desc: 'C4–F3 with sharps & flats' },
    { id: 'sight-read-bass-7',      label: 'Level 7',   desc: 'C4–C3 with sharps & flats' },
    { id: 'sight-read-bass-8',      label: 'Level 8',   desc: 'C4–E2 with sharps & flats' },
    { id: 'sight-read-bass-9',      label: 'Level 9',   desc: 'E4–C2 with sharps & flats' },
    { id: 'sight-read-bass-10',     label: 'Level 10',  desc: 'G4 to A1 — full chromatic' },
  ],
  grand: [
    { id: 'sight-read-grand-free',  label: 'Starter',   desc: 'F3, Middle C, G4 — landmarks' },
    { id: 'sight-read-grand-1',     label: 'Level 1',   desc: 'Anchor notes across both staves' },
    { id: 'sight-read-grand-2',     label: 'Level 2',   desc: 'C3–C5 — one octave each way' },
    { id: 'sight-read-grand-3',     label: 'Level 3',   desc: 'F2 through G5 — extended' },
    { id: 'sight-read-grand-4',     label: 'Level 4',   desc: 'C2 through C6 — full range' },
    { id: 'sight-read-grand-5',     label: 'Level 5',   desc: 'C2–C6 — all natural notes' },
    { id: 'sight-read-grand-6',     label: 'Level 6',   desc: 'C3–C5 with sharps & flats' },
    { id: 'sight-read-grand-7',     label: 'Level 7',   desc: 'F2–G5 with sharps & flats' },
    { id: 'sight-read-grand-8',     label: 'Level 8',   desc: 'C2–C6 with sharps & flats' },
    { id: 'sight-read-grand-9',     label: 'Level 9',   desc: 'C2–C6 — extended chromatic' },
    { id: 'sight-read-grand-10',    label: 'Level 10',  desc: 'Full chromatic grand staff' },
  ],
}

export default function SightReadPage() {
  const router = useRouter()
  const [clef, setClef] = useState<Clef>('treble')
  const levels = LEVELS[clef]


  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 80px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', padding: 0, marginBottom: '28px', display: 'block' }}>← Back</button>

        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#F7F4EF', marginBottom: '6px' }}>Staff Recognition</h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', margin: '0 0 28px', lineHeight: 1.6 }}>
          A note appears on the staff — play it on your piano before the next one arrives. Progress through levels to build speed and range.
        </p>

        {/* Clef selector */}
        <div style={{ background: '#353330', borderRadius: '16px', border: '1px solid #484542', padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#C4C0B8', margin: '0 0 10px' }}>Clef</p>
          <SlidingPills
            options={(['treble', 'bass', 'grand'] as Clef[]).map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
            value={clef}
            onChange={setClef}
          />
        </div>

        {/* Levels grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {levels.map(l => (
            <button key={l.id} onClick={() => router.push('/study/' + l.id)}
              style={{
                background: '#353330', border: '1px solid #484542', borderRadius: '12px',
                padding: '14px 16px', cursor: 'pointer',
                textAlign: 'left' as const, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#484542' }}
            >
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#F7F4EF', margin: '0 0 3px' }}>{l.label}</p>
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#C4C0B8', margin: 0 }}>{l.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
