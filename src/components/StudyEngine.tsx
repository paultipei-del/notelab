'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Deck, StudyMode } from '@/lib/types'
import { useStudySession } from '@/hooks/useStudySession'
import { useIsMobile } from '@/hooks/useMediaQuery'
import FlipCard from '@/components/cards/FlipCard'
import MultipleChoice from '@/components/cards/MultipleChoice'
import SymbolCard from '@/components/cards/SymbolCard'
import AudioCard from '@/components/cards/AudioCard'
import AudioBrowseRow from '@/components/cards/AudioBrowseRow'
import ExplainCard from '@/components/cards/ExplainCard'
import ChallengeCard from '@/components/cards/ChallengeCard'
import MobileStudyChrome, { MobileTab, MobileTabMode } from '@/components/study/MobileStudyChrome'
import MobileBrowsePanel from '@/components/study/MobileBrowsePanel'

// Application & Review decks use multi-part challenge cards that need a
// dedicated reading-column UI. These deck IDs get:
//   • ChallengeCard instead of FlipCard
//   • Flip mode only (no MC / Explain / Play / Quiz buttons)
//   • Standard prev/next navigation and topbar
const CHALLENGE_DECK_IDS = new Set([
  'identify-and-explain',
  'build-and-transform',
  'score-reading-quickfire',
  'ear-to-paper',
])
import { stopMic } from '@/components/cards/PlayItCard2'
import PlayItCard2 from '@/components/cards/PlayItCard2'
import { useRouter, useSearchParams } from 'next/navigation'

interface StudyEngineProps {
  deck: Deck
  userId: string | null
  onQuiz: () => void
  /** Mode requested by an external caller (mobile QuizEngine exiting
   *  with a target tab). 'browse' switches viewMode; other values set
   *  the study mode. Applied via effect, then cleared via
   *  onPendingHandled so a stale value doesn't re-fire later. */
  pendingMode?: StudyMode | 'browse' | null
  onPendingHandled?: () => void
}
type ViewMode = 'study' | 'browse'
const STUDY_MODES: { id: StudyMode; label: string }[] = [
  { id: 'flip', label: 'Flip' }, { id: 'mc', label: 'Multiple Choice' },
  { id: 'explain', label: 'Explain It' },
  { id: 'play', label: 'Play It' },
]

function formatTime(ms: number): string {
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}

// Learning modes (flip / MC / explain) show minutes only so the clock doesn't
// nag a hurrying student. Sight-read (play) keeps centisecond precision since
// speed IS the metric there.
function formatTopbarTime(ms: number, isPlay: boolean): string {
  if (isPlay) return formatTime(ms)
  const minutes = Math.floor(ms / 60000)
  return minutes < 1 ? '<1m' : `${minutes}m`
}

