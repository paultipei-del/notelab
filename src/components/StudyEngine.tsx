'use client'

import { useState, useMemo } from 'react'
import { Deck, StudyMode } from '@/lib/types'
import { useStudySession } from '@/hooks/useStudySession'
import FlipCard from '@/components/cards/FlipCard'
import MultipleChoice from '@/components/cards/MultipleChoice'
import TypeAnswer from '@/components/cards/TypeAnswer'
import SymbolCard from '@/components/cards/SymbolCard'
import AudioCard from '@/components/cards/AudioCard'
import AudioBrowseRow from '@/components/cards/AudioBrowseRow'
import ExplainCard from '@/components/cards/ExplainCard'
import PlayItCard from '@/components/cards/PlayItCard'
import { useRouter } from 'next/navigation'

interface StudyEngineProps { deck: Deck; userId: string | null; onQuiz: () => void }
type ViewMode = 'study' | 'browse'
const STUDY_MODES: { id: StudyMode; label: string }[] = [
  { id: 'flip', label: 'Flip' }, { id: 'mc', label: 'Multiple Choice' },
  { id: 'type', label: 'Type Answer' }, { id: 'explain', label: 'Explain It' },
  { id: 'play', label: 'Play It' },
]

export default function StudyEngine({ deck, userId, onQuiz }: StudyEngineProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('study')
  const [browseExpanded, setBrowseExpanded] = useState<number | null>(null)
  const [flipIndex, setFlipIndex] = useState(0)
  const [flipRevealed, setFlipRevealed] = useState(false)
  const { currentCard, mode, revealed, stats, isComplete, progressPct, progressLabel, intervals, reveal, rate, recordAnswer, setMode, getMCOptions, resetSession } = useStudySession(deck, userId)
  const flipCards = useMemo(() => [...deck.cards].sort(() => Math.random() - 0.5), [deck.id])
  const flipCard = flipCards[flipIndex] ?? null
  const isAudioDeck = deck.cards.every(c => c.type === 'audio')
  const isStaffDeck = deck.cards.some(c => c.type === 'staff')
  const visibleModes = STUDY_MODES.filter(m => {
    if (isAudioDeck && ['type', 'explain', 'play'].includes(m.id)) return false
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
    const tag = deck.id.startsWith('cm-') ? 'cm' : deck.id.startsWith('ear-') ? 'ear' : deck.id.startsWith('symbols-') ? 'symbols' : null
    if (tag) router.push('/collection?tag=' + tag); else router.push('/')
  }

  const elapsed = Math.round((Date.now() - stats.startTime) / 60000)
  const sessionMsg = stats.correct === stats.total ? 'Perfect session!' : stats.correct > stats.total * 0.8 ? 'Great work!' : 'Keep practicing!'

  return (
    <>
      {isComplete && viewMode === 'study' && (
        <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '64px 56px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.10)' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>♩</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', letterSpacing: '0.02em', marginBottom: '12px' }}>Session Complete</h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: '#888780', marginBottom: '36px', lineHeight: 1.7 }}>You reviewed {stats.total} card{stats.total !== 1 ? 's' : ''}. {sessionMsg}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '40px' }}>
              {[{ num: stats.correct, label: 'Correct' }, { num: stats.bestStreak, label: 'Best Streak' }, { num: elapsed < 1 ? '<1' : elapsed, label: 'Minutes' }].map(({ num, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '40px', color: '#1A1A18', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { resetSession(); setViewMode('study') }} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '14px 32px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>Study Again</button>
              <button onClick={() => setViewMode('browse')} style={{ background: 'transparent', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>Browse Cards</button>
              <button onClick={goBack} style={{ background: 'transparent', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '14px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {!isComplete && viewMode === 'browse' && (
        <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' }}>
            <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '20px', color: '#1A1A18' }}>{deck.title}</div>
            <button onClick={() => setViewMode('study')} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>Study →</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '20px 32px 0' }}>
            <button onClick={() => setViewMode('study')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #D3D1C7', background: 'transparent', color: '#888780', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>Study</button>
            <button style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #1A1A18', background: '#1A1A18', color: 'white', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>Browse</button>
          </div>
          <div style={{ padding: '20px 32px 64px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
            <p style={{ fontSize: '13px', fontWeight: 300, color: '#888780', marginBottom: '20px' }}>{deck.cards.length} cards{deck.cards[0]?.type !== 'audio' ? ' — click any card to see the answer' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deck.cards.map((card, i) => (
                <div key={card.id} onClick={() => card.type !== 'audio' && setBrowseExpanded(browseExpanded === card.id ? null : card.id)}
                  style={{ background: 'white', border: `1px solid ${browseExpanded === card.id ? '#BA7517' : '#D3D1C7'}`, borderRadius: '12px', padding: '16px 20px', cursor: card.type !== 'audio' ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#D3D1C7', fontWeight: 300, minWidth: '24px', paddingTop: '2px' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      {card.type === 'audio' ? <AudioBrowseRow card={card} />
                        : card.type === 'symbol' ? (
                          <><p style={{ fontFamily: 'Bravura, serif', fontSize: '36px', color: '#1A1A18', lineHeight: 1.4, marginBottom: browseExpanded === card.id ? '10px' : '0' }}>{card.front}{card.symbolName && <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '14px', fontWeight: 300, color: '#888780', marginLeft: '12px' }}>{card.symbolName}</span>}</p>{browseExpanded === card.id && <p style={{ fontSize: '14px', fontWeight: 300, color: '#888780', lineHeight: 1.6, borderTop: '1px solid #EDE8DF', paddingTop: '10px' }}>{card.back}</p>}</>
                        ) : (
                          <><p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '18px', color: '#1A1A18', marginBottom: browseExpanded === card.id ? '10px' : '0' }}>{card.front}</p>{browseExpanded === card.id && <p style={{ fontSize: '14px', fontWeight: 300, color: '#888780', lineHeight: 1.6, borderTop: '1px solid #EDE8DF', paddingTop: '10px' }}>{card.back}</p>}</>
                        )}
                    </div>
                    {card.type !== 'audio' && <span style={{ fontSize: '12px', color: '#D3D1C7', paddingTop: '2px' }}>{browseExpanded === card.id ? '▲' : '▼'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!(isComplete && viewMode === 'study') && viewMode !== 'browse' && (
        <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', gap: '16px' }}>
            <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
            <div style={{ flex: 1, maxWidth: '400px', height: '4px', background: '#D3D1C7', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: '#BA7517', borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 300, color: '#888780', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{progressLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '0 32px 20px', flexWrap: 'wrap' }}>
            {visibleModes.map(({ id, label }) => (
              <button key={id} onClick={() => { setMode(id); if (id !== 'flip') resetSession() }}
                style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${mode === id ? '#1A1A18' : '#D3D1C7'}`, background: mode === id ? '#1A1A18' : 'transparent', color: mode === id ? 'white' : '#888780', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
            ))}
            <div style={{ width: '1px', height: '16px', background: '#D3D1C7', margin: '0 4px' }} />
            <button onClick={onQuiz} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid #D3D1C7', background: 'transparent', color: '#888780', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>Quiz</button>
            <button onClick={() => setViewMode('browse')} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid #D3D1C7', background: 'transparent', color: '#888780', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>Browse</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '0 32px 16px', minHeight: '22px' }}>
            {stats.streakHistory.slice(-10).map((result, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: result === 'hit' ? '#BA7517' : '#F09595' }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 8px' }}>
            {isFlipMode ? flipCardEl : mode === 'mc' && currentCard ? (
              <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentCard.type === 'audio' && <AudioCard key={currentCard.id + '-audio'} card={currentCard} revealed={false} onReveal={() => {}} compact hideReveal />}
                <MultipleChoice key={currentCard.id} card={currentCard} options={mcOptions} onAnswer={recordAnswer} onReveal={reveal} />
              </div>
            ) : mode === 'type' && currentCard ? (
              <TypeAnswer key={currentCard.id} card={currentCard} onAnswer={recordAnswer} onReveal={reveal} />
            ) : mode === 'explain' && currentCard ? (
              <ExplainCard key={currentCard.id} card={currentCard} onAnswer={recordAnswer} onReveal={reveal} />
            ) : mode === 'play' && currentCard ? (
              <PlayItCard key={currentCard.id} card={currentCard} onCorrect={() => { recordAnswer(true); reveal() }} />
            ) : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '8px 32px 16px', visibility: isFlipMode ? 'visible' : 'hidden' }}>
            <button onClick={goPrev} disabled={flipIndex === 0} style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '10px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: flipIndex === 0 ? '#D3D1C7' : '#888780', cursor: flipIndex === 0 ? 'default' : 'pointer' }}>← Prev</button>
            <span style={{ fontSize: '12px', fontWeight: 300, color: '#888780' }}>{flipIndex + 1} / {flipCards.length}</span>
            <button onClick={goNext} disabled={flipIndex === flipCards.length - 1} style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '10px 24px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: flipIndex === flipCards.length - 1 ? '#D3D1C7' : '#888780', cursor: flipIndex === flipCards.length - 1 ? 'default' : 'pointer' }}>Next →</button>
          </div>
          {!isFlipMode && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '12px 32px 16px', flexWrap: 'wrap', visibility: revealed ? 'visible' : 'hidden', minHeight: '80px', alignItems: 'center' }}>
              {([{ rating: 1, label: 'Again', interval: intervals.again, bg: '#FCEBEB', border: '#F09595', color: '#A32D2D' }, { rating: 2, label: 'Hard', interval: intervals.hard, bg: '#FAEEDA', border: '#FAC775', color: '#BA7517' }, { rating: 3, label: 'Easy', interval: intervals.easy, bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11' }] as const).map(({ rating, label, interval, bg, border, color }) => (
                <button key={rating} onClick={() => rate(rating)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '14px 32px', borderRadius: '8px', border: `1.5px solid ${border}`, background: bg, color, cursor: 'pointer', minWidth: '120px', fontFamily: 'var(--font-jost), sans-serif', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 300, opacity: 0.7 }}>{interval}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
