'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  getNRModuleProgress,
  isNRModuleUnlocked,
  isNRPlayUnlocked,
  isNRLocateUnlocked,
  nrConsecutivePassing,
  loadNRProgress,
  getNoteStats,
} from '@/lib/programs/note-reading/progress'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import NoteHeatMap from '@/components/programs/note-reading/NoteHeatMap'
import StaffPreview from '@/components/programs/note-reading/StaffPreview'
import IntervallicPreview from '@/components/programs/note-reading/IntervallicPreview'
import RhythmicMeasureStaff from '@/components/cards/RhythmicMeasureStaff'

// Module 1 landmark labels — small italic captions under each notehead
// in the StaffPreview reference chart. Other modules render letter
// labels only (no landmark captions).
const LANDMARK_PREVIEW_LABELS: Record<string, string> = {
  G3: 'Bass G line',
  B3: 'Bass top line',
  C4: 'Middle C',
  G4: 'Treble G line',
  B4: 'Middle line',
  D5: '4th line',
  F5: 'Top line',
}

// A condensed sample for Module 6 — too many accidentals to render all
// 30 cleanly, so the preview shows ten representative pitches and the
// module page surfaces a caption explaining the rest.
const ACCIDENTALS_PREVIEW_SAMPLE = ['Bb3', 'Eb4', 'C#4', 'F#4', 'A#4', 'Ab4', 'Bb4', 'Db5', 'Eb5', 'F#5']

// Module 9 demo measure — a simple tonic-anchored motif the student
// will read in time with the metronome.
const RHYTHMIC_PREVIEW_MEASURE = ['C4', 'E4', 'G4', 'E4']

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { params: Promise<{ moduleId: string }> }