export default function StudyEngine({ deck, userId, onQuiz, pendingMode, onPendingHandled }: StudyEngineProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const isSightReadDeckInit = deck.id.startsWith('sight-read-')
  const [viewMode, setViewMode] = useState<ViewMode>('study')
  const [showIntro, setShowIntro] = useState(deck.id.startsWith('sight-read-'))
  const [browseExpanded, setBrowseExpanded] = useState<number | null>(null)
  const [flipIndex, setFlipIndex] = useState(0)
  const [flipRevealed, setFlipRevealed] = useState(false)
  const initialMode: StudyMode = deck.id.startsWith('sight-read-') ? 'play' : 'flip'
  const { currentCard, mode, revealed, stats, isComplete, progressPct, intervals, reveal, rate, recordAnswer, setMode, getMCOptions, resetSession, resetTimer, queue, cardIndex: sessionCardIndex } = useStudySession(deck, userId, initialMode)
  const flipCards = useMemo(() => [...deck.cards].sort(() => Math.random() - 0.5), [deck.id])
  const flipCard = flipCards[flipIndex] ?? null
  const isAudioDeck = deck.cards.every(c => c.type === 'audio')
  const isStaffDeck = deck.cards.some(c => c.type === 'staff')
  const isSightReadDeck = deck.id.startsWith('sight-read-')
  const isChallengeDeck = CHALLENGE_DECK_IDS.has(deck.id)
  const visibleModes = STUDY_MODES.filter(m => {
    if (isChallengeDeck) return m.id === 'flip'
    if (isSightReadDeck) return m.id === 'play'
    if (isAudioDeck && ['explain', 'play'].includes(m.id)) return false
    if (!isStaffDeck && m.id === 'play') return false
    return true
  })
  const isFlipMode = mode === 'flip'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mcOptions = useMemo(() => mode === 'mc' && currentCard ? getMCOptions(deck.cards) : [], [currentCard?.id, mode])
  // In flip mode we want click / Space to toggle both directions — flipping
  // back to the question is just as useful as flipping to the answer.
  const toggleFlipRevealed = () => setFlipRevealed(r => !r)
  const flipCardEl = !flipCard ? null
    : isChallengeDeck ? <ChallengeCard card={flipCard} revealed={flipRevealed} onReveal={toggleFlipRevealed} />
    : flipCard.type === 'audio' ? <AudioCard card={flipCard} revealed={flipRevealed} onReveal={toggleFlipRevealed} />
    : flipCard.type === 'symbol' ? <SymbolCard card={flipCard} revealed={flipRevealed} onReveal={toggleFlipRevealed} />
    : <FlipCard card={flipCard as any} revealed={flipRevealed} onReveal={toggleFlipRevealed} />

  function goNext() { setFlipIndex(i => Math.min(i + 1, flipCards.length - 1)); setFlipRevealed(false) }
  function goPrev() { setFlipIndex(i => Math.max(i - 1, 0)); setFlipRevealed(false) }
  function goBack() {
    if (mode === 'play') { stopMic() }
    // Honor a `?from=` hint when present (set by Practice links inside
    // Learn lessons) — but only if it's a same-origin relative path so
    // we never bounce to an arbitrary URL.
    const from = searchParams?.get('from')
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      router.push(from)
      return
    }
    // Default: route explicitly to the owning collection rather than
    // using history. Without this, users who jumped between decks in a
    // single session would land on the *previous* deck instead of the
    // index page. Decks with a `tier` live on /flashcards (including
    // `ear-to-paper`, which is an Application & Review deck despite its
    // `ear-` id prefix).
    const isEarTraining = deck.id.startsWith('ear-') && !deck.tier
    const target = isEarTraining ? '/ear-training' : '/flashcards'
    router.push(target)
  }

  // External mode request from mobile QuizEngine exit — apply once,
  // then signal back so the parent can clear the request.
  useEffect(() => {
    if (!pendingMode) return
    if (pendingMode === 'browse') {
      setViewMode('browse')
    } else {
      if (viewMode === 'browse') setViewMode('study')
      setMode(pendingMode)
      if (pendingMode !== 'flip') resetSession()
    }
    onPendingHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMode])

  // Mobile tab list — same deck-filtered modes as visibleModes plus
  // 'quiz' and 'browse' as first-class tabs (so the user is never
  // trapped inside one engine on mobile). Play uses an icon-only pill
  // so the five primary mode labels keep their full text at 11.5px.
  const mobileTabs = useMemo<MobileTab[]>(() => {
    const tabs: MobileTab[] = []
    if (visibleModes.find(m => m.id === 'flip')) tabs.push({ id: 'flip', label: 'Flip' })
    if (visibleModes.find(m => m.id === 'mc')) tabs.push({ id: 'mc', label: 'Choice' })
    if (visibleModes.find(m => m.id === 'explain')) tabs.push({ id: 'explain', label: 'Explain' })
    if (visibleModes.find(m => m.id === 'play')) tabs.push({ id: 'play', label: '✦', iconOnly: true })
    if (!isChallengeDeck && !isSightReadDeck) tabs.push({ id: 'quiz', label: 'Quiz', quizStyle: true })
    tabs.push({ id: 'browse', label: 'Browse' })
    return tabs
  }, [visibleModes, isChallengeDeck, isSightReadDeck])

  const mobileActiveTab: MobileTabMode = viewMode === 'browse' ? 'browse' : mode

  function handleMobileTabClick(target: MobileTabMode) {
    stopMic()
    if (target === 'quiz') {
      onQuiz()
      return
    }
    if (target === 'browse') {
      setViewMode('browse')
      return
    }
    if (viewMode === 'browse') setViewMode('study')
    setMode(target as StudyMode)
    if (target !== 'flip') resetSession()
  }

  const isPlayMode = mode === 'play'
  const [, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    // Fine-grained ticking only where centiseconds matter (sight-read).
    // Learning modes just show minutes, so 5s is plenty.
    const tickMs = isPlayMode ? 100 : 5000
    tickRef.current = setInterval(() => setTick(t => t + 1), tickMs)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [isPlayMode])

  const elapsedMs = Date.now() - stats.startTime
  const elapsed = Math.round(elapsedMs / 60000)

  // Best time tracking for sight-read decks
  const bestTimeKey = `notelab-best-time-${deck.id}`
  const [bestTime, setBestTime] = useState<number>(() =>
    typeof window !== 'undefined' ? parseFloat(localStorage.getItem(`notelab-best-time-${deck.id}`) ?? '0') : 0
  )
  const currentTime = elapsedMs / 1000
  const isNewBest = isSightReadDeck && isComplete && (bestTime === 0 || currentTime < bestTime)

  // Save and update best time when session completes with a new best
  // Stop mic when session completes
  useEffect(() => {
    if (isComplete && isSightReadDeck) {
      stopMic()
    }
  }, [isComplete])

  useEffect(() => {
    if (isNewBest && typeof window !== 'undefined') {
      localStorage.setItem(bestTimeKey, currentTime.toString())
      setBestTime(currentTime)
    }
  }, [isNewBest])

  const prevBest = bestTime
  const elapsedDisplay = isPlayMode
    ? (elapsedMs / 1000).toFixed(2) + 's'
    : elapsed < 1 ? '<1' : String(elapsed)
  const elapsedLabel = isPlayMode ? 'Time' : 'Minutes'
  const sessionMsg = stats.correct === stats.total ? 'Perfect session!' : stats.correct > stats.total * 0.8 ? 'Great work!' : 'Keep practicing!'

    if (showIntro) {
    return (
      <div className="nl-study-viewport nl-study-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#ECE3CC', borderRadius: '20px', border: '1px solid #D9CFAE', padding: '56px 48px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>𝄞</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>{deck.title}</h2>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-ui)', color: '#7A7060', lineHeight: 1.8, marginBottom: '8px' }}>A note will appear on the staff.</p>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-ui)', color: '#7A7060', lineHeight: 1.8, marginBottom: '36px' }}>Play it on your piano — the mic will detect the correct note and move to the next one automatically.</p>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-compact)', color: '#D9CFAE', marginBottom: '28px', letterSpacing: '0.05em' }}>Make sure your microphone is enabled.</p>
          <button onClick={() => { navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {}); resetTimer(); setShowIntro(false) }} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 40px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, letterSpacing: '0.08em', cursor: 'pointer' }}>Begin →</button>
          <div style={{ marginTop: '20px' }}>
            <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#D9CFAE' }}>← Back</button>
          </div>
        </div>
      </div>
    )
  }

