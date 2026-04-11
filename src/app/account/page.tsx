'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import { signOut } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import { loadUserDecks, deleteDeck } from '@/lib/userDecks'
import { loadProgress } from '@/lib/progressSync'
import { DECKS, CM_BUNDLE_PRICE_ID, PRO_PRICE_ID, getDeckById } from '@/lib/decks'
import { fetchExerciseLibrary, fetchProgress, resetProgress, type RhythmProgress } from '@/lib/rhythmLibrary'
import {
  LS_PREFIX_NOTE_ID_BEST,
  LS_PREFIX_PLAY_BEST,
  readKeyDrillSnapshot,
  readLocalStorageNumericByPrefix,
  removeLocalStorageKeysByPrefix,
  resetKeyDrillStorage,
  type KeyDrillSnapshot,
} from '@/lib/accountLocalData'
import { Deck, ProgressStore } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

type Section = 'profile' | 'subscription' | 'progress' | 'mydecks'

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'profile',      label: 'Profile',      icon: '○' },
  { id: 'subscription', label: 'Subscription', icon: '◇' },
  { id: 'progress',     label: 'Progress',     icon: '▱' },
  { id: 'mydecks',      label: 'My Decks',     icon: '⊟' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '26px', color: '#2A2318', marginBottom: '20px', letterSpacing: '0.01em' }}>{title}</h2>
      {children}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', padding: '24px 28px', ...style }}>
      {children}
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #EDE8DF' }}>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', minWidth: '120px' }}>{label}</span>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#2A2318', flex: 1, textAlign: 'right' as const }}>{value}</span>
      {children}
    </div>
  )
}

function Pill({ label, color = '#0F6E56', bg = '#E1F5EE' }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{ display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', background: bg, color }}>
      {label}
    </span>
  )
}

