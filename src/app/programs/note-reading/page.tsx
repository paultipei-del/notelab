'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  loadNRProgress,
  isNRModuleUnlocked,
  nrConsecutivePassing,
  computeRetentionSummary,
  type NRProgressStore,
  type RetentionSummary,
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

function RetentionRing({ pct }: { pct: number }) {
  const size = 56
  const stroke = 5
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.max(0, Math.min(100, pct)) / 100)
  // Color sweeps from burgundy at 0% to green at 100% via an amber midpoint.
  const color = pct >= 90 ? '#3B6D11' : pct >= 70 ? '#B5402A' : '#A32D2D'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDE8DF" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontFamily="var(--font-cormorant), serif"
        fontSize="16"
        fontWeight={400}
        fill="#2A2318"
      >
        {pct}
      </text>
    </svg>
  )
}

function ToolBadge({ tool }: { tool: 'identify' | 'locate' | 'play' }) {
  const label = tool === 'identify' ? 'Identify' : tool === 'locate' ? 'Locate' : 'Play It'
  const dark = tool === 'play'
  return (
    <span style={{
      fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400,
      letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: '20px',
      background: dark ? '#1A1A18' : '#EDE8DF',
      color: dark ? 'white' : '#7A7060',
    }}>
      {label}
    </span>
  )
}

export default function NoteReadingPage() {
  const [store, setStore] = useState<NRProgressStore>({})
  const [retention, setRetention] = useState<RetentionSummary | null>(null)

  useEffect(() => {
    setStore(loadNRProgress())
    setRetention(computeRetentionSummary())
  }, [])

  const anyModuleCompleted = NOTE_READING_MODULES.some(m => store[m.id]?.completed === true)

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
            Nine modules — single-pitch recognition through intervallic and rhythmic reading — built for college music students and serious adult learners. Each module pairs note identification with pitch detection to build both cognitive recognition and motor response.
          </p>
        </div>

        {/* Retention indicator — appears once a module is completed and the
            learner has started seeing review questions in later sessions.
            Accuracy reflects how well past-module notes are holding up. */}
        {anyModuleCompleted && retention && retention.totalAnswered > 0 && (
          <div style={{ marginBottom: '32px', padding: '16px 20px', background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <RetentionRing pct={Math.round((retention.recent30Accuracy || retention.accuracy) * 100)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 4px' }}>
                Note-reading retention
              </p>
              <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400, color: '#2A2318', margin: '0 0 2px', lineHeight: 1.2 }}>
                {Math.round((retention.recent30Accuracy || retention.accuracy) * 100)}% on review questions
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                {retention.totalAnswered < 30
                  ? `${retention.totalCorrect} of ${retention.totalAnswered} correct so far · drawn from modules you've completed`
                  : `Rolling last 30 answers · ${retention.totalCorrect} of ${retention.totalAnswered} lifetime`}
              </p>
            </div>
          </div>
        )}

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
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', margin: '0 0 6px', lineHeight: 1.5 }}>
                      {mod.subtitle} · {[...new Set(mod.notes)].length} notes
                    </p>
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
                    {/* One-line scope description — uses the module's subtitle
                        so it stays authoritative. Paired with the unique-note
                        pool count so the scope is legible at a glance. */}
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: '0 0 6px', lineHeight: 1.5 }}>
                      {mod.subtitle} · {[...new Set(mod.notes)].length} notes
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <ClefBadge clef={mod.clef} />
                      {mod.tools.map(t => <ToolBadge key={t} tool={t} />)}
                      {progressText && (
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', marginLeft: '2px' }}>
                          {progressText}
                        </span>
                      )}
                      {/* Per-module retention — only meaningful after the
                          student has started seeing review questions drawn
                          from this module. */}
                      {(() => {
                        const modRet = retention?.byModule[mod.id]
                        if (!modRet || modRet.answered === 0) return null
                        const pct = Math.round((modRet.correct / modRet.answered) * 100)
                        return (
                          <span style={{
                            fontFamily: F, fontSize: 'var(--nl-text-badge)',
                            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                            padding: '2px 7px', borderRadius: '20px',
                            background: pct >= 90 ? 'rgba(59,109,17,0.12)' : pct >= 70 ? 'rgba(181,64,42,0.10)' : 'rgba(163,45,45,0.12)',
                            color: pct >= 90 ? '#3B6D11' : pct >= 70 ? '#B5402A' : '#A32D2D',
                          }}>
                            {pct}% retention
                          </span>
                        )
                      })()}
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
