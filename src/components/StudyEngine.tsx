'use client'

import { useState, useMemo, useEffect } from 'react'
import { Deck, StudyMode } from '@/lib/types'
import { useStudySession } from '@/hooks/useStudySession'
import FlipCard from '@/components/cards/FlipCard'
import MultipleChoice from '@/components/cards/MultipleChoice'
import SymbolCard from '@/components/cards/SymbolCard'
import AudioCard from '@/components/cards/AudioCard'
import AudioBrowseRow from '@/components/cards/AudioBrowseRow'
import ExplainCard from '@/components/cards/ExplainCard'
import PlayItCard, { stopMic as stopMicOld } from '@/components/cards/PlayItCard'
import { stopMic as stopMicNew } from '@/components/cards/PlayItCard2'
import PlayItCard2 from '@/components/cards/PlayItCard2'
import { useRouter } from 'next/navigation'

interface StudyEngineProps { deck: Deck; userId: string | null; onQuiz: () => void }
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

export default function StudyEngine({ deck, userId, onQuiz }: StudyEngineProps) {
  const router = useRouter()
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
  const visibleModes = STUDY_MODES.filter(m => {
    if (isSightReadDeck) return m.id === 'play'
    if (isAudioDeck && ['explain', 'play'].includes(m.id)) return false
    if (!isStaffDeck && m.id === 'play') return false
    return true
  })
  const isFlipMode = mode === 'flip'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mcOptions = useMemo(() => mode === 'mc' && currentCard ? getMCOptions(deck.cards) : [], [currentCard?.id, mode])
  const flipCardEl = !flipCard ? null
    : flipCard.type === 'audio' ? <AudioCard card={flipCard} revealed={flipRevealed} onReveal={() => setFlipRevealed(true)} />
    : flipCard.type === 'symbol' ? <SymbolCard card={flipCard} revealed={flipRevealed} onReveal={() => setFlipRevealed(true)} />
    : <FlipCard card={flipCard as any} revealed={flipRevealed} onReveal={() => setFlipRevealed(true)} />

  function goNext() { setFlipIndex(i => Math.min(i + 1, flipCards.length - 1)); setFlipRevealed(false) }
  function goPrev() { setFlipIndex(i => Math.max(i - 1, 0)); setFlipRevealed(false) }
  function goBack() {
    if (mode === 'play') { stopMicOld(); stopMicNew() }
    router.back()
  }

  const elapsedMs = Date.now() - stats.startTime
  const elapsed = Math.round(elapsedMs / 60000)
  const isPlayMode = mode === 'play'

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
      stopMicNew()
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
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '56px 48px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>𝄞</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>{deck.title}</h2>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-ui)', color: '#7A7060', lineHeight: 1.8, marginBottom: '8px' }}>A note will appear on the staff.</p>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-ui)', color: '#7A7060', lineHeight: 1.8, marginBottom: '36px' }}>Play it on your piano — the mic will detect the correct note and move to the next one automatically.</p>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', marginBottom: '28px', letterSpacing: '0.05em' }}>Make sure your microphone is enabled.</p>
          <button onClick={() => { navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {}); resetTimer(); setShowIntro(false) }} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 40px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, letterSpacing: '0.08em', cursor: 'pointer' }}>Begin →</button>
          <div style={{ marginTop: '20px' }}>
            <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#DDD8CA' }}>← Back</button>
          </div>
        </div>
      </div>
    )
  }