function Btn({ children, onClick, variant = 'outline', disabled, danger }: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'outline' | 'fill'
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: disabled ? 'default' : 'pointer',
        border: '1px solid ' + (danger ? '#ED6765' : '#DDD8CA'),
        borderRadius: '20px', padding: '8px 20px',
        background: variant === 'fill' ? (danger ? '#ED6765' : '#1A1A18') : 'white',
        color: variant === 'fill' ? 'white' : (danger ? '#ED6765' : '#1A1A18'),
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function formatPlaybackSeconds(sec: number): string {
  if (!sec || sec <= 0) return '—'
  return `${sec.toFixed(2)} s`
}

// ── Profile section ─────────────────────────────────────────────────────────────
function ProfileSection({ user }: { user: any }) {
  const [pwStatus, setPwStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [nameValue, setNameValue] = useState<string>(user.user_metadata?.display_name ?? '')
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const router = useRouter()

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  async function saveName() {
    if (nameValue.trim() === (user.user_metadata?.display_name ?? '')) return
    setNameStatus('saving')
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ data: { display_name: nameValue.trim() } })
    setNameStatus(error ? 'error' : 'saved')
    setTimeout(() => setNameStatus('idle'), 3000)
  }

  async function sendPasswordReset() {
    setPwStatus('sending')
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/account`,
    })
    setPwStatus(error ? 'error' : 'sent')
    setTimeout(() => setPwStatus('idle'), 4000)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <Section title="Profile">
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        <details className="nl-account-disclosure" open>
          <summary>Account &amp; display name</summary>
          <div className="nl-account-disclosure__body">
            <div style={{ paddingBottom: '16px' }}>
              <label style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', display: 'block', marginBottom: '8px' }}>
                Display name
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                <input
                  value={nameValue}
                  onChange={e => { setNameValue(e.target.value); setNameStatus('idle') }}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  placeholder="Your name"
                  style={{
                    flex: 1, minWidth: '200px', background: '#F2EDDF', border: '1px solid #DDD8CA',
                    borderRadius: '10px', padding: '10px 14px',
                    fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#2A2318',
                    outline: 'none',
                  }}
                />
                <Btn onClick={saveName} disabled={nameStatus === 'saving'}>
                  {nameStatus === 'saving' ? 'Saving…' : nameStatus === 'saved' ? 'Saved ✓' : nameStatus === 'error' ? 'Error' : 'Save'}
                </Btn>
              </div>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', margin: '6px 0 0' }}>
                Shown in the header instead of your email initials.
              </p>
            </div>
            <div style={{ borderTop: '1px solid #EDE8DF', paddingTop: '12px' }}>
              <Row label="Email" value={user.email} />
              <Row label="Member since" value={memberSince} />
            </div>
          </div>
        </details>

        <details className="nl-account-disclosure">
          <summary>Security</summary>
          <div className="nl-account-disclosure__body">
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 14px' }}>
              We&apos;ll email you a link to set a new password.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              <Btn onClick={sendPasswordReset} disabled={pwStatus === 'sending' || pwStatus === 'sent'}>
                {pwStatus === 'sending' ? 'Sending…' : pwStatus === 'sent' ? 'Email sent ✓' : pwStatus === 'error' ? 'Error — try again' : 'Change password'}
              </Btn>
              <Btn onClick={handleSignOut} danger>Sign out</Btn>
            </div>
          </div>
        </details>
      </div>
    </Section>
  )
}

// ── Subscription section ────────────────────────────────────────────────────────
function SubscriptionSection({ userId }: { userId: string }) {
  const { purchases, loading, hasPurchased, hasSubscription } = usePurchases(userId)

  const cmUnlocked = hasPurchased(CM_BUNDLE_PRICE_ID)
  const proUnlocked = hasSubscription()

  return (
    <Section title="Subscription">
      {loading ? (
        <Card>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>Loading…</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          <details className="nl-account-disclosure nl-account-disclosure--stat-row" open>
            <summary>
              <span>CM Collection Bundle</span>
              {cmUnlocked ? <Pill label="Active" /> : <Pill label="Not purchased" color="#7A7060" bg="#EDE8DF" />}
            </summary>
            <div className="nl-account-disclosure__body">
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 12px' }}>
                All Certificate of Merit levels, Prep through Advanced.
              </p>
            </div>
          </details>
          <details className="nl-account-disclosure nl-account-disclosure--stat-row" open>
            <summary>
              <span>Pro subscription</span>
              {proUnlocked ? <Pill label="Active" /> : <Pill label="Not active" color="#7A7060" bg="#EDE8DF" />}
            </summary>
            <div className="nl-account-disclosure__body">
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 12px' }}>
                Full catalog and future features while your plan is active.
              </p>
            </div>
          </details>
          {!cmUnlocked && !proUnlocked && (
            <div style={{ marginTop: '4px' }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Btn variant="fill">View plans →</Btn>
              </Link>
            </div>
          )}
          {(cmUnlocked || proUnlocked) && (
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', margin: '8px 0 0' }}>
              To manage billing, cancel, or get a receipt — contact support.
            </p>
          )}
        </div>
      )}
    </Section>
  )
}

// ── Progress section ────────────────────────────────────────────────────────────
function ProgressSection({ userId }: { userId: string | null }) {
  const [progress, setProgress] = useState<ProgressStore>({})
  const [rhythmProgress, setRhythmProgress] = useState<Record<string, RhythmProgress>>({})
  const [rhythmTitles, setRhythmTitles] = useState<Map<string, string>>(new Map())
  const [playBests, setPlayBests] = useState<{ id: string; value: number }[]>([])
  const [noteIdBests, setNoteIdBests] = useState<{ id: string; value: number }[]>([])
  const [keyDrill, setKeyDrill] = useState<KeyDrillSnapshot>({ correct: 0, total: 0, streak: 0 })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [p, r, lib] = await Promise.all([
      loadProgress(userId),
      fetchProgress(userId),
      fetchExerciseLibrary(),
    ])
    setProgress(p)
    setRhythmProgress(r)
    const titles = new Map<string, string>()
    lib.flat.forEach(e => titles.set(e.id, e.title))
    setRhythmTitles(titles)
    setPlayBests(readLocalStorageNumericByPrefix(LS_PREFIX_PLAY_BEST))
    setNoteIdBests(readLocalStorageNumericByPrefix(LS_PREFIX_NOTE_ID_BEST))
    setKeyDrill(readKeyDrillSnapshot())
  }, [userId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await reload()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [reload])

  const studiedDecks = DECKS.filter(deck =>
    deck.cards.some(card => progress[`${deck.id}-${card.id}`] !== undefined)
  )

  const rhythmEntries = Object.values(rhythmProgress)
  const rhythmCompleted = rhythmEntries.filter(x => x.completed).length

  const hasFlash = studiedDecks.length > 0
  const hasSight = playBests.length > 0
  const hasNoteId = noteIdBests.length > 0
  const hasRhythm = rhythmEntries.length > 0
  const hasKeys = keyDrill.total > 0 || keyDrill.streak > 0 || keyDrill.correct > 0
  const hasAnything = hasFlash || hasSight || hasNoteId || hasRhythm || hasKeys

  function getDeckStats(deck: typeof DECKS[0]) {
    const now = Date.now()
    let studied = 0, due = 0
    deck.cards.forEach(card => {
      const p = progress[`${deck.id}-${card.id}`]
      if (p) { studied++; if (p.dueDate <= now) due++ }
    })
    return { studied, due, total: deck.cards.length }
  }

  async function resetFlashDeck(deckId: string) {
    setPending(`flash:${deckId}`)
    const supabase = getSupabaseClient()
    if (userId) {
      await supabase.from('progress').delete().eq('user_id', userId).eq('deck_id', deckId)
    }
    const local: ProgressStore = {}
    Object.keys(progress).forEach(key => {
      if (!key.startsWith(deckId + '-')) local[key] = progress[key]
    })
    localStorage.setItem('notelab-progress', JSON.stringify(local))
    setProgress(local)
    setPending(null)
  }

  async function resetAllFlash() {
    setPending('flash-all')
    const supabase = getSupabaseClient()
    if (userId) {
      await supabase.from('progress').delete().eq('user_id', userId)
    }
    localStorage.removeItem('notelab-progress')
    setProgress({})
    setPending(null)
  }

  function resetPlayBest(deckId: string) {
    setPending(`sight:${deckId}`)
    localStorage.removeItem(LS_PREFIX_PLAY_BEST + deckId)
    setPlayBests(readLocalStorageNumericByPrefix(LS_PREFIX_PLAY_BEST))
    setPending(null)
  }

  function resetAllPlayBests() {
    setPending('sight-all')
    removeLocalStorageKeysByPrefix(LS_PREFIX_PLAY_BEST)
    setPlayBests([])
    setPending(null)
  }

  function resetNoteIdBest(deckId: string) {
    setPending(`nid:${deckId}`)
    localStorage.removeItem(LS_PREFIX_NOTE_ID_BEST + deckId)
    setNoteIdBests(readLocalStorageNumericByPrefix(LS_PREFIX_NOTE_ID_BEST))
    setPending(null)
  }

  function resetAllNoteId() {
    setPending('nid-all')
    removeLocalStorageKeysByPrefix(LS_PREFIX_NOTE_ID_BEST)
    setNoteIdBests([])
    setPending(null)
  }

  async function resetRhythmOne(id: string) {
    setPending(`rhythm:${id}`)
    await resetProgress(userId, id)
    await reload()
    setPending(null)
  }

  async function resetAllRhythm() {
    setPending('rhythm-all')
    await resetProgress(userId)
    await reload()
    setPending(null)
  }

  function resetKeyDrill() {
    setPending('keydrill')
    resetKeyDrillStorage()
    setKeyDrill(readKeyDrillSnapshot())
    setPending(null)
  }

  async function resetEverything() {
    setPending('all')
    const supabase = getSupabaseClient()
    if (userId) {
      await supabase.from('progress').delete().eq('user_id', userId)
    }
    await resetProgress(userId)
    localStorage.removeItem('notelab-progress')
    removeLocalStorageKeysByPrefix(LS_PREFIX_PLAY_BEST)
    removeLocalStorageKeysByPrefix(LS_PREFIX_NOTE_ID_BEST)
    resetKeyDrillStorage()
    setProgress({})
    await reload()
    setPending(null)
  }

  const intro = (
    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 16px', maxWidth: '560px' }}>
      Progress is grouped by app. Spaced-repetition stats sync when you&apos;re signed in; rhythm syncs to your account; sight-reading, Note ID, and key drills are stored in this browser unless noted.
    </p>
  )

  if (loading) {
    return (
      <Section title="Progress">
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>Loading…</p>
      </Section>
    )
  }

  return (
    <Section title="Progress">
      {intro}

      {!hasAnything ? (
        <Card>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', margin: '0 0 12px' }}>
            No progress recorded yet. Explore flashcards, sight-reading, Note ID, rhythm, or key signatures to see stats here.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px' }}>
            <Link href="/flashcards" style={{ textDecoration: 'none' }}><Btn>Flashcards</Btn></Link>
            <Link href="/sight-read/treble" style={{ textDecoration: 'none' }}><Btn>Sight-reading</Btn></Link>
            <Link href="/note-id" style={{ textDecoration: 'none' }}><Btn>Note ID</Btn></Link>
            <Link href="/rhythm" style={{ textDecoration: 'none' }}><Btn>Rhythm</Btn></Link>
            <Link href="/key-signatures" style={{ textDecoration: 'none' }}><Btn>Key signatures</Btn></Link>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '16px' }}>
            {/* Flashcards (SRS) */}
            <details className="nl-account-disclosure nl-account-disclosure--stat-row">
              <summary>
                <span>Flashcards</span>
                <span className="nl-account-disclosure__meta">
                  {hasFlash ? `${studiedDecks.length} deck${studiedDecks.length === 1 ? '' : 's'}` : 'No data'}
                </span>
              </summary>
              <div className="nl-account-disclosure__body">
                {!hasFlash ? (
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', margin: 0 }}>Open a deck under Flashcards to start tracking.</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '12px' }}>
                      {studiedDecks.map(deck => {
                        const { studied, due, total } = getDeckStats(deck)
                        const pct = Math.round((studied / total) * 100)
                        return (
                          <div key={deck.id} style={{ background: 'white', border: '1px solid #EDE8DF', borderRadius: '12px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: '#2A2318', margin: '0 0 2px' }}>{deck.title}</p>
                                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', margin: 0 }}>
                                  {studied}/{total} studied · {due} due
                                </p>
                              </div>
                              <Btn onClick={() => resetFlashDeck(deck.id)} disabled={pending === `flash:${deck.id}`} danger>
                                {pending === `flash:${deck.id}` ? '…' : 'Reset'}
                              </Btn>
                            </div>
                            <div style={{ height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#B5402A', borderRadius: '2px', transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Btn onClick={resetAllFlash} disabled={pending === 'flash-all'} danger>
                      {pending === 'flash-all' ? 'Resetting…' : 'Reset all flashcard progress'}
                    </Btn>
                  </>
                )}
              </div>
            </details>

            {/* Sight-reading — play-through best times */}
            <details className="nl-account-disclosure nl-account-disclosure--stat-row">
              <summary>
                <span>Sight-reading</span>
                <span className="nl-account-disclosure__meta">
                  {hasSight ? `${playBests.length} best time${playBests.length === 1 ? '' : 's'}` : 'No data'}
                </span>
              </summary>
              <div className="nl-account-disclosure__body">
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', margin: '0 0 12px' }}>
                  Best times for full play-through sessions (Play It mode).
                </p>
                {!hasSight ? (
                  <Link href="/sight-read/treble" style={{ color: '#B5402A', textDecoration: 'none', fontFamily: F, fontSize: 'var(--nl-text-ui)' }}>Open sight-reading →</Link>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px', maxHeight: '280px', overflowY: 'auto' }} className="nl-hide-scrollbar">
                      {playBests.map(({ id, value }) => {
                        const title = getDeckById(id)?.title ?? id
                        return (
                          <div key={id} className="nl-account-disclosure__body-line">
                            <span className="nl-account-disclosure__body-line-title">{title}</span>
                            <span className="nl-account-disclosure__body-line-meta">{formatPlaybackSeconds(value)}</span>
                            <Btn onClick={() => resetPlayBest(id)} disabled={pending === `sight:${id}`} danger>
                              {pending === `sight:${id}` ? '…' : 'Clear'}
                            </Btn>
                          </div>
                        )
                      })}
                    </div>
                    <Btn onClick={resetAllPlayBests} disabled={pending === 'sight-all'} danger>
                      {pending === 'sight-all' ? '…' : 'Clear all sight-reading times'}
                    </Btn>
                  </>
                )}
              </div>
            </details>

            {/* Note identification */}
            <details className="nl-account-disclosure nl-account-disclosure--stat-row">
              <summary>
                <span>Note identification</span>
                <span className="nl-account-disclosure__meta">
                  {hasNoteId ? `${noteIdBests.length} best${noteIdBests.length === 1 ? '' : 's'}` : 'No data'}
                </span>
              </summary>
              <div className="nl-account-disclosure__body">
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', margin: '0 0 12px' }}>
                  Best times from timed Note ID drills (this device).
                </p>
                {!hasNoteId ? (
                  <Link href="/note-id" style={{ color: '#B5402A', textDecoration: 'none', fontFamily: F, fontSize: 'var(--nl-text-ui)' }}>Open Note ID →</Link>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px', maxHeight: '280px', overflowY: 'auto' }} className="nl-hide-scrollbar">
                      {noteIdBests.map(({ id, value }) => {
                        const title = getDeckById(id)?.title ?? id
                        return (
                          <div key={id} className="nl-account-disclosure__body-line">
                            <span className="nl-account-disclosure__body-line-title">{title}</span>
                            <span className="nl-account-disclosure__body-line-meta">{formatPlaybackSeconds(value)}</span>
                            <Btn onClick={() => resetNoteIdBest(id)} disabled={pending === `nid:${id}`} danger>
                              {pending === `nid:${id}` ? '…' : 'Clear'}
                            </Btn>
                          </div>
                        )
                      })}
                    </div>
                    <Btn onClick={resetAllNoteId} disabled={pending === 'nid-all'} danger>
                      {pending === 'nid-all' ? '…' : 'Clear all Note ID times'}
                    </Btn>
                  </>
                )}
              </div>
            </details>

            {/* Rhythm */}
            <details className="nl-account-disclosure nl-account-disclosure--stat-row">
              <summary>
                <span>Rhythm</span>
                <span className="nl-account-disclosure__meta">
                  {hasRhythm ? `${rhythmEntries.length} exercise${rhythmEntries.length === 1 ? '' : 's'} · ${rhythmCompleted} cleared` : 'No data'}
                </span>
              </summary>
              <div className="nl-account-disclosure__body">
                {!hasRhythm ? (
                  <Link href="/rhythm" style={{ color: '#B5402A', textDecoration: 'none', fontFamily: F, fontSize: 'var(--nl-text-ui)' }}>Open rhythm trainer →</Link>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px', maxHeight: '280px', overflowY: 'auto' }} className="nl-hide-scrollbar">
                      {rhythmEntries.map(r => {
                        const title = rhythmTitles.get(r.exercise_id) ?? r.exercise_id
                        return (
                          <div key={r.exercise_id} className="nl-account-disclosure__body-line">
                            <span className="nl-account-disclosure__body-line-title">{title}</span>
                            <span className="nl-account-disclosure__body-line-meta">
                              {Math.round(r.best_timing)}% timing · {r.completed ? 'cleared' : 'in progress'}
                            </span>
                            <Btn onClick={() => resetRhythmOne(r.exercise_id)} disabled={pending === `rhythm:${r.exercise_id}`} danger>
                              {pending === `rhythm:${r.exercise_id}` ? '…' : 'Reset'}
                            </Btn>
                          </div>
                        )
                      })}
                    </div>
                    <Btn onClick={resetAllRhythm} disabled={pending === 'rhythm-all'} danger>
                      {pending === 'rhythm-all' ? 'Resetting…' : 'Reset all rhythm progress'}
                    </Btn>
                  </>
                )}
              </div>
            </details>

            {/* Key signatures drill */}
            <details className="nl-account-disclosure nl-account-disclosure--stat-row">
              <summary>
                <span>Key signatures</span>
                <span className="nl-account-disclosure__meta">
                  {keyDrill.total > 0 ? `${keyDrill.correct}/${keyDrill.total} · streak ${keyDrill.streak}` : keyDrill.streak > 0 ? `streak ${keyDrill.streak}` : 'No data'}
                </span>
              </summary>
              <div className="nl-account-disclosure__body">
                {!hasKeys ? (
                  <Link href="/key-signatures" style={{ color: '#B5402A', textDecoration: 'none', fontFamily: F, fontSize: 'var(--nl-text-ui)' }}>Open key signatures →</Link>
                ) : (
                  <>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#2A2318', margin: '0 0 12px' }}>
                      Drill score: {keyDrill.correct} correct of {keyDrill.total} · Circle-of-fifths streak: {keyDrill.streak}
                    </p>
                    <Btn onClick={resetKeyDrill} disabled={pending === 'keydrill'} danger>
                      {pending === 'keydrill' ? '…' : 'Reset key drill stats'}
                    </Btn>
                  </>
                )}
              </div>
            </details>
          </div>

          <Card style={{ padding: '18px 22px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', margin: '0 0 12px' }}>
              Remove flashcard SRS (cloud), rhythm progress (cloud), and all browser-only timers and drills on this device.
            </p>
            <Btn onClick={resetEverything} disabled={pending === 'all'} danger>
              {pending === 'all' ? 'Resetting…' : 'Reset everything'}
            </Btn>
          </Card>
        </>
      )}
    </Section>
  )
}

// ── My Decks section ────────────────────────────────────────────────────────────
function MyDecksSection({ userId }: { userId: string | null }) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadUserDecks(userId).then(d => { setDecks(d); setLoading(false) })
  }, [userId])

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteDeck(id, userId)
    setDecks(prev => prev.filter(d => d.id !== id))
    setDeleting(null)
  }

  return (
    <Section title="My Decks">
      {loading ? (
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>Loading…</p>
      ) : decks.length === 0 ? (
        <Card>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', margin: 0 }}>
            No custom decks yet.{' '}
            <Link href="/" style={{ color: '#B5402A', textDecoration: 'none' }}>Create one on the home page →</Link>
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {decks.map(deck => (
            <Card key={deck.id} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#2A2318', margin: '0 0 2px' }}>{deck.title}</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', margin: 0 }}>{deck.cards.length} cards · {deck.tag}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/study/${deck.id}`} style={{ textDecoration: 'none' }}>
                  <Btn>Study →</Btn>
                </Link>
                <Btn onClick={() => handleDelete(deck.id)} disabled={deleting === deck.id} danger>
                  {deleting === deck.id ? '…' : 'Delete'}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [active, setActive] = useState<Section>('profile')

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 80px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <aside style={{ width: '180px', flexShrink: 0, position: 'sticky' as const, top: '80px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>Account</p>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: active === s.id ? 'white' : 'transparent',
                border: active === s.id ? '1px solid #DDD8CA' : '1px solid transparent',
                borderRadius: '10px', padding: '10px 14px',
                fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                color: active === s.id ? '#1A1A18' : '#7A7060',
                cursor: 'pointer', textAlign: 'left' as const,
                boxShadow: active === s.id ? '0 1px 4px rgba(26,26,24,0.07)' : 'none',
                transition: 'all 0.15s',
                width: '100%',
              }}>
                <span style={{ fontSize: 'var(--nl-text-compact)', opacity: 0.6 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #DDD8CA' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>← Back to app</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {active === 'profile'      && <ProfileSection user={user} />}
          {active === 'subscription' && <SubscriptionSection userId={user.id} />}
          {active === 'progress'     && <ProgressSection userId={user.id} />}
          {active === 'mydecks'      && <MyDecksSection userId={user.id} />}
        </main>

      </div>
    </div>
  )
}
