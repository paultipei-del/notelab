'use client'

import { useState, useRef } from 'react'
import { QueueCard } from '@/lib/types'

interface ExplainCardProps {
  card: QueueCard
  onAnswer: (correct: boolean) => void
  onReveal: () => void
}

type GradeResult = {
  correct: boolean
  feedback: string
}

export default function ExplainCard({ card, onAnswer, onReveal }: ExplainCardProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const term = card.type === 'symbol'
    ? (card.symbolName ?? card.front)
    : card.front

  const definition = card.back

  async function handleSubmit() {
    if (!input.trim() || loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term,
          definition,
          studentAnswer: input.trim(),
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setResult(data)
      onAnswer(data.correct)
      onReveal()
    } catch (err) {
      console.error('Explain mode error:', err)
      setResult({ correct: false, feedback: 'Something went wrong grading your answer. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Term card — matches MC/Flip sizing so switching modes feels
          continuous (no card width or min-height jumps). */}
      <div
        className="nl-study-card-hover"
        style={{
          position: 'relative',
          background: '#ECE3CC',
          borderRadius: '20px',
          border: '1px solid #D9CFAE',
          padding: '56px 32px 32px',
          textAlign: 'center',
          minHeight: 'clamp(220px, 28dvh, 300px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          position: 'absolute', top: 22, left: 0, right: 0, textAlign: 'center',
          fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#7A7060',
        }}>
          Explain this term
        </span>

        {card.type === 'symbol' && (
          <div style={{ fontFamily: 'Bravura, serif', fontSize: '80px', lineHeight: 1.4, color: '#2A2318', marginBottom: '8px' }}>
            {card.front}
          </div>
        )}

        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 300,
          fontSize: (() => {
            if (card.type === 'symbol') return '20px'
            // Adaptive sizing for long lesson-deck questions so they don't
            // overflow the term card (matches FlipCard / MultipleChoice).
            const len = term.length
            const cap = len < 50 ? 36 : len < 100 ? 28 : len < 200 ? 22 : len < 300 ? 18 : 16
            return `clamp(15px, 3vw, ${cap}px)`
          })(),
          color: '#2A2318',
          letterSpacing: '0.02em',
          lineHeight: 1.4,
          maxWidth: '100%',
          wordBreak: 'break-word',
          hyphens: 'auto',
        }}>
          {term}
        </p>
      </div>

      {/* Input vs feedback occupy the same grid cell so vertical space = max(both) — term card stays put */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          alignItems: 'start',
          width: '100%',
          minWidth: 0,
          minHeight: 'clamp(200px, 26vh, 300px)',
        }}
      >
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            visibility: result ? 'hidden' : 'visible',
            pointerEvents: result ? 'none' : 'auto',
            width: '100%',
            minWidth: 0,
          }}
          aria-hidden={!!result}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
              placeholder="Explain this concept in your own words…"
              rows={3}
              style={{
                width: '100%',
                background: '#ECE3CC',
                border: '1px solid #D9CFAE',
                borderRadius: '14px',
                padding: '16px 18px',
                fontFamily: 'var(--font-jost), sans-serif',
                fontSize: 'var(--nl-text-body)',
                fontWeight: 300,
                color: '#2A2318',
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#D9CFAE', letterSpacing: '0.03em' }}>
                ⌘ + Enter to submit
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? '#1A1A18' : '#EDE8DF',
                  color: input.trim() && !loading ? 'white' : '#7A7060',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 'var(--nl-text-meta)',
                  fontWeight: 300,
                  letterSpacing: '0.06em',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  minWidth: '90px',
                }}
              >
                {loading ? 'Grading…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            visibility: result ? 'visible' : 'hidden',
            pointerEvents: result ? 'auto' : 'none',
            width: '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
          aria-hidden={!result}
        >
          {result && (
            <>
              <div style={{
                background: result.correct ? '#EAF3DE' : '#FCEBEB',
                border: `1px solid ${result.correct ? '#C0DD97' : '#F09595'}`,
                borderRadius: '14px',
                padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{result.correct ? '✓' : '✗'}</span>
                  <span style={{
                    fontFamily: 'var(--font-jost), sans-serif',
                    fontSize: 'var(--nl-text-meta)',
                    fontWeight: 400,
                    letterSpacing: '0.05em',
                    color: result.correct ? '#3B6D11' : '#A32D2D',
                  }}>
                    {result.correct ? 'Correct' : 'Not quite'}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 'var(--nl-text-ui)',
                  fontWeight: 300,
                  color: result.correct ? '#3B6D11' : '#A32D2D',
                  lineHeight: 1.7,
                  marginBottom: '14px',
                }}>
                  {result.feedback}
                </p>
                <div style={{ borderTop: `1px solid ${result.correct ? '#C0DD97' : '#F09595'}`, paddingTop: '12px' }}>
                  <p style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Official definition
                  </p>
                  <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#2A2318', lineHeight: 1.6 }}>
                    {definition}
                  </p>
                </div>
              </div>

              {input ? (
                <div style={{ background: '#F2EDDF', borderRadius: '10px', padding: '12px 16px' }}>
                  <p style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Your answer
                  </p>
                  <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', lineHeight: 1.6, fontStyle: 'italic' }}>
                    &quot;{input}&quot;
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