export default function ModuleOverviewPage({ params }: Props) {
  const { moduleId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [mp, setMp] = useState(getNRModuleProgress(moduleId))
  const [store, setStore] = useState(loadNRProgress())
  const [noteStats, setNoteStats] = useState(getNoteStats(moduleId, 'both'))

  useEffect(() => {
    const s = loadNRProgress()
    setStore(s)
    setMp(s[moduleId] ?? { identify: { sessions: [], mastered: false }, locate: { sessions: [], mastered: false }, play: { sessions: [], mastered: false }, completed: false })
    setNoteStats(getNoteStats(moduleId, 'both', s))
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
  const hasLocate = mod.tools.includes('locate')
  const hasPlay = mod.tools.includes('play')
  const locateUnlocked = isNRLocateUnlocked(moduleId, store)
  const playUnlocked = isNRPlayUnlocked(moduleId, store)
  const identifyPassing = nrConsecutivePassing(moduleId, 'identify', store)
  const locatePassing = nrConsecutivePassing(moduleId, 'locate', store)
  const playPassing = nrConsecutivePassing(moduleId, 'play', store)
  const isModuleFree = moduleId === 'landmarks'
  const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))
  const hasAnySessions = noteStats.some(s => s.attempts > 0) ||
    mp.identify.sessions.length > 0 || mp.play.sessions.length > 0

  function handleStart(tool: 'identify' | 'locate' | 'play') {
    if (isLoading) return
    if (!isModuleFree && !isPro) { router.push('/account'); return }
    router.push(`/programs/note-reading/${moduleId}/${tool}`)
  }

  const btnStyle = (primary: boolean) => ({
    flexShrink: 0 as const,
    background: primary ? '#1A1A18' : 'transparent',
    color: primary ? 'white' : '#7A7060',
    border: primary ? 'none' : '1px solid #DDD8CA',
    borderRadius: '10px', padding: '10px 20px',
    fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400 as const,
    cursor: isLoading ? 'default' as const : 'pointer' as const,
    opacity: isLoading ? 0.5 : 1,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs/note-reading" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Note Reading
          </span>
        </Link>

        {/* Module complete banner — top, below breadcrumb */}
        {mp.completed && (
          <div style={{ marginTop: '16px', background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#3B6D11', fontSize: '14px' }}>✓</span>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 400, color: '#3B6D11', margin: 0 }}>Module complete</p>
              {nextModule && (
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#3B6D11', margin: 0 }}>
                  Next: {nextModule.title}
                </p>
              )}
            </div>
            {nextModule && (
              <Link href={`/programs/note-reading/${nextModule.id}`} style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#3B6D11', background: 'rgba(59,109,17,0.12)', borderRadius: '20px', padding: '4px 12px' }}>
                  Next →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
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

        {/* What you'll learn — visual reference chart of the module's
            note pool. The preview component dispatched on variant +
            module id replaces the old letter-code chip list, which was
            unhelpful for beginners (the codes are what they're trying
            to learn). */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            What you&apos;ll learn — {[...new Set(mod.notes)].length} notes
          </p>
          {(() => {
            if (mod.variant === 'intervallic') {
              return <IntervallicPreview caption="Read notes as intervals from a reference pitch." />
            }
            if (mod.variant === 'rhythmic') {
              return (
                <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RhythmicMeasureStaff
                      notes={RHYTHMIC_PREVIEW_MEASURE}
                      activeIndex={null}
                      revealLetters
                    />
                  </div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: '14px 0 0', textAlign: 'center', lineHeight: 1.55 }}>
                    Notes in time with a metronome.
                  </p>
                </div>
              )
            }
            if (moduleId === 'landmarks') {
              return (
                <StaffPreview
                  notes={['G3', 'B3', 'C4', 'G4', 'B4', 'D5', 'F5']}
                  clef="grand"
                  showLabels
                  showLandmarks
                  landmarkLabels={LANDMARK_PREVIEW_LABELS}
                />
              )
            }
            if (moduleId === 'accidentals') {
              return (
                <StaffPreview
                  notes={ACCIDENTALS_PREVIEW_SAMPLE}
                  clef="grand"
                  showLabels
                  caption="Also includes additional sharps and flats across the grand staff."
                />
              )
            }
            if (moduleId === 'speed-drills') {
              return (
                <StaffPreview
                  notes={mod.notes.filter(n => !/[#b]/.test(n))}
                  clef="grand"
                  showLabels
                  caption="All notes from Modules 1–6 at speed — 95% accuracy in under 1.5 seconds per note."
                />
              )
            }
            return (
              <StaffPreview
                notes={[...new Set(mod.notes)]}
                clef={mod.clef}
                showLabels
              />
            )
          })()}
        </div>

        {/* Drill-mastery summary — a single source of truth for how the
            module completes. `completed` is gated on every drill hitting
            its accuracy threshold over the required session count. */}
        {(() => {
          const masteredCount =
            (hasIdentify && mp.identify.mastered ? 1 : 0) +
            (hasLocate && mp.locate.mastered ? 1 : 0) +
            (hasPlay && mp.play.mastered ? 1 : 0)
          const drillCount =
            (hasIdentify ? 1 : 0) + (hasLocate ? 1 : 0) + (hasPlay ? 1 : 0)
          if (drillCount <= 1) return null
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '4px 2px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', margin: 0 }}>
                Drills mastered — {masteredCount} of {drillCount}
              </p>
              <div style={{ display: 'flex', gap: '4px' }} aria-hidden="true">
                {Array.from({ length: drillCount }).map((_, i) => (
                  <span key={i} style={{
                    width: '18px', height: '4px', borderRadius: '2px',
                    background: i < masteredCount ? '#3B6D11' : '#DDD8CA',
                  }} />
                ))}
              </div>
            </div>
          )
        })()}

        {/* Tool cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>

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
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 10px' }}>
                    See a note on the staff — type the letter name. 20 questions per session.
                  </p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    {mp.identify.mastered
                      ? 'Mastered'
                      : `Progress: ${identifyPassing} / ${mod.criteria.sessions} sessions`}
                    {!mp.identify.mastered && mod.criteria.identifyAccuracy && ` · ${Math.round(mod.criteria.identifyAccuracy * 100)}% accuracy needed`}
                  </p>
                </div>
                <button
                  onClick={() => handleStart('identify')}
                  style={btnStyle(true)}
                >
                  {mp.identify.mastered ? 'Review' : mp.identify.sessions.length > 0 ? 'Continue' : 'Start'}
                </button>
              </div>

              {mp.identify.sessions.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #EDE8DF' }}>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    Last session: {Math.round((mp.identify.sessions.at(-1)?.accuracy ?? 0) * 100)}%
                    {' · '}Total sessions: {mp.identify.sessions.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {hasLocate && (
            <div style={{
              background: locateUnlocked ? 'white' : '#FDFAF3',
              border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px 24px',
              opacity: locateUnlocked ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#2A2318', margin: 0 }}>
                      Note Location
                    </p>
                    {mp.locate.mastered && <span style={{ color: '#3B6D11', fontSize: '13px' }}>✓</span>}
                    {!locateUnlocked && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4' }}>🔒 Complete Identify first</span>}
                  </div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 10px' }}>
                    See a note name — tap the correct line or space on the grand staff. 20 taps per session.
                  </p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    {mp.locate.mastered
                      ? 'Mastered'
                      : `Progress: ${locatePassing} / ${mod.criteria.sessions} sessions`}
                    {!mp.locate.mastered && mod.criteria.locateAccuracy && ` · ${Math.round(mod.criteria.locateAccuracy * 100)}% accuracy needed`}
                  </p>
                </div>
                <button
                  onClick={() => locateUnlocked && handleStart('locate')}
                  disabled={!locateUnlocked}
                  style={{
                    flexShrink: 0,
                    background: locateUnlocked ? '#1A1A18' : '#EDE8DF',
                    color: locateUnlocked ? 'white' : '#B0ACA4',
                    border: 'none', borderRadius: '10px', padding: '10px 20px',
                    fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                    cursor: locateUnlocked ? 'pointer' : 'default',
                  }}
                >
                  {mp.locate.mastered ? 'Review' : mp.locate.sessions.length > 0 ? 'Continue' : 'Start'}
                </button>
              </div>

              {mp.locate.sessions.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #EDE8DF' }}>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    Last session: {Math.round((mp.locate.sessions.at(-1)?.accuracy ?? 0) * 100)}%
                    {' · '}Total sessions: {mp.locate.sessions.length}
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
                    {!playUnlocked && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4' }}>🔒 Complete Identify first</span>}
                  </div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 10px' }}>
                    See a note — play it on your piano. Mic detects pitch automatically. 20 notes per session.
                  </p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
                    {mp.play.mastered
                      ? 'Mastered'
                      : `Progress: ${playPassing} / ${mod.criteria.sessions} sessions`}
                    {!mp.play.mastered && mod.criteria.playAccuracy && ` · ${Math.round(mod.criteria.playAccuracy * 100)}% accuracy needed`}
                    {!mp.play.mastered && mod.criteria.playAvgResponseMs && ` · avg <${(mod.criteria.playAvgResponseMs / 1000).toFixed(1)}s`}
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
                  {mp.play.mastered ? 'Review' : mp.play.sessions.length > 0 ? 'Continue' : 'Start'}
                </button>
              </div>

              {mp.play.sessions.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #EDE8DF' }}>
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

        {/* Unlock-next hint — only shown when the module has a follow-on
            module that's still locked, and this module isn't yet complete.
            Keeps the three-drill gating visible without being pushy. */}
        {!mp.completed && nextModule && (
          <div style={{ marginTop: '-12px', marginBottom: '28px', padding: '10px 14px', background: '#FDFAF3', border: '1px dashed #DDD8CA', borderRadius: '10px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0, lineHeight: 1.55 }}>
              Complete all {(hasIdentify ? 1 : 0) + (hasLocate ? 1 : 0) + (hasPlay ? 1 : 0)} drills to unlock <strong style={{ fontFamily: SERIF, fontWeight: 400, color: '#2A2318' }}>{nextModule.title}</strong>.
            </p>
          </div>
        )}

        {/* Note Heat Map — only when sessions exist */}
        {hasAnySessions && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>
              Your note map
            </p>
            <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px' }}>
              <NoteHeatMap
                notePool={[...new Set(mod.notes)]}
                noteStats={noteStats}
                clef={mod.clef}
              />
            </div>
          </div>
        )}

        {/* Pro gate notice */}
        {!isModuleFree && !isLoading && !isPro && (
          <div style={{ marginTop: '8px', background: '#1A1A18', borderRadius: '14px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Pro access required to start sessions
            </p>
            <Link href="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: 'white', background: '#B5402A', borderRadius: '20px', padding: '8px 18px', display: 'inline-block' }}>
                Upgrade →
              </span>
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
