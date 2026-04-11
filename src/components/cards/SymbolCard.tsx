'use client'

import { Card } from '@/lib/types'

interface SymbolCardProps {
  card: Card
  revealed: boolean
  onReveal: () => void
}

export default function SymbolCard({ card, revealed, onReveal }: SymbolCardProps) {
  // Support multiple symbols side by side using | separator
  // e.g. front: '\uE522|\uE52F' renders f and ff side by side
  const symbols = card.front.split('|')
  const hasLabel = card.symbolLabel

  return (
    <div
      style={{ width: '100%', maxWidth: '480px', cursor: revealed ? 'default' : 'pointer' }}
      onClick={!revealed ? onReveal : undefined}
    >
      {/* Symbol display */}
      <div style={{
        background: '#FDFAF3',
        border: '1px solid #DDD8CA',
        borderRadius: '20px',
        padding: '48px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(26,26,24,0.08)',
        marginBottom: '16px',
      }}>
        <div style={{
          fontFamily: 'Bravura, serif',
          fontSize: '96px',
          lineHeight: 1.4,
          color: '#2A2318',
          letterSpacing: '0.05em',
          marginBottom: hasLabel ? '16px' : '0',
        }}>
          {symbols.join(' ')}
        </div>
        {hasLabel && (
          <p style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            color: '#7A7060',
            letterSpacing: '0.05em',
          }}>
            {card.symbolLabel}
          </p>
        )}
      </div>

      {/* Answer */}
      {revealed ? (
        <div style={{
          background: '#FAEEDA',
          border: '1px solid #FAC775',
          borderRadius: '16px',
          padding: '24px 28px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontWeight: 400,
            fontSize: '22px',
            color: '#2A2318',
            marginBottom: '8px',
          }}>
            {card.symbolName ?? card.back.split('—')[0].trim()}
          </p>
          <p style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#7A7060',
            lineHeight: 1.7,
          }}>
            {card.back}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            color: '#7A7060',
            letterSpacing: '0.05em',
          }}>
            Tap to reveal
          </p>
        </div>
      )}
    </div>
  )
}
