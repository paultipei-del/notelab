'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

// ── Types ──────────────────────────────────────────────────────────────────
type Clef = 'treble' | 'bass' | 'grand'
type NoteFilter = 'lines' | 'spaces' | 'ledger'
type InputMode = 'letters' | 'keyboard' | 'keyboard-full'
type StopMode = 'exercises' | 'minutes'

interface Config {
  clef: Clef
  noteFilters: NoteFilter[]
  useAccidentals: boolean
  playCorrectNotes: boolean
  inputMode: InputMode
  groupSize: number
  stopMode: StopMode
  stopValue: number
  stopMinutes: number
}

const DEFAULT_CONFIG: Config = {
  clef: 'treble',
  noteFilters: ['lines', 'spaces'],
  useAccidentals: false,
  playCorrectNotes: false,
  inputMode: 'letters',
  groupSize: 1,
  stopMode: 'exercises',
  stopValue: 5,
  stopMinutes: 5,
}

// ── Quick Start Levels ─────────────────────────────────────────────────────
const QUICK_START = [
  { id: 'sight-read-treble-free', label: 'Free', desc: 'C4–G4 anchor notes', clef: 'treble', pro: false },
  { id: 'sight-read-treble-1', label: 'Level 1', desc: 'C4–G4 + ledger lines', clef: 'treble', pro: true },
  { id: 'sight-read-treble-2', label: 'Level 2', desc: 'Full treble staff', clef: 'treble', pro: true },
  { id: 'sight-read-treble-3', label: 'Level 3', desc: 'With sharps & flats', clef: 'treble', pro: true },
  { id: 'sight-read-treble-4', label: 'Level 4', desc: 'Extended range', clef: 'treble', pro: true },
  { id: 'sight-read-treble-5', label: 'Level 5', desc: 'Full chromatic', clef: 'treble', pro: true },
  { id: 'sight-read-bass-free', label: 'Free', desc: 'F3–C4 anchor notes', clef: 'bass', pro: false },
  { id: 'sight-read-bass-1', label: 'Level 1', desc: 'F3–C4 + ledger lines', clef: 'bass', pro: true },
  { id: 'sight-read-bass-2', label: 'Level 2', desc: 'Full bass staff', clef: 'bass', pro: true },
  { id: 'sight-read-bass-3', label: 'Level 3', desc: 'With sharps & flats', clef: 'bass', pro: true },
  { id: 'sight-read-bass-4', label: 'Level 4', desc: 'Extended range', clef: 'bass', pro: true },
  { id: 'sight-read-bass-5', label: 'Level 5', desc: 'Full chromatic', clef: 'bass', pro: true },
  { id: 'sight-read-grand-free', label: 'Free', desc: 'Both clefs, anchor notes', clef: 'grand', pro: false },
  { id: 'sight-read-grand-1', label: 'Level 1', desc: 'Grand staff basics', clef: 'grand', pro: true },
  { id: 'sight-read-grand-2', label: 'Level 2', desc: 'Expanded range', clef: 'grand', pro: true },
  { id: 'sight-read-grand-3', label: 'Level 3', desc: 'Full grand staff', clef: 'grand', pro: true },
]

// ── Clef SVGs ──────────────────────────────────────────────────────────────


// ── Styles ─────────────────────────────────────────────────────────────────
const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

function label(text: string) {
  return (
    <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>
      {text}
    </p>
  )
}

