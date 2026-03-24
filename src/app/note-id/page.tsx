'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const CLEFS = [
  { id: 'treble', label: 'Treble Clef' },
  { id: 'bass', label: 'Bass Clef' },
  { id: 'grand', label: 'Grand Staff' },
]

const FREE_LEVELS = [
  { id: 'sight-read-treble-free', label: 'Treble — Free Range', clef: 'treble' },
  { id: 'sight-read-bass-free', label: 'Bass — Free Range', clef: 'bass' },
  { id: 'sight-read-grand-free', label: 'Grand Staff — Free Range', clef: 'grand' },
]

const PRO_LEVELS = [
  { id: 'sight-read-treble-1', label: 'Treble Level 1', clef: 'treble' },
  { id: 'sight-read-treble-2', label: 'Treble Level 2', clef: 'treble' },
  { id: 'sight-read-treble-3', label: 'Treble Level 3', clef: 'treble' },
  { id: 'sight-read-treble-4', label: 'Treble Level 4', clef: 'treble' },
  { id: 'sight-read-treble-5', label: 'Treble Level 5', clef: 'treble' },
  { id: 'sight-read-bass-1', label: 'Bass Level 1', clef: 'bass' },
  { id: 'sight-read-bass-2', label: 'Bass Level 2', clef: 'bass' },
  { id: 'sight-read-bass-3', label: 'Bass Level 3', clef: 'bass' },
  { id: 'sight-read-bass-4', label: 'Bass Level 4', clef: 'bass' },
  { id: 'sight-read-bass-5', label: 'Bass Level 5', clef: 'bass' },
  { id: 'sight-read-grand-1', label: 'Grand Level 1', clef: 'grand' },
  { id: 'sight-read-grand-2', label: 'Grand Level 2', clef: 'grand' },
  { id: 'sight-read-grand-3', label: 'Grand Level 3', clef: 'grand' },
  { id: 'sight-read-grand-4', label: 'Grand Level 4', clef: 'grand' },
  { id: 'sight-read-grand-5', label: 'Grand Level 5', clef: 'grand' },
]

export default function NoteIDPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()

  const [clef, setClef] = useState('treble')
  const [inputMode, setInputMode] = useState<'letters' | 'piano'>('letters')
  const [selectedLevel, setSelectedLevel] = useState('sight-read-treble-free')

  const filteredFree = FREE_LEVELS.filter(l => l.clef === clef)
  const filteredPro = PRO_LEVELS.filter(l => l.clef === clef)

  function start() {
    router.push('/note-id/' + selectedLevel + '?input=' + inputMode)
  }

  const s = {
    page: { minHeight: '100vh', background: '#F5F2EC' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' } as React.CSSProperties,
    back: { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' } as React.CSSProperties,
    title: { fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '22px', color: '#1A1A18', letterSpacing: '0.02em' } as React.CSSProperties,
    body: { maxWidth: '560px', margin: '0 auto', padding: '40px 32px 80px' } as React.CSSProperties,
    label: { fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px', display: 'block' },
    section: { marginBottom: '36px' } as React.CSSProperties,
    pillRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
    pill: (active: boolean) => ({
      padding: '8px 18px', borderRadius: '20px', border: '1px solid ' + (active ? '#1A1A18' : '#D3D1C7'),
      background: active ? '#1A1A18' : 'white', color: active ? 'white' : '#888780',
      fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300,
      cursor: 'pointer', transition: 'all 0.15s',
    }),
    levelBtn: (active: boolean, locked: boolean) => ({
      width: '100%', background: active ? '#1A1A18' : 'white',
      border: '1px solid ' + (active ? '#1A1A18' : '#D3D1C7'),
      borderRadius: '10px', padding: '14px 20px', textAlign: 'left' as const,
      cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'all 0.15s', marginBottom: '8px',
    }),
    levelLabel: (active: boolean) => ({
      fontFamily: 'var(--font-jost), sans-serif', fontSize: '14px', fontWeight: 300,
      color: active ? 'white' : '#1A1A18',
    }),
    startBtn: {
      width: '100%', background: '#1A1A18', color: 'white', border: 'none',
      borderRadius: '12px', padding: '16px', fontFamily: 'var(--font-jost), sans-serif',
      fontSize: '14px', fontWeight: 300, letterSpacing: '0.08em', cursor: 'pointer',
      marginTop: '8px',
    } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => router.push('/')} style={s.back}>← Back</button>
        <h1 style={s.title}>Note ID</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div style={s.body}>
        {/* Clef */}
        <div style={s.section}>
          <span style={s.label}>Clef</span>
          <div style={s.pillRow}>
            {CLEFS.map(c => (
              <button key={c.id} onClick={() => {
                setClef(c.id)
                const firstFree = FREE_LEVELS.find(l => l.clef === c.id)
                if (firstFree) setSelectedLevel(firstFree.id)
              }} style={s.pill(clef === c.id)}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Input mode */}
        <div style={s.section}>
          <span style={s.label}>Input Mode</span>
          <div style={s.pillRow}>
            <button onClick={() => setInputMode('letters')} style={s.pill(inputMode === 'letters')}>Letter Buttons</button>
            <button onClick={() => setInputMode('piano')} style={s.pill(inputMode === 'piano')}>Piano Keys</button>
          </div>
        </div>

        {/* Level */}
        <div style={s.section}>
          <span style={s.label}>Level</span>
          {filteredFree.map(l => (
            <button key={l.id} onClick={() => setSelectedLevel(l.id)} style={s.levelBtn(selectedLevel === l.id, false)}>
              <span style={s.levelLabel(selectedLevel === l.id)}>{l.label}</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: selectedLevel === l.id ? 'rgba(255,255,255,0.2)' : '#EDE8DF', color: selectedLevel === l.id ? 'white' : '#888780', fontFamily: 'var(--font-jost), sans-serif' }}>FREE</span>
            </button>
          ))}
          {filteredPro.map(l => {
            const locked = !isPro
            return (
              <button key={l.id} onClick={() => !locked && setSelectedLevel(l.id)} style={s.levelBtn(selectedLevel === l.id, locked)}>
                <span style={s.levelLabel(selectedLevel === l.id)}>{l.label}</span>
                {locked ? <span style={{ fontSize: '14px', color: '#D3D1C7' }}>🔒</span>
                  : <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: selectedLevel === l.id ? 'rgba(255,255,255,0.2)' : '#FAEEDA', color: selectedLevel === l.id ? 'white' : '#BA7517', fontFamily: 'var(--font-jost), sans-serif' }}>PRO</span>}
              </button>
            )
          })}
        </div>

        <button onClick={start} style={s.startBtn}>Start →</button>
      </div>
    </div>
  )
}
