'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import { signOut } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import { loadUserDecks, deleteDeck } from '@/lib/userDecks'
import { loadProgress } from '@/lib/progressSync'
import { DECKS, CM_BUNDLE_PRICE_ID, PRO_PRICE_ID } from '@/lib/decks'
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
      <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', minWidth: '120px' }}>{label}</span>
      <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318', flex: 1, textAlign: 'right' as const }}>{value}</span>
      {children}
    </div>
  )
}

function Pill({ label, color = '#0F6E56', bg = '#E1F5EE' }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{ display: 'inline-block', fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', background: bg, color }}>
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
        fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: disabled ? 'default' : 'pointer',
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
      <Card>
        {/* Name field */}
        <div style={{ paddingBottom: '20px', marginBottom: '4px', borderBottom: '1px solid #EDE8DF' }}>
          <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', display: 'block', marginBottom: '8px' }}>
            Display name
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={nameValue}
              onChange={e => { setNameValue(e.target.value); setNameStatus('idle') }}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              placeholder="Your name"
              style={{
                flex: 1, background: '#F2EDDF', border: '1px solid #DDD8CA',
                borderRadius: '10px', padding: '10px 14px',
                fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318',
                outline: 'none',
              }}
            />
            <Btn onClick={saveName} disabled={nameStatus === 'saving'}>
              {nameStatus === 'saving' ? 'Saving…' : nameStatus === 'saved' ? 'Saved ✓' : nameStatus === 'error' ? 'Error' : 'Save'}
            </Btn>
          </div>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#7A7060', margin: '6px 0 0' }}>
            Shown in the header instead of your email initials.
          </p>
        </div>

        <Row label="Email" value={user.email} />
        <Row label="Member since" value={memberSince} />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, marginTop: '20px' }}>
          <Btn onClick={sendPasswordReset} disabled={pwStatus === 'sending' || pwStatus === 'sent'}>
            {pwStatus === 'sending' ? 'Sending…' : pwStatus === 'sent' ? 'Email sent ✓' : pwStatus === 'error' ? 'Error — try again' : 'Change password'}
          </Btn>
          <Btn onClick={handleSignOut} danger>Sign out</Btn>
        </div>
      </Card>
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
      <Card>
        {loading ? (
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
        ) : (
          <>
            <div style={{ borderBottom: '1px solid #EDE8DF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #EDE8DF' }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318', margin: '0 0 2px' }}>CM Collection Bundle</p>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', margin: 0 }}>All Certificate of Merit levels, Prep – Advanced</p>
                </div>
                {cmUnlocked ? <Pill label="Active" /> : <Pill label="Not purchased" color="#7A7060" bg="#EDE8DF" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318', margin: '0 0 2px' }}>Pro Subscription</p>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', margin: 0 }}>All content + future features</p>
                </div>
                {proUnlocked ? <Pill label="Active" /> : <Pill label="Not active" color="#7A7060" bg="#EDE8DF" />}
              </div>
            </div>
            {!cmUnlocked && !proUnlocked && (
              <div style={{ marginTop: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <Btn variant="fill">View plans →</Btn>
                </Link>
              </div>
            )}
            {(cmUnlocked || proUnlocked) && (
              <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', marginTop: '16px', marginBottom: 0 }}>
                To manage billing, cancel, or get a receipt — contact support.
              </p>
            )}
          </>
        )}
      </Card>
    </Section>
  )
}

// ── Progress section ────────────────────────────────────────────────────────────
function ProgressSection({ userId }: { userId: string | null }) {
  const [progress, setProgress] = useState<ProgressStore>({})
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState<string | null>(null)
  const [resetAll, setResetAll] = useState(false)

  useEffect(() => {
    loadProgress(userId).then(p => { setProgress(p); setLoading(false) })
  }, [userId])

  const studiedDecks = DECKS.filter(deck => {
    return deck.cards.some(card => progress[`${deck.id}-${card.id}`] !== undefined)
  })

  async function resetDeck(deckId: string) {
    setResetting(deckId)
    const supabase = getSupabaseClient()
    if (userId) {
      await supabase.from('progress').delete().eq('user_id', userId).eq('deck_id', deckId)
    }
    // Clear from localStorage
    const local: ProgressStore = {}
    Object.keys(progress).forEach(key => {
      if (!key.startsWith(deckId + '-')) local[key] = progress[key]
    })
    localStorage.setItem('notelab-progress', JSON.stringify(local))
    setProgress(local)
    setResetting(null)
  }

  async function resetAllProgress() {
    setResetAll(true)
    const supabase = getSupabaseClient()
    if (userId) {
      await supabase.from('progress').delete().eq('user_id', userId)
    }
    localStorage.removeItem('notelab-progress')
    setProgress({})
    setResetAll(false)
  }

  function getDeckStats(deck: typeof DECKS[0]) {
    const now = Date.now()
    let studied = 0, due = 0
    deck.cards.forEach(card => {
      const p = progress[`${deck.id}-${card.id}`]
      if (p) { studied++; if (p.dueDate <= now) due++ }
    })
    return { studied, due, total: deck.cards.length }
  }

  return (
    <Section title="Progress">
      {loading ? (
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      ) : studiedDecks.length === 0 ? (
        <Card>
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', margin: 0 }}>No study progress yet. Start a flashcard deck to track your progress here.</p>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' }}>
            {studiedDecks.map(deck => {
              const { studied, due, total } = getDeckStats(deck)
              const pct = Math.round(studied / total * 100)
              return (
                <Card key={deck.id} style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#2A2318', margin: '0 0 2px' }}>{deck.title}</p>
                      <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', margin: 0 }}>
                        {studied}/{total} studied · {due} due
                      </p>
                    </div>
                    <Btn onClick={() => resetDeck(deck.id)} disabled={resetting === deck.id} danger>
                      {resetting === deck.id ? 'Resetting…' : 'Reset'}
                    </Btn>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: '#B5402A', borderRadius: '2px', transition: 'width 0.4s' }} />
                  </div>
                </Card>
              )
            })}
          </div>
          <Btn onClick={resetAllProgress} disabled={resetAll} danger>
            {resetAll ? 'Resetting…' : 'Reset all progress'}
          </Btn>
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
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      ) : decks.length === 0 ? (
        <Card>
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', margin: 0 }}>
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
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', margin: 0 }}>{deck.cards.length} cards · {deck.tag}</p>
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
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>Account</p>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: active === s.id ? 'white' : 'transparent',
                border: active === s.id ? '1px solid #DDD8CA' : '1px solid transparent',
                borderRadius: '10px', padding: '10px 14px',
                fontFamily: F, fontSize: '13px', fontWeight: 300,
                color: active === s.id ? '#1A1A18' : '#7A7060',
                cursor: 'pointer', textAlign: 'left' as const,
                boxShadow: active === s.id ? '0 1px 4px rgba(26,26,24,0.07)' : 'none',
                transition: 'all 0.15s',
                width: '100%',
              }}>
                <span style={{ fontSize: '12px', opacity: 0.6 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #DDD8CA' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060' }}>← Back to app</span>
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