function Section({ children, last }: { children: React.ReactNode, last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : '32px' }}>
      {children}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function NoteIDPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)

  function set<K extends keyof Config>(key: K, value: Config[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function toggleFilter(f: NoteFilter) {
    setConfig(prev => ({
      ...prev,
      noteFilters: prev.noteFilters.includes(f)
        ? prev.noteFilters.filter(x => x !== f)
        : [...prev.noteFilters, f],
    }))
  }

  function startCustom() {
    const params = new URLSearchParams({
      input: config.inputMode,
      clef: config.clef,
      filters: config.noteFilters.join(','),
      accidentals: config.useAccidentals ? '1' : '0',
      playCorrect: config.playCorrectNotes ? '1' : '0',
      group: config.groupSize.toString(),
      stopMode: config.stopMode,
      stopValue: (config.stopMode === 'minutes' ? (config.stopMinutes ?? 5) : config.stopValue).toString(),
    })
    router.push('/note-id/custom?' + params.toString())
  }

  function startQuick(levelId: string) {
    router.push('/note-id/' + levelId + '?input=' + config.inputMode)
  }

  const pill = (active: boolean, locked = false) => ({
    padding: '8px 16px', borderRadius: '20px',
    border: '1px solid ' + (active ? '#1A1A18' : '#D3D1C7'),
    background: active ? '#1A1A18' : 'white',
    color: active ? 'white' : locked ? '#D3D1C7' : '#888780',
    fontFamily: F, fontSize: '13px', fontWeight: 300,
    cursor: locked ? 'default' : 'pointer', transition: 'all 0.15s',
    opacity: locked ? 0.5 : 1,
  } as React.CSSProperties)

  const clefBtn = (active: boolean) => ({
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    justifyContent: 'center', gap: '6px',
    width: '80px', height: '80px', borderRadius: '12px',
    border: '1px solid ' + (active ? '#1A1A18' : '#D3D1C7'),
    background: active ? '#1A1A18' : 'white',
    cursor: 'pointer', transition: 'all 0.15s',
  } as React.CSSProperties)

  const clefLabel = (active: boolean) => ({
    fontFamily: F, fontSize: '11px', fontWeight: 300,
    color: active ? 'white' : '#888780', letterSpacing: '0.04em',
  })

  const filteredQuick = QUICK_START.filter(l => l.clef === config.clef)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '22px', color: '#1A1A18', letterSpacing: '0.02em' }}>Note ID</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* ── Quick Start ── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '14px' }}>Quick Start</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
            {filteredQuick.map(l => {
              const locked = l.pro && !isPro
              return (
                <button key={l.id} onClick={() => !locked && startQuick(l.id)}
                  style={{
                    background: locked ? '#FAFAF8' : 'white',
                    border: '1px solid #D3D1C7', borderRadius: '10px',
                    padding: '10px 14px', cursor: locked ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: '2px',
                    transition: 'all 0.15s', minWidth: '90px',
                  }}
                  onMouseEnter={e => { if (!locked) { e.currentTarget.style.borderColor = '#1A1A18' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7' }}
                >
                  <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: locked ? '#D3D1C7' : '#1A1A18', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {locked && <span style={{ fontSize: '10px' }}>🔒</span>}{l.label}
                  </span>
                  <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 300, color: locked ? '#D3D1C7' : '#888780' }}>{l.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Custom Config ── */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #D3D1C7', padding: '32px', marginBottom: '40px', boxShadow: '0 2px 12px rgba(26,26,24,0.06)' }}>
          <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#1A1A18', marginBottom: '28px' }}>Custom Session</p>

          {/* Clef */}
          <Section>
            {label('Clef')}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => set('clef', 'treble')} style={clefBtn(config.clef === 'treble')}>
                <span style={clefLabel(config.clef === 'treble')}>Treble</span>
              </button>
              <button onClick={() => set('clef', 'bass')} style={clefBtn(config.clef === 'bass')}>
                <span style={clefLabel(config.clef === 'bass')}>Bass</span>
              </button>
              <button onClick={() => set('clef', 'grand')} style={clefBtn(config.clef === 'grand')}>
                <span style={clefLabel(config.clef === 'grand')}>Grand</span>
              </button>
            </div>
          </Section>

          {/* Use notes over */}
          <Section>
            {label('Note types')}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {(['lines', 'spaces', 'ledger'] as NoteFilter[]).map(f => (
                <button key={f} onClick={() => toggleFilter(f)} style={pill(config.noteFilters.includes(f))}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <button onClick={() => set('useAccidentals', !config.useAccidentals)} style={pill(config.useAccidentals)}>
                Accidentals
              </button>
              <button onClick={() => set('playCorrectNotes', !config.playCorrectNotes)} style={pill(config.playCorrectNotes)}>
                Play Correct Notes
              </button>
            </div>
          </Section>

          {/* Answer with */}
          <Section>
            {label('Input method')}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {([
                { id: 'letters', label: 'Letter Keys' },
                { id: 'keyboard', label: 'Mini Piano' },
                { id: 'keyboard-full', label: 'Full Keyboard' },
              ] as { id: InputMode; label: string }[]).map(m => (
                <button key={m.id} onClick={() => set('inputMode', m.id)} style={pill(config.inputMode === m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Notes in group */}
          <Section>
            {label('Notes per group')}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' as const }}>
              <button onClick={() => set('groupSize', 1)} style={pill(config.groupSize === 1)}>Single Note</button>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <button onClick={() => set('groupSize', config.groupSize < 4 ? 4 : config.groupSize)} style={pill(config.groupSize >= 4)}>Multiple Notes</button>
                {config.groupSize >= 4 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => set('groupSize', Math.max(4, config.groupSize - 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #D3D1C7', background: 'white', cursor: 'pointer', fontSize: '16px', color: '#1A1A18' }}>−</button>
                    <span style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: '#1A1A18', minWidth: '24px', textAlign: 'center' as const }}>{config.groupSize}</span>
                    <button onClick={() => set('groupSize', Math.min(10, config.groupSize + 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #D3D1C7', background: 'white', cursor: 'pointer', fontSize: '16px', color: '#1A1A18' }}>+</button>
                    <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>notes</span>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Stop after */}
          <Section>
            {label('Stop after')}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
              {/* Rounds dial */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <button onClick={() => set('stopMode', 'exercises')} style={pill(config.stopMode === 'exercises')}>
                  Rounds
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => set('stopValue', Math.max(1, config.stopValue - 1))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #D3D1C7', background: 'white', cursor: 'pointer', fontSize: '16px', color: config.stopMode === 'exercises' ? '#1A1A18' : '#D3D1C7' }}>−</button>
                  <span style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: config.stopMode === 'exercises' ? '#1A1A18' : '#D3D1C7', minWidth: '32px', textAlign: 'center' as const }}>
                    {config.stopValue}
                  </span>
                  <button onClick={() => set('stopValue', Math.min(100, config.stopValue + 1))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #D3D1C7', background: 'white', cursor: 'pointer', fontSize: '16px', color: config.stopMode === 'exercises' ? '#1A1A18' : '#D3D1C7' }}>+</button>
                </div>
              </div>
              {/* Minutes dial */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                <button onClick={() => set('stopMode', 'minutes')} style={pill(config.stopMode === 'minutes')}>
                  Minutes
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => set('stopMinutes', Math.max(1, (config.stopMinutes ?? 5) - 1))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #D3D1C7', background: 'white', cursor: 'pointer', fontSize: '16px', color: config.stopMode === 'minutes' ? '#1A1A18' : '#D3D1C7' }}>−</button>
                  <span style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: config.stopMode === 'minutes' ? '#1A1A18' : '#D3D1C7', minWidth: '32px', textAlign: 'center' as const }}>
                    {config.stopMinutes ?? 5}
                  </span>
                  <button onClick={() => set('stopMinutes', Math.min(60, (config.stopMinutes ?? 5) + 1))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #D3D1C7', background: 'white', cursor: 'pointer', fontSize: '16px', color: config.stopMode === 'minutes' ? '#1A1A18' : '#D3D1C7' }}>+</button>
                </div>
              </div>
            </div>
          </Section>

          <button onClick={startCustom} style={{
            marginTop: '28px', width: '100%', background: '#1A1A18', color: 'white',
            border: 'none', borderRadius: '12px', padding: '16px',
            fontFamily: F, fontSize: '14px', fontWeight: 300,
            letterSpacing: '0.08em', cursor: 'pointer',
          }}>
            Start Custom Session →
          </button>
        </div>



      </div>
    </div>
  )
}
