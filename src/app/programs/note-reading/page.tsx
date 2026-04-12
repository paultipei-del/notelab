'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  loadNRProgress,
  isNRModuleUnlocked,
  nrConsecutivePassing,
  type NRProgressStore,
} from '@/lib/programs/note-reading/progress'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

function ClefBadge({ clef }: { clef: 'treble' | 'bass' | 'grand' }) {
  const label = clef === 'grand' ? 'Grand' : clef === 'treble' ? 'Treble' : 'Bass'
  return (
    <span style={{
      fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400,
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      padding: '2px 8px', borderRadius: '20px',
      background: '#EDE8DF', color: '#7A7060',
    }}>
      {label}
    </span>
  )
}

function ToolBadge({ tool }: { tool: 'identify' | 'play' }) {
  return (
    <span style={{
      fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400,
      letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: '20px',
      background: tool === 'play' ? '#1A1A18' : '#EDE8DF',
      color: tool === 'play' ? 'white' : '#7A7060',
    }}>
      {tool === 'identify' ? 'Identify' : 'Play It'}
    </span>
  )
}

export default function NoteReadingPage() {
  const [store, setStore] = useState<NRProgressStore>({})

  useEffect(() => {
    setStore(loadNRProgress())
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Programs
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            Note Reading Program
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px,4vw,44px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
            From First Notes to Full Fluency
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#7A7060', maxWidth: '520px', lineHeight: 1.7 }}>
            Eight modules — treble, bass, and grand staff — built for college music students and serious adult learners. Each module pairs note identification with pitch detection to build both cognitive recognition and motor response.
          </p>
        </div>

        {/* Module list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {NOTE_READING_MODULES.map((mod, idx) => {
            const unlocked = isNRModuleUnlocked(mod.id, store)
            const mp = store[mod.id]
            const identifyPassing = nrConsecutivePassing(mod.id, 'identify', store)
            const playPassing = nrConsecutivePassing(mod.id, 'play', store)
            const identifyMastered = mp?.identify?.mastered ?? false
            const playMastered = mp?.play?.mastered ?? false
            const completed = mp?.completed ?? false

            const statusDot = completed
              ? <span style={{ color: '#3B6D11', fontSize: '11px' }}>✓</span>
              : unlocked && (mp?.identify?.sessions.length || mp?.play?.sessions.length)
              ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B5402A', display: 'inline-block', verticalAlign: 'middle' }} />
              : null

            const progressText = (() => {
              if (completed) return 'Complete'
              if (mod.comingSoon) return ''
              const parts: string[] = []
              if (mod.tools.includes('identify')) {
                parts.push(identifyMastered ? 'Identify ✓' : `Identify ${identifyPassing}/${mod.criteria.sessions}`)
              }
              if (mod.tools.includes('play')) {
                parts.push(identifyMastered || !mod.tools.includes('identify')
                  ? (playMastered ? 'Play ✓' : `Play ${playPassing}/${mod.criteria.sessions}`)
                  : 'Play 🔒'
                )
              }
              return mp ? parts.join(' · ') : ''
            })()

            if (mod.comingSoon) {
              return (
                <div key={mod.id} style={{
                  background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px',
                  padding: '18px 20px', opacity: 0.55,
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4' }}>{idx + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: '#B0ACA4', margin: 0 }}>{mod.title}</p>
                      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#DDD8CA', letterSpacing: '0.06em' }}>Coming Soon</span>
                    </div>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', margin: 0 }}>{mod.subtitle}</p>
                  </div>
                </div>
              )
            }

            if (!unlocked) {
              return (
                <div key={mod.id} style={{
                  background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px',
                  padding: '18px 20px', opacity: 0.5,
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4' }}>{idx + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: '#B0ACA4', margin: '0 0 4px' }}>{mod.title}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <ClefBadge clef={mod.clef} />
                      {mod.tools.map(t => <ToolBadge key={t} tool={t} />)}
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', flexShrink: 0 }}>🔒</span>
                </div>
              )
            }

            return (
              <Link key={mod.id} href={`/programs/note-reading/${mod.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: completed ? '#F7F4ED' : 'white',
                    border: `1px solid ${completed ? '#C8C4BA' : '#DDD8CA'}`,
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = completed ? '#C8C4BA' : '#DDD8CA' }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: completed ? '#3B6D11' : '#1A1A18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {completed
                      ? <span style={{ color: 'white', fontSize: '12px', fontWeight: 400 }}>✓</span>
                      : <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: 'white' }}>{idx + 1}</span>
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: '#2A2318', margin: 0 }}>{mod.title}</p>
                      {statusDot}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <ClefBadge clef={mod.clef} />
                      {mod.tools.map(t => <ToolBadge key={t} tool={t} />)}
                      {progressText && (
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', marginLeft: '2px' }}>
                          {progressText}
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}