return (
    <>
      {isComplete && viewMode === 'study' && (
        <div className="nl-study-viewport nl-study-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '64px 56px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.10)' }}>
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
              <button onClick={() => { resetSession(); setViewMode('study') }} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '14px 32px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Study Again</button>
              {isSightReadDeck && prevBest > 0 && <button onClick={() => { localStorage.removeItem(bestTimeKey); window.location.reload() }} style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Reset Best</button>}
              {!isSightReadDeck && <button onClick={() => { stopMicOld(); stopMicNew(); setViewMode('browse') }} style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Browse Cards</button>}
              <button onClick={goBack} style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {!isComplete && viewMode === 'browse' && (
        <div className="nl-study-viewport">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: '1px solid #DDD8CA', flexShrink: 0 }}>
            <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>← Back</button>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '20px', color: '#2A2318' }}>{deck.title}</div>
            <button onClick={() => setViewMode('study')} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>Study →</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '12px 32px 0', flexShrink: 0 }}>
            <button onClick={() => setViewMode('study')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #DDD8CA', background: 'transparent', color: '#7A7060', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>Study</button>
            <button style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #1A1A18', background: '#1A1A18', color: 'white', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>Browse</button>
          </div>
          <div className="nl-study-scroll" style={{ padding: '16px 32px 24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
            <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', marginBottom: '20px' }}>{deck.cards.length} cards{deck.cards[0]?.type !== 'audio' ? ' — click any card to see the answer' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(deck.browseCards ?? deck.cards).map((card, i) => (
                <div key={card.id} onClick={() => card.type !== 'audio' && setBrowseExpanded(browseExpanded === card.id ? null : card.id)}
                  style={{ background: '#FDFAF3', border: `1px solid ${browseExpanded === card.id ? '#B5402A' : '#DDD8CA'}`, borderRadius: '12px', padding: '16px 20px', cursor: card.type !== 'audio' ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', fontWeight: 400, minWidth: '24px', paddingTop: '2px' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      {card.type === 'audio' ? <AudioBrowseRow card={card} />
                        : card.type === 'symbol' ? (
                          <><p style={{ fontFamily: 'Bravura, serif', fontSize: '36px', color: '#2A2318', lineHeight: 1.4, marginBottom: browseExpanded === card.id ? '10px' : '0' }}>{card.front}{card.symbolName && <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', marginLeft: '12px' }}>{card.symbolName}</span>}</p>{browseExpanded === card.id && <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', lineHeight: 1.6, borderTop: '1px solid #EDE8DF', paddingTop: '10px' }}>{card.back}</p>}</>
                        ) : (
                          <><p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '18px', color: '#2A2318', marginBottom: browseExpanded === card.id ? '10px' : '0' }}>{card.front}</p>{browseExpanded === card.id && <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', lineHeight: 1.6, borderTop: '1px solid #EDE8DF', paddingTop: '10px' }}>{card.back}</p>}</>
                        )}
                    </div>
                    {card.type !== 'audio' && <span style={{ fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', paddingTop: '2px' }}>{browseExpanded === card.id ? '▲' : '▼'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!(isComplete && viewMode === 'study') && viewMode !== 'browse' && (
        <div className="nl-study-viewport">
          <div style={{ position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 32px 8px', flexShrink: 0, flexWrap: 'wrap' as const }}>
            <div style={{ position: 'relative' as const, zIndex: 1, flexShrink: 0, background: '#f2eddf', paddingRight: '12px' }}>
              <button type="button" onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', padding: '2px 0' }}>← Back</button>
            </div>
            <div
              aria-hidden
              style={{
                position: 'absolute' as const,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(400px, calc(100% - 64px))',
                minWidth: '120px',
                height: '4px',
                background: '#DDD8CA',
                borderRadius: '2px',
                overflow: 'hidden',
                pointerEvents: 'none' as const,
                zIndex: 0,
              }}
            >
              <div style={{ height: '100%', width: `${progressPct}%`, background: '#B5402A', borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(16px, 3vw, 28px)', flexShrink: 0, position: 'relative' as const, zIndex: 1, background: '#f2eddf', paddingLeft: '8px', marginLeft: 'auto' }}>
              <div style={{ textAlign: 'right' as const }}>
                <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#B0ACA4', display: 'block', marginBottom: '2px' }}>Session time</span>
                <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 500, color: '#2A2318', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsedMs)}</span>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#B0ACA4', display: 'block', marginBottom: '2px' }}>Answered</span>
                <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 500, color: '#2A2318', fontVariantNumeric: 'tabular-nums' }}>
                  {queue.length > 0 ? `${sessionCardIndex} / ${queue.length}` : '—'}
                </span>
              </div>
              {stats.total > 0 && (
                <div style={{ textAlign: 'right' as const }}>
                  <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#B0ACA4', display: 'block', marginBottom: '2px' }}>Score</span>
                  <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 500, color: '#2A2318', fontVariantNumeric: 'tabular-nums' }}>{stats.correct} / {stats.total}</span>
                </div>
              )}
            </div>
          </div>
          {!isSightReadDeck && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '0 32px 8px', flexWrap: 'wrap', flexShrink: 0 }}>
            {visibleModes.map(({ id, label }) => (
              <button key={id} onClick={() => { stopMicOld(); stopMicNew(); setMode(id); if (id !== 'flip') resetSession() }}
                style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${mode === id ? '#1A1A18' : '#DDD8CA'}`, background: mode === id ? '#1A1A18' : 'transparent', color: mode === id ? 'white' : '#7A7060', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
            ))}
            {!isSightReadDeck && <div style={{ width: '1px', height: '16px', background: '#DDD8CA', margin: '0 4px' }} />}
            <>
            <button onClick={() => { stopMicOld(); stopMicNew(); onQuiz() }} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid #DDD8CA', background: 'transparent', color: '#7A7060', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>Quiz</button>
            <button onClick={() => { stopMicOld(); stopMicNew(); setViewMode('browse') }} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid #DDD8CA', background: 'transparent', color: '#7A7060', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>Browse</button>
            </>
          </div>}
          <div
            className="nl-study-main"
            style={(mode === 'mc' || mode === 'explain') && currentCard && !isFlipMode ? { alignItems: 'stretch' } : undefined}
          >
            {isFlipMode ? flipCardEl : (mode === 'mc' || mode === 'explain') && currentCard ? (
              <div
                style={{
                  alignSelf: 'stretch',
                  width: '100%',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    flex: 1,
                    minHeight: 0,
                    display: 'grid',
                    boxSizing: 'border-box',
                    gridTemplateRows: 'minmax(4px, 0.33fr) auto minmax(2px, 0.24fr) auto',
                    justifyItems: 'stretch',
                    alignContent: 'start',
                    paddingTop: mode === 'explain' ? 'clamp(52px, 10vh, 98px)' : undefined,
                  }}
                >
                  <div style={{ minHeight: 0 }} />
                  <div
                    role="group"
                    aria-label="Last ten answers in this session"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '6px',
                      justifySelf: 'center',
                      padding: '0 32px',
                      flexShrink: 0,
                    }}
                  >
                    {stats.streakHistory.slice(-10).map((result, i) => (
                      <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: result === 'hit' ? '#B5402A' : '#F09595' }} />
                    ))}
                  </div>
                  <div style={{ minHeight: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', minHeight: 0 }}>
                    {mode === 'mc' && currentCard.type === 'audio' && <AudioCard key={currentCard.id + '-audio'} card={currentCard} revealed={false} onReveal={() => {}} compact hideReveal />}
                    {mode === 'mc' ? (
                      <MultipleChoice key={currentCard.id} card={currentCard} options={mcOptions} onAnswer={recordAnswer} onReveal={reveal} />
                    ) : (
                      <ExplainCard key={currentCard.id} card={currentCard} onAnswer={recordAnswer} onReveal={reveal} />
                    )}
                  </div>
                </div>
              </div>
            ) : mode === 'play' && currentCard ? (
              <PlayItCard2 key={currentCard.id} card={currentCard} onCorrect={(firstTry: boolean) => { recordAnswer(firstTry); rate(3) }} onWrong={() => {}} />
            ) : null}
          </div>
          {!((mode === 'mc' || mode === 'explain') && currentCard && !isFlipMode) && (
          <div
            role="group"
            aria-label="Last ten answers in this session"
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
          )}
          <div style={{ display: isFlipMode ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '6px 32px 10px', flexShrink: 0 }}>
            <button onClick={goPrev} disabled={flipIndex === 0} style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '10px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: flipIndex === 0 ? '#DDD8CA' : '#7A7060', cursor: flipIndex === 0 ? 'default' : 'pointer' }}>← Prev</button>
            <span style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>{flipIndex + 1} / {flipCards.length}</span>
            <button onClick={goNext} disabled={flipIndex === flipCards.length - 1} style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '10px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: flipIndex === flipCards.length - 1 ? '#DDD8CA' : '#7A7060', cursor: flipIndex === flipCards.length - 1 ? 'default' : 'pointer' }}>Next →</button>
          </div>
          {!isFlipMode && mode !== 'play' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '64px',
                marginTop: 'clamp(10px, 2vmin, 18px)',
                padding: '8px 32px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  visibility: revealed ? 'visible' : 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
                aria-hidden={!revealed}
              >
                {([{ rating: 1, label: 'Again', interval: intervals.again, bg: '#FCEBEB', border: '#F09595', color: '#A32D2D' }, { rating: 2, label: 'Hard', interval: intervals.hard, bg: '#FAEEDA', border: '#FAC775', color: '#B5402A' }, { rating: 3, label: 'Easy', interval: intervals.easy, bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11' }] as const).map(({ rating, label, interval, bg, border, color }) => (
                  <button key={rating} onClick={() => rate(rating)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '14px 32px', borderRadius: '8px', border: `1.5px solid ${border}`, background: bg, color, cursor: 'pointer', minWidth: '120px', fontFamily: 'var(--font-jost), sans-serif', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, letterSpacing: '0.05em' }}>{label}</span>
                    <span style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, opacity: 0.7 }}>{interval}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
