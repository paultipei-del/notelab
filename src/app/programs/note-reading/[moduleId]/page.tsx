'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule } from '@/lib/programs/note-reading/modules'
import {
  getNRModuleProgress,
  isNRModuleUnlocked,
  isNRPlayUnlocked,
  nrConsecutivePassing,
  loadNRProgress,
} from '@/lib/programs/note-reading/progress'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { params: Promise<{ moduleId: string }> }

export default function ModuleOverviewPage({ params }: Props) {
  const { moduleId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()

  const mod = getNRModule(moduleId)
  const [mp, setMp] = useState(getNRModuleProgress(moduleId))
  const [store, setStore] = useState(loadNRProgress())

  useEffect(() => {
    const s = loadNRProgress()
    setStore(s)
    setMp(s[moduleId] ?? { identify: { sessions: [], mastered: false }, play: { sessions: [], mastered: false }, completed: false })
  }, [moduleId])

  if (!mod) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Module not found.</p>
      </div>
    )
  }

  if (!isNRModuleUnlocked(moduleId, store)) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '16px' }}>Locked</p>
          <h2 style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#2A2318', marginBottom: '12px' }}>{mod.title}</h2>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', color: '#7A7060', lineHeight: 1.6, marginBottom: '28px' }}>
            Complete {mod.unlockAfter.join(' and ')} first to unlock this module.
          </p>
          <Link href="/programs/note-reading" style={{ textDecoration: 'none' }}>
            <span style={{ display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-meta)', background: '#1A1A18', color: 'white', borderRadius: '10px', padding: '12px 28px', cursor: 'pointer' }}>
              ← Back to program
            </span>
          </Link>
        </div>
      </div>
    )
  }

  const hasIdentify = mod.tools.includes('identify')
  const hasPlay = mod.tools.includes('play')
  const playUnlocked = isNRPlayUnlocked(moduleId, store)
  const identifyPassing = nrConsecutivePassing(moduleId, 'identify', store)
  const playPassing = nrConsecutivePassing(moduleId, 'play', store)
  const isModuleFree = moduleId === 'landmarks'

  function handleStart(tool: 'identify' | 'play') {
    if (!isModuleFree && !isPro) {
      router.push('/account')
      return
    }
    router.push(`/programs/note-reading/${moduleId}/${tool}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs/note-reading" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Note Reading
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '36px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
            {mod.clef === 'grand' ? 'Grand Staff' : mod.clef === 'treble' ? 'Treble Clef' : 'Bass Clef'}
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(26px,3.5vw,38px)', color: '#2A2318', marginBottom: '12px' }}>
            {mod.title}
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', color: '#7A7060', lineHeight: 1.7, maxWidth: '480px' }}>
            {mod.description}
          </p>
        </div>

        {/* Notes in this module */}
        <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            Note pool — {mod.notes.length} notes
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[...new Set(mod.notes)].map(pitch => (
              <span key={pitch} style={{
                fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400,
                color: '#2A2318', background: '#EDE8DF',
                borderRadius: '6px', padding: '3px 8px',
              }}>
                {pitch}
              </span>
            ))}
          </div>
        </div>

        {/* Tool cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>

          {hasIdentify && (
            <div style={{ background: 'white', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#2A2318', margin: 0 }}>
                      Note Identification
                    </p>
                    {mp.identify.mastered && <span style={{ color: '#3B6D11', fontSize: '13px' }}>✓</span>}
                  </div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 12px' }}>
                    See a note on the staff — type the letter name. 20 questions per session.
                  </p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    Progress: {identifyPassing} / {mod.criteria.sessions} sessions
                    {mod.criteria.identifyAccuracy && ` · ${Math.round((mod.criteria.identifyAccuracy) * 100)}% accuracy needed`}
                  </p>
                </div>
                <button
                  onClick={() => handleStart('identify')}
                  style={{
                    flexShrink: 0, background: '#1A1A18', color: 'white', border: 'none',
                    borderRadius: '10px', padding: '10px 20px',
                    fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer',
                  }}
                >
                  {mp.identify.sessions.length > 0 ? 'Continue' : 'Start'}
                </button>
              </div>

              {mp.identify.sessions.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #EDE8DF' }}>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    Last session: {Math.round((mp.identify.sessions.at(-1)?.accuracy ?? 0) * 100)}%
                    {' · '}Total sessions: {mp.identify.sessions.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {hasPlay && (
            <div style={{
              background: playUnlocked ? 'white' : '#FDFAF3',
              border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px 24px',
              opacity: playUnlocked ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#2A2318', margin: 0 }}>
                      Staff Recognition
                    </p>
                    {mp.play.mastered && <span style={{ color: '#3B6D11', fontSize: '13px' }}>✓</span>}
                    {!playUnlocked && <span style={{ fontSize: 'var(--nl-text-compact)', color: '#DDD8CA' }}>🔒 Complete Identify first</span>}
                  </div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 12px' }}>
                    See a note — play it on your piano. Mic detects pitch automatically. 20 notes per session.
                  </p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    Progress: {playPassing} / {mod.criteria.sessions} sessions
                    {mod.criteria.playAccuracy && ` · ${Math.round(mod.criteria.playAccuracy * 100)}% accuracy needed`}
                    {mod.criteria.playAvgResponseMs && ` · avg <${(mod.criteria.playAvgResponseMs / 1000).toFixed(1)}s`}
                  </p>
                </div>
                <button
                  onClick={() => playUnlocked && handleStart('play')}
                  disabled={!playUnlocked}
                  style={{
                    flexShrink: 0,
                    background: playUnlocked ? '#1A1A18' : '#EDE8DF',
                    color: playUnlocked ? 'white' : '#B0ACA4',
                    border: 'none', borderRadius: '10px', padding: '10px 20px',
                    fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                    cursor: playUnlocked ? 'pointer' : 'default',
                  }}
                >
                  {mp.play.sessions.length > 0 ? 'Continue' : 'Start'}
                </button>
              </div>

              {mp.play.sessions.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #EDE8DF' }}>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    Last session: {Math.round((mp.play.sessions.at(-1)?.accuracy ?? 0) * 100)}%
                    {mp.play.sessions.at(-1)?.avgResponseMs !== undefined &&
                      ` · avg ${((mp.play.sessions.at(-1)?.avgResponseMs ?? 0) / 1000).toFixed(1)}s`}
                    {' · '}Total sessions: {mp.play.sessions.length}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Module complete banner */}
        {mp.completed && (
          <div style={{ background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#3B6D11', margin: '0 0 4px' }}>
              Module complete
            </p>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#3B6D11', margin: 0 }}>
              You've met all the criteria for this module. The next module is now unlocked.
            </p>
          </div>
        )}

        {/* Pro gate notice */}
        {!isModuleFree && !isPro && (
          <div style={{ marginTop: '24px', background: '#1A1A18', borderRadius: '14px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Pro access required to start sessions
            </p>
            <Link href="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#1A1A18', background: '#B5402A', borderRadius: '20px', padding: '8px 18px', display: 'inline-block' }}>
                Upgrade →
              </span>
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
