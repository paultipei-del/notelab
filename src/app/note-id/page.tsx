'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import SlidingPills from '@/components/SlidingPills'

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

const GUIDED_LEVELS = [
  { id: 'sight-read-treble-free', label: 'Level 1', desc: 'C4–G4 anchor notes',   clef: 'treble', pro: false },
  { id: 'sight-read-treble-1',    label: 'Level 2', desc: 'C4–G4 + ledger lines', clef: 'treble', pro: false },
  { id: 'sight-read-treble-2',    label: 'Level 3', desc: 'Full treble staff',     clef: 'treble', pro: false },
  { id: 'sight-read-treble-3',    label: 'Level 4', desc: 'With sharps & flats',   clef: 'treble', pro: false },
  { id: 'sight-read-treble-4',    label: 'Level 5', desc: 'Extended range',        clef: 'treble', pro: false },
  { id: 'sight-read-treble-5',    label: 'Level 6', desc: 'Full chromatic',        clef: 'treble', pro: false },
  { id: 'sight-read-bass-free',   label: 'Level 1', desc: 'F3–C4 anchor notes',   clef: 'bass',   pro: false },
  { id: 'sight-read-bass-1',      label: 'Level 2', desc: 'F3–C4 + ledger lines', clef: 'bass',   pro: false },
  { id: 'sight-read-bass-2',      label: 'Level 3', desc: 'Full bass staff',       clef: 'bass',   pro: false },
  { id: 'sight-read-bass-3',      label: 'Level 4', desc: 'With sharps & flats',   clef: 'bass',   pro: false },
  { id: 'sight-read-bass-4',      label: 'Level 5', desc: 'Extended range',        clef: 'bass',   pro: false },
  { id: 'sight-read-bass-5',      label: 'Level 6', desc: 'Full chromatic',        clef: 'bass',   pro: false },
  { id: 'sight-read-grand-free',  label: 'Level 1', desc: 'Both clefs, anchors',   clef: 'grand',  pro: false },
  { id: 'sight-read-grand-1',     label: 'Level 2', desc: 'Grand staff basics',    clef: 'grand',  pro: false },
  { id: 'sight-read-grand-2',     label: 'Level 3', desc: 'Expanded range',        clef: 'grand',  pro: false },
  { id: 'sight-read-grand-3',     label: 'Level 4', desc: 'Full grand staff',      clef: 'grand',  pro: false },
]

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function NoteIDPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [showCustom, setShowCustom] = useState(false)

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
      stopValue: (config.stopMode === 'minutes' ? config.stopMinutes : config.stopValue).toString(),
    })
    router.push('/note-id/custom?' + params.toString())
  }

  function startGuided(levelId: string) {
    router.push('/note-id/' + levelId + '?input=' + config.inputMode)
  }

  const levels = GUIDED_LEVELS.filter(l => l.clef === config.clef)

  // ── style helpers ──

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: '20px',
    border: '1px solid ' + (active ? '#1A1A18' : '#484542'),
    background: active ? '#1A1A18' : 'white',
    color: active ? 'white' : '#C4C0B8',
    fontFamily: F, fontSize: '13px', fontWeight: 300,
    cursor: 'pointer', transition: 'all 0.15s',
  })

  const stepBtn: React.CSSProperties = {
    width: '30px', height: '30px', borderRadius: '8px',
    border: '1px solid #484542', background: '#353330',
    cursor: 'pointer', fontSize: '16px', color: '#F7F4EF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  const sectionLabel = (text: string) => (
    <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#C4C0B8', margin: '0 0 10px' }}>{text}</p>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>

      {/* Page header */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 0' }}>
        <button onClick={() => router.push('/tools')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', padding: 0, marginBottom: '24px', display: 'block' }}>← Back</button>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#F7F4EF', marginBottom: '6px' }}>Note Identification</h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', margin: '0 0 32px', lineHeight: 1.6 }}>
          A note appears on the staff. Name it before the next one arrives. Choose your clef, pick a level, and answer with letter keys or a piano.
        </p>

        {/* ── Shared settings bar ── */}
        <div style={{ background: '#353330', borderRadius: '16px', border: '1px solid #484542', padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' as const, alignItems: 'flex-start' }}>

            {/* Clef */}
            <div>
              {sectionLabel('Clef')}
              <SlidingPills
                options={(['treble', 'bass', 'grand'] as Clef[]).map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                value={config.clef}
                onChange={v => set('clef', v)}
              />
            </div>

            {/* Input method */}
            <div>
              {sectionLabel('Answer with')}
              <SlidingPills
                options={[
                  { value: 'letters' as InputMode, label: 'Letters' },
                  { value: 'keyboard' as InputMode, label: 'Mini Piano' },
                  { value: 'keyboard-full' as InputMode, label: 'Full Piano' },
                ]}
                value={config.inputMode}
                onChange={v => set('inputMode', v)}
              />
            </div>
          </div>
        </div>

        {/* ── Guided levels ── */}
        <div style={{ marginBottom: '24px' }}>
          {sectionLabel('Guided Levels')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {levels.map(l => (
              <button key={l.id} onClick={() => startGuided(l.id)}
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

        {/* ── Custom session ── */}
        <div style={{ marginBottom: '80px' }}>
          <button
            onClick={() => setShowCustom(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderRadius: showCustom ? '16px 16px 0 0' : '16px',
              border: '1px solid #484542', borderBottom: showCustom ? 'none' : '1px solid #484542',
              background: '#353330', cursor: 'pointer', textAlign: 'left' as const,
            }}
          >
            <span style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 300, color: '#F7F4EF' }}>Custom Session</span>
            <span style={{ fontFamily: F, fontSize: '12px', color: '#C4C0B8' }}>{showCustom ? '▲' : '▼'}</span>
          </button>

          {showCustom && (
            <div style={{ border: '1px solid #484542', borderTop: 'none', borderRadius: '0 0 16px 16px', background: '#353330', padding: '24px 24px 28px' }}>

              {/* Note types */}
              <div style={{ marginBottom: '24px' }}>
                {sectionLabel('Note types')}
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
              </div>

              {/* Notes per group */}
              <div style={{ marginBottom: '24px' }}>
                {sectionLabel('Notes per group')}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => set('groupSize', 1)} style={pill(config.groupSize === 1)}>Single</button>
                  <button onClick={() => set('groupSize', config.groupSize < 4 ? 4 : config.groupSize)} style={pill(config.groupSize >= 4)}>Multiple</button>
                  {config.groupSize >= 4 && (
                    <>
                      <button onClick={() => set('groupSize', Math.max(4, config.groupSize - 1))} style={stepBtn}>−</button>
                      <span style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#F7F4EF', minWidth: '24px', textAlign: 'center' as const }}>{config.groupSize}</span>
                      <button onClick={() => set('groupSize', Math.min(10, config.groupSize + 1))} style={stepBtn}>+</button>
                    </>
                  )}
                </div>
              </div>

              {/* Stop after */}
              <div style={{ marginBottom: '28px' }}>
                {sectionLabel('Stop after')}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                  <button onClick={() => set('stopMode', 'exercises')} style={pill(config.stopMode === 'exercises')}>Rounds</button>
                  <button onClick={() => set('stopMode', 'minutes')} style={pill(config.stopMode === 'minutes')}>Minutes</button>
                  <button onClick={() => {
                    const key = config.stopMode === 'exercises' ? 'stopValue' : 'stopMinutes'
                    const val = config.stopMode === 'exercises' ? config.stopValue : config.stopMinutes
                    set(key, Math.max(1, val - 1))
                  }} style={stepBtn}>−</button>
                  <span style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#F7F4EF', minWidth: '28px', textAlign: 'center' as const }}>
                    {config.stopMode === 'exercises' ? config.stopValue : config.stopMinutes}
                  </span>
                  <button onClick={() => {
                    const key = config.stopMode === 'exercises' ? 'stopValue' : 'stopMinutes'
                    const val = config.stopMode === 'exercises' ? config.stopValue : config.stopMinutes
                    set(key, Math.min(config.stopMode === 'exercises' ? 100 : 60, val + 1))
                  }} style={stepBtn}>+</button>
                  <span style={{ fontFamily: F, fontSize: '12px', color: '#C4C0B8' }}>
                    {config.stopMode === 'exercises' ? 'rounds' : 'min'}
                  </span>
                </div>
              </div>

              <button onClick={startCustom} style={{
                width: '100%', background: '#1A1A18', color: 'white',
                border: 'none', borderRadius: '12px', padding: '14px',
                fontFamily: F, fontSize: '13px', fontWeight: 300,
                letterSpacing: '0.06em', cursor: 'pointer',
              }}>
                Start Custom Session →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
