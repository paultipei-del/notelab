'use client'

import { useState, useMemo } from 'react'
import { Deck } from '@/lib/types'
import { useQuizSession } from '@/hooks/useQuizSession'
import AudioCard from '@/components/cards/AudioCard'
import SymbolCard from '@/components/cards/SymbolCard'
import { useRouter } from 'next/navigation'

interface QuizEngineProps {
  deck: Deck
  onExit: () => void
}

// Format quiz duration as "M:SS" for anything ≥ 10s, "Ns" below that.
function formatQuizTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  if (totalSec < 10) return `${totalSec}s`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function QuizEngine({ deck, onExit }: QuizEngineProps) {
  const router = useRouter()
  const {
    currentCard,
    index,
    total,
    isComplete,
    chosen,
    score,
    missed,
    elapsedMs,
    getMCOptions,
    answer,
  } = useQuizSession(deck)

  const [showMissed, setShowMissed] = useState(false)

  // ── RESULTS SCREEN ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => currentCard ? getMCOptions(currentCard) : [], [currentCard?.id])
  const correctAnswer = currentCard?.type === 'symbol'
    ? (currentCard.symbolName ?? currentCard.back)
    : currentCard?.back ?? ''

  if (isComplete) {
    const pct = Math.round((score / total) * 100)
    const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'
    const gradeColor = pct >= 80 ? '#3B6D11' : pct >= 60 ? '#B5402A' : '#A32D2D'
    const gradeBg = pct >= 80 ? '#EAF3DE' : pct >= 60 ? '#FAEEDA' : '#FCEBEB'

    return (
      <div className="nl-study-viewport nl-study-scroll" style={{ alignItems: 'center', padding: '32px 24px' }}>
        <div style={{ background: '#ECE3CC', border: '1px solid #D9CFAE', borderRadius: '20px', padding: '40px 32px', maxWidth: '560px', width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.08)', marginBottom: '24px' }}>

          {/* Grade */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: gradeBg, marginBottom: '24px' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '42px', fontWeight: 300, color: gradeColor }}>{grade}</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '8px' }}>
            Quiz Complete
          </h2>
          <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', marginBottom: '32px' }}>
            {deck.title}
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '36px', flexWrap: 'wrap' }}>
            {[
              { num: `${score}/${total}`, label: 'Correct' },
              { num: `${pct}%`, label: 'Score' },
              { num: missed.length, label: 'Missed' },
              { num: formatQuizTime(elapsedMs), label: 'Time' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', color: '#2A2318', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onExit}
              style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, letterSpacing: '0.06em', cursor: 'pointer' }}>
              Back to Deck
            </button>
            {missed.length > 0 && (
              <button onClick={() => setShowMissed(v => !v)}
                style={{ background: 'transparent', color: '#7A7060', border: '1px solid #D9CFAE', borderRadius: '8px', padding: '12px 20px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
                {showMissed ? 'Hide' : 'Review'} Missed ({missed.length})
              </button>
            )}
          </div>
        </div>

        {/* Missed cards list */}
        {showMissed && missed.length > 0 && (
          <div style={{ maxWidth: '560px', width: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '22px', color: '#2A2318', marginBottom: '16px' }}>
              Missed Cards
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {missed.map((result, i) => (
                <div key={i} style={{ background: '#ECE3CC', border: '1px solid #F09595', borderRadius: '12px', padding: '16px 20px' }}>
                  <p style={{ fontFamily: result.card.type === 'symbol' ? 'Bravura, serif' : 'var(--font-cormorant), serif', fontSize: result.card.type === 'symbol' ? '32px' : '16px', fontWeight: 400, color: '#2A2318', marginBottom: '6px', lineHeight: 1.4 }}>
                    {result.card.type === 'symbol' ? result.card.front : result.card.front}
                    {result.card.symbolName && (
                      <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', marginLeft: '10px' }}>
                        {result.card.symbolName}
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#3B6D11', marginBottom: '2px' }}>
                    ✓ {result.card.type === 'symbol' ? (result.card.symbolName ?? result.card.back) : result.card.back}
                  </p>
                  <p style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#A32D2D' }}>
                    ✗ {result.chosen}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // ── QUIZ QUESTION ──
  if (!currentCard) return null
  const progressPct = (index / total) * 100
  const answeredSoFar = chosen ? index + 1 : index

  return (
    <div className="nl-study-viewport">
      {/* Topbar — mirrors StudyEngine so Quiz reads as the same surface */}
      <header className="nl-study-topbar">
        <div className="nl-study-topbar__row1">
          <div className="nl-study-topbar__back">
            <button type="button" onClick={onExit} className="nl-study-back-btn">
              ← Back
            </button>
          </div>
          <div className="nl-study-topbar__metrics nl-study-topbar__metrics--pair">
            <div>
              <span className="nl-study-topbar__metric-label">Answered</span>
              <span className="nl-study-topbar__metric-value">{index + 1} / {total}</span>
            </div>
            <div>
              <span className="nl-study-topbar__metric-label">Score</span>
              <span className="nl-study-topbar__metric-value">
                {score} / {answeredSoFar > 0 ? answeredSoFar : '—'}
              </span>
            </div>
          </div>
        </div>
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

      <div className="nl-study-main">
        <div className="nl-study-mc-stack">
          {/* Question */}
          {currentCard.type === 'audio' ? (
            <AudioCard card={currentCard} revealed={false} onReveal={() => {}} hideReveal />
          ) : currentCard.type === 'symbol' ? (
            <div style={{ background: '#ECE3CC', border: '1px solid #D9CFAE', borderRadius: '20px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(26,26,24,0.08)' }}>
              <div style={{ fontFamily: 'Bravura, serif', fontSize: '96px', lineHeight: 1.4, color: '#2A2318' }}>
                {currentCard.front}
              </div>
              {currentCard.symbolLabel && (
                <p style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', marginTop: '8px' }}>{currentCard.symbolLabel}</p>
              )}
            </div>
          ) : (
            <div style={{ background: '#ECE3CC', border: '1px solid #D9CFAE', borderRadius: '20px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(26,26,24,0.08)' }}>
              <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(20px, 4vw, 32px)', color: '#2A2318', lineHeight: 1.4 }}>
                {currentCard.front}
              </p>
            </div>
          )}

          {/* Answer options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {options.map((opt, i) => {
              let bg = 'white'
              let border = '#D9CFAE'
              let color = '#1A1A18'
              if (chosen) {
                if (opt === correctAnswer) { bg = '#EAF3DE'; border = '#C0DD97'; color = '#3B6D11' }
                else if (opt === chosen) { bg = '#FCEBEB'; border = '#F09595'; color = '#A32D2D' }
                else { color = '#D9CFAE'; border = '#EDE8DF' }
              }
              return (
                <button
                  key={i}
                  onClick={() => !chosen && answer(opt)}
                  disabled={!!chosen}
                  style={{
                    background: bg,
                    border: `1.5px solid ${border}`,
                    borderRadius: '12px',
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontFamily: 'var(--font-jost), sans-serif',
                    fontSize: 'var(--nl-text-ui)',
                    fontWeight: 300,
                    color,
                    cursor: chosen ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    letterSpacing: '0.02em',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 400, marginRight: '10px', color: chosen ? color : '#7A7060' }}>
                    {['A', 'B', 'C', 'D'][i]}.
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
