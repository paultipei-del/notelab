'use client'

import { Deck, StudyMode } from '@/lib/types'
import { useStudySession } from '@/hooks/useStudySession'
import FlipCard from '@/components/cards/FlipCard'
import MultipleChoice from '@/components/cards/MultipleChoice'
import TypeAnswer from '@/components/cards/TypeAnswer'
import { useRouter } from 'next/navigation'

const MODES: { id: StudyMode; label: string }[] = [
  { id: 'flip', label: 'Flip' },
  { id: 'mc', label: 'Multiple Choice' },
  { id: 'type', label: 'Type Answer' },
]

interface StudyEngineProps {
  deck: Deck
}

export default function StudyEngine({ deck }: StudyEngineProps) {
  const router = useRouter()
  const {
    currentCard,
    mode,
    revealed,
    stats,
    isComplete,
    progressPct,
    progressLabel,
    intervals,
    reveal,
    rate,
    recordAnswer,
    setMode,
    getMCOptions,
  } = useStudySession(deck)

  // ── COMPLETE SCREEN ──
  if (isComplete) {
    const elapsed = Math.round((Date.now() - stats.startTime) / 60000)
    const msg =
      stats.correct === stats.total ? 'Perfect session!' :
      stats.correct > stats.total * 0.8 ? 'Great work!' : 'Keep practicing!'

    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '64px 56px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.10)' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>♩</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', letterSpacing: '0.02em', marginBottom: '12px' }}>
            Session Complete
          </h2>
          <p style={{ fontSize: '14px', fontWeight: 300, color: '#888780', marginBottom: '36px', lineHeight: 1.7, letterSpacing: '0.02em' }}>
            You reviewed {stats.total} card{stats.total !== 1 ? 's' : ''}. {msg}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '40px' }}>
            {[
              { num: stats.correct, label: 'Correct' },
              { num: stats.bestStreak, label: 'Best Streak' },
              { num: elapsed < 1 ? '<1' : elapsed, label: 'Minutes' },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '40px', color: '#1A1A18', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/')}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '16px 40px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, letterSpacing: '0.08em', cursor: 'pointer' }}
          >
            Back to Decks
          </button>
        </div>
      </div>
    )
  }

  if (!currentCard) return null

  const mcOptions = mode === 'mc' ? getMCOptions(deck.cards) : []

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', gap: '16px' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, maxWidth: '400px', height: '4px', background: '#D3D1C7', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: '#BA7517', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>

        <span style={{ fontSize: '12px', fontWeight: 300, color: '#888780', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
          {progressLabel}
        </span>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '0 32px 20px' }}>
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              background: mode === id ? '#1A1A18' : 'none',
              border: `1px solid ${mode === id ? '#1A1A18' : '#D3D1C7'}`,
              borderRadius: '20px',
              padding: '5px 14px',
              fontFamily: 'var(--font-jost), sans-serif',
              fontSize: '12px',
              fontWeight: 300,
              letterSpacing: '0.05em',
              color: mode === id ? 'white' : '#888780',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Streak dots */}
      {stats.streakHistory.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '0 32px 16px', minHeight: '28px' }}>
          {stats.streakHistory.slice(-10).map((result, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: result === 'hit' ? '#BA7517' : '#F09595' }} />
          ))}
        </div>
      )}

      {/* Card stage */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 24px' }}>
        {mode === 'flip' && (
          <FlipCard card={currentCard} revealed={revealed} onReveal={reveal} />
        )}
        {mode === 'mc' && (
          <MultipleChoice card={currentCard} options={mcOptions} onAnswer={recordAnswer} onReveal={reveal} />
        )}
        {mode === 'type' && (
          <TypeAnswer card={currentCard} onAnswer={recordAnswer} onReveal={reveal} />
        )}
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '24px 32px', flexWrap: 'wrap' }}>
          {[
            { rating: 1 as const, label: 'Again', interval: intervals.again, bg: '#FCEBEB', border: '#F09595', color: '#A32D2D', hover: '#F7C1C1' },
            { rating: 2 as const, label: 'Hard', interval: intervals.hard, bg: '#FAEEDA', border: '#FAC775', color: '#BA7517', hover: '#FAC775' },
            { rating: 3 as const, label: 'Easy', interval: intervals.easy, bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11', hover: '#C0DD97' },
          ].map(({ rating, label, interval, bg, border, color }) => (
            <button
              key={rating}
              onClick={() => rate(rating)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '14px 32px', borderRadius: '8px', border: `1.5px solid ${border}`,
                background: bg, color, cursor: 'pointer', minWidth: '120px',
                fontFamily: 'var(--font-jost), sans-serif', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '0.05em' }}>{label}</span>
              <span style={{ fontSize: '11px', fontWeight: 300, opacity: 0.7, letterSpacing: '0.03em' }}>{interval}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}