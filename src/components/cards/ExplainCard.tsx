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
    <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Term card */}
      <div style={{
        background: '#FDFAF3',
        borderRadius: '20px',
        border: '1px solid #DDD8CA',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 32px rgba(26,26,24,0.10)',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7060', display: 'block', marginBottom: '16px' }}>
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
          fontSize: card.type === 'symbol' ? '20px' : 'clamp(22px, 4vw, 36px)',
          color: '#2A2318',
          letterSpacing: '0.02em',
          lineHeight: 1.3,
        }}>
          {term}
        </p>
      </div>

      {/* Input area */}
      {!result && (
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
              background: '#FDFAF3',
              border: '1px solid #DDD8CA',
              borderRadius: '14px',
              padding: '16px 18px',
              fontFamily: 'var(--font-jost), sans-serif',
              fontSize: '15px',
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
            <span style={{ fontSize: '11px', fontWeight: 300, color: '#DDD8CA', letterSpacing: '0.03em' }}>
              ⌘ + Enter to submit
            </span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? '#1A1A18' : '#EDE8DF',
                color: input.trim() && !loading ? 'white' : '#7A7060',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontFamily: 'var(--font-jost), sans-serif',
                fontSize: '13px',
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
      )}

      {/* Claude's feedback */}
      {result && (
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
              fontSize: '13px',
              fontWeight: 400,
              letterSpacing: '0.05em',
              color: result.correct ? '#3B6D11' : '#A32D2D',
            }}>
              {result.correct ? 'Correct' : 'Not quite'}
            </span>
          </div>
          <p style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: result.correct ? '#3B6D11' : '#A32D2D',
            lineHeight: 1.7,
            marginBottom: '14px',
          }}>
            {result.feedback}
          </p>
          <div style={{ borderTop: `1px solid ${result.correct ? '#C0DD97' : '#F09595'}`, paddingTop: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 300, color: '#7A7060', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Official definition
            </p>
            <p style={{ fontSize: '13px', fontWeight: 300, color: '#2A2318', lineHeight: 1.6 }}>
              {definition}
            </p>
          </div>
        </div>
      )}

      {/* Student's answer */}
      {result && input && (
        <div style={{ background: '#F2EDDF', borderRadius: '10px', padding: '12px 16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 300, color: '#7A7060', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Your answer
          </p>
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#7A7060', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{input}"
          </p>
        </div>
      )}
    </div>
  )
}