return (
    <>
      {isComplete && viewMode === 'study' && (
        <div className="nl-study-viewport nl-study-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#ECE3CC', borderRadius: '16px', border: '1px solid #D9CFAE', padding: '64px 56px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.10)' }}>
            {isSightReadDeck && isNewBest && typeof window !== 'undefined' && (() => { localStorage.setItem(bestTimeKey, currentTime.toString()); return null })()}
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>♩</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', letterSpacing: '0.02em', marginBottom: '12px' }}>Session Complete</h2>
            <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', marginBottom: '36px', lineHeight: 1.7 }}>You reviewed {stats.total} card{stats.total !== 1 ? 's' : ''}. {sessionMsg}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '40px' }}>
              {(isSightReadDeck
              ? [{ num: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) + '%' : '—', label: 'Score' }, { num: `${stats.correct}/${stats.total}`, label: 'Notes' }, { num: elapsedDisplay, label: 'Time' }, { num: prevBest > 0 ? prevBest.toFixed(2) + 's' : '—', label: isNewBest ? '🏆 Best' : 'Best' }]
              : [{ num: stats.correct, label: 'Correct' }, { num: stats.bestStreak, label: 'Best Streak' }, { num: elapsedDisplay, label: elapsedLabel }]
            ).map(({ num, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '40px', color: '#2A2318', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { resetSession(); resetTimer(); setViewMode('study') }} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '14px 32px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Study Again</button>
              {isSightReadDeck && prevBest > 0 && <button onClick={() => { localStorage.removeItem(bestTimeKey); window.location.reload() }} style={{ background: 'transparent', color: '#7A7060', border: '1px solid #D9CFAE', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Reset Best</button>}
              {!isSightReadDeck && <button onClick={() => { stopMic(); setViewMode('browse') }} style={{ background: 'transparent', color: '#7A7060', border: '1px solid #D9CFAE', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Browse Cards</button>}
              <button onClick={goBack} className="nl-study-back-btn" style={{ padding: '12px 22px', fontSize: 'var(--nl-text-meta)' }}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {!isComplete && viewMode === 'browse' && !isMobile && (
        <div className="nl-study-viewport">
          {/* Header and mode switcher match the study-mode topbar's
              centered-column geometry so the page width stays the same
              when toggling between Study and Browse. */}
          <div style={{ borderBottom: '1px solid #D9CFAE', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', padding: '12px 24px', maxWidth: '760px', margin: '0 auto' }}>
              {/* Browse is a sub-view of the deck — "Back" returns to study
                  mode, NOT out of the deck entirely. To exit, use Back from
                  the study-mode header. */}
              <button onClick={() => setViewMode('study')} className="nl-study-back-btn">
                ← Back to Study
              </button>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '20px', color: '#2A2318' }}>{deck.title}</div>
              <span style={{ width: 1 }} aria-hidden />
            </div>
          </div>
          <div className="nl-study-scroll" style={{ padding: '20px 24px 24px', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
            <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', marginBottom: '20px' }}>{deck.cards.length} cards{deck.cards[0]?.type !== 'audio' ? ' — click any card to see the answer' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(deck.browseCards ?? deck.cards).map((card, i) => (
                <div key={card.id} onClick={() => card.type !== 'audio' && setBrowseExpanded(browseExpanded === card.id ? null : card.id)}
                  style={{ background: '#ECE3CC', border: `1px solid ${browseExpanded === card.id ? '#B5402A' : '#D9CFAE'}`, borderRadius: '12px', padding: '16px 20px', cursor: card.type !== 'audio' ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: 'var(--nl-text-compact)', color: '#D9CFAE', fontWeight: 400, minWidth: '24px', paddingTop: '2px' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      {card.type === 'audio' ? <AudioBrowseRow card={card} />
                        : card.type === 'symbol' ? (
                          <><p style={{ fontFamily: 'Bravura, serif', fontSize: '36px', color: '#2A2318', lineHeight: 1.4, marginBottom: browseExpanded === card.id ? '10px' : '0' }}>{card.front}{card.symbolName && <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', marginLeft: '12px' }}>{card.symbolName}</span>}</p>{browseExpanded === card.id && <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', lineHeight: 1.6, borderTop: '1px solid #EDE8DF', paddingTop: '10px' }}>{card.back}</p>}</>
                        ) : (
                          <><p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '18px', color: '#2A2318', marginBottom: browseExpanded === card.id ? '10px' : '0' }}>{card.front}</p>{browseExpanded === card.id && <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', lineHeight: 1.6, borderTop: '1px solid #EDE8DF', paddingTop: '10px' }}>{card.back}</p>}</>
                        )}
                    </div>
                    {card.type !== 'audio' && <span style={{ fontSize: 'var(--nl-text-compact)', color: '#D9CFAE', paddingTop: '2px' }}>{browseExpanded === card.id ? '▲' : '▼'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!(isComplete && viewMode === 'study') && (viewMode !== 'browse' || isMobile) && (
        <div className={`nl-study-viewport${isMobile ? ' nl-study-mobile-shell' : ''}`}>
          {isMobile ? (
            <MobileStudyChrome
              activeTab={mobileActiveTab}
              tabs={mobileTabs}
              onTabClick={handleMobileTabClick}
              onBack={goBack}
              deckName={deck.title}
              meta={
                stats.total > 0 ? (
                  <>
                    {formatTopbarTime(elapsedMs, isPlayMode)}<b>·</b>
                    <b>{stats.correct}/{stats.total}</b>
                  </>
                ) : (
                  <>
                    {formatTopbarTime(elapsedMs, isPlayMode)}<b>·</b>
                    <b>{queue.length > 0 ? `${sessionCardIndex}/${queue.length}` : '—'}</b>
                  </>
                )
              }
            />
          ) : (
            <>
          <header className="nl-study-topbar">
            <div className="nl-study-topbar__row1">
              <div className="nl-study-topbar__back">
                <button type="button" onClick={goBack} className="nl-study-back-btn">← Back</button>
              </div>
              <div className={`nl-study-topbar__metrics${stats.total > 0 ? '' : ' nl-study-topbar__metrics--pair'}`}>
                <div>
                  <span className="nl-study-topbar__metric-label">Session time</span>
                  <span className="nl-study-topbar__metric-value">{formatTopbarTime(elapsedMs, isPlayMode)}</span>
                </div>
                <div>
                  <span className="nl-study-topbar__metric-label">Answered</span>
                  <span className="nl-study-topbar__metric-value">
                    {queue.length > 0 ? `${sessionCardIndex} / ${queue.length}` : '—'}
                  </span>
                </div>
                {stats.total > 0 && (
                  <div>
                    <span className="nl-study-topbar__metric-label">Score</span>
                    <span className="nl-study-topbar__metric-value">{stats.correct} / {stats.total}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Subtle deck-title caption — low-contrast, centered, so the
                student always knows which deck they're in without the title
                competing with the metrics. */}
            <p style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 'var(--nl-text-compact)',
              fontStyle: 'italic',
              color: '#9A9081',
              letterSpacing: '0.03em',
              margin: 0,
              textAlign: 'center',
            }}>
              {deck.title}
            </p>
            <div className="nl-study-progress-rail" aria-hidden>
              <div className="nl-study-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </header>
          {!isSightReadDeck && (
            <div className="nl-study-mode-toolbar">
              <div
                className="nl-study-mode-row nl-study-mode-row--modes"
                data-mode-count={isChallengeDeck ? 1 : Math.min(visibleModes.length, 4)}
              >
                {isChallengeDeck ? (
                  // Challenge decks replace the "Flip" mode button with a
                  // contextual "Hide answer" control that only appears once
                  // the answer has been revealed. Before reveal, no button
                  // renders — the reveal itself happens inside the card.
                  flipRevealed && (
                    <button
                      type="button"
                      className="nl-study-mode-btn nl-study-mode-btn--active"
                      onClick={() => setFlipRevealed(false)}
                    >
                      Hide answer
                    </button>
                  )
                ) : (
                  visibleModes.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { stopMic(); setMode(id); if (id !== 'flip') resetSession() }}
                      className={`nl-study-mode-btn${mode === id ? ' nl-study-mode-btn--active' : ''}`}
                    >
                      {label}
                    </button>
                  ))
                )}
              </div>
              <div className="nl-study-mode-row nl-study-mode-row--actions">
                {!isChallengeDeck && (
                  <button type="button" className="nl-study-mode-btn nl-study-mode-btn--quiz" onClick={() => { stopMic(); onQuiz() }}>
                    Quiz
                  </button>
                )}
                <button type="button" className="nl-study-mode-btn nl-study-mode-btn--browse" onClick={() => { stopMic(); setViewMode('browse') }}>
                  Browse
                </button>
              </div>
            </div>
          )}
            </>
          )}
          <div
            className="nl-study-main"
            style={isChallengeDeck && !isMobile ? {
              // Challenge cards are prose — center them vertically inside
              // the available space instead of anchoring to the top.
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '24px 24px',
            } : undefined}
          >
            {isMobile && viewMode === 'browse' ? (
              <MobileBrowsePanel
                cards={deck.browseCards ?? deck.cards}
                expandedId={browseExpanded}
                onToggle={id => setBrowseExpanded(prev => (prev === id ? null : id))}
              />
            ) : isFlipMode ? flipCardEl : (mode === 'mc' || mode === 'explain') && currentCard ? (
              <div className="nl-study-mc-stack">
                {/* Streak moved out of the stack so MC/Explain's question
                    card starts at the same Y as the FlipCard. The global
                    streak row below the main area now shows in every mode. */}
                {mode === 'mc' && currentCard.type === 'audio' && <AudioCard key={currentCard.id + '-audio'} card={currentCard} revealed={false} onReveal={() => {}} compact hideReveal />}
                {mode === 'mc' ? (
                  <MultipleChoice key={currentCard.id} card={currentCard} options={mcOptions} onAnswer={recordAnswer} onReveal={reveal} mobile={isMobile} />
                ) : (
                  <ExplainCard key={currentCard.id} card={currentCard} onAnswer={recordAnswer} onReveal={reveal} mobile={isMobile} />
                )}
              </div>
            ) : mode === 'play' && currentCard ? (
              <PlayItCard2 key={currentCard.id} card={currentCard} onCorrect={(firstTry: boolean) => { recordAnswer(firstTry); rate(3) }} onWrong={() => {}} />
            ) : null}
          </div>
          {viewMode !== 'browse' && (
            <>
          <div
            role="group"
            aria-label="Last ten answers in this session"
            className="nl-study-streak"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              padding: 'clamp(10px, 2vmin, 18px) 32px clamp(10px, 2vmin, 18px)',
              flexShrink: 0,
            }}
          >
            {stats.streakHistory.slice(-10).map((result, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: result === 'hit' ? '#B5402A' : '#F09595' }} />
            ))}
          </div>
          <div className="nl-study-flip-nav" style={{ display: isFlipMode ? 'flex' : 'none' }}>
            <button
              type="button"
              className="nl-study-flip-nav__btn"
              onClick={goPrev}
              disabled={flipIndex === 0}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 500, color: '#7A7060', flexShrink: 0 }}>{flipIndex + 1} / {flipCards.length}</span>
            <button
              type="button"
              className="nl-study-flip-nav__btn"
              onClick={goNext}
              disabled={flipIndex === flipCards.length - 1}
            >
              Next →
            </button>
          </div>
          {!isFlipMode && mode !== 'play' && (
            <div className="nl-study-rate-footer">
              <div
                className="nl-study-rate-inner"
                style={{ visibility: revealed ? 'visible' : 'hidden' }}
                aria-hidden={!revealed}
              >
                {([{ rating: 1, label: 'Again', interval: intervals.again, bg: '#FCEBEB', border: '#F09595', color: '#A32D2D' }, { rating: 2, label: 'Hard', interval: intervals.hard, bg: '#FAEEDA', border: '#FAC775', color: '#B5402A' }, { rating: 3, label: 'Easy', interval: intervals.easy, bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11' }] as const).map(({ rating, label, interval, bg, border, color }) => (
                  <button
                    key={rating}
                    type="button"
                    className="nl-study-rate-btn"
                    onClick={() => rate(rating)}
                    style={{ borderColor: border, background: bg, color }}
                  >
                    <span style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, letterSpacing: '0.05em' }}>{label}</span>
                    <span style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, opacity: 0.7 }}>{interval}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
            </>
          )}
          {viewMode === 'browse' && isMobile && (
            <div className="nl-study-mobile-browse-footer">
              {(deck.browseCards ?? deck.cards).length} cards in this deck
            </div>
          )}
        </div>
      )}
    </>
  )
}
