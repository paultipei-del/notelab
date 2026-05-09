'use client'

import type { Card } from '@/lib/types'
import AudioBrowseRow from '@/components/cards/AudioBrowseRow'

interface MobileBrowsePanelProps {
  cards: Card[]
  expandedId: number | null
  onToggle: (id: number) => void
}

/**
 * Mobile-only Browse panel — vertical list with internal scroll, lives
 * inside the same MobileStudyChrome shell as the modes (so the user
 * keeps the back button + tab bar visible). Decoupled from the desktop
 * browse path which still owns its own viewport.
 */
export default function MobileBrowsePanel({ cards, expandedId, onToggle }: MobileBrowsePanelProps) {
  const hint = cards[0]?.type === 'audio' ? null : 'Tap any card to see the answer'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
        width: '100%',
      }}
    >
      {hint && <div className="nl-study-mobile-browse-hint">{hint}</div>}
      <div className="nl-study-mobile-browse-list">
        {cards.map((card, i) => {
          const isExpanded = expandedId === card.id
          const isAudio = card.type === 'audio'
          return (
            <div
              key={card.id}
              onClick={() => !isAudio && onToggle(card.id)}
              style={{
                background: '#ECE3CC',
                border: `1px solid ${isExpanded ? '#B5402A' : '#D9CFAE'}`,
                borderRadius: 10,
                padding: '12px 14px',
                cursor: isAudio ? 'default' : 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: '#D9CFAE',
                    fontWeight: 400,
                    minWidth: 20,
                    paddingTop: 2,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isAudio ? (
                    <AudioBrowseRow card={card} />
                  ) : card.type === 'symbol' ? (
                    <>
                      <p
                        style={{
                          fontFamily: 'Bravura, serif',
                          fontSize: 30,
                          color: '#2A2318',
                          lineHeight: 1.4,
                          marginBottom: isExpanded ? 8 : 0,
                        }}
                      >
                        {card.front}
                        {card.symbolName && (
                          <span
                            style={{
                              fontFamily: 'var(--font-jost), sans-serif',
                              fontSize: 14.5,
                              fontWeight: 500,
                              color: '#1a1208',
                              marginLeft: 10,
                            }}
                          >
                            {card.symbolName}
                          </span>
                        )}
                      </p>
                      {isExpanded && (
                        <p
                          style={{
                            fontFamily: 'var(--font-jost), sans-serif',
                            fontSize: 14,
                            fontWeight: 400,
                            color: '#5a4028',
                            lineHeight: 1.5,
                            borderTop: '1px solid #EDE8DF',
                            paddingTop: 8,
                            margin: 0,
                          }}
                        >
                          {card.back}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p
                        style={{
                          fontFamily: 'var(--font-jost), sans-serif',
                          fontWeight: 500,
                          fontSize: 14.5,
                          color: '#1a1208',
                          marginTop: 0,
                          marginBottom: isExpanded ? 8 : 0,
                          lineHeight: 1.4,
                          letterSpacing: '0.005em',
                        }}
                      >
                        {card.front}
                      </p>
                      {isExpanded && (
                        <p
                          style={{
                            fontFamily: 'var(--font-jost), sans-serif',
                            fontSize: 14,
                            fontWeight: 400,
                            color: '#5a4028',
                            lineHeight: 1.5,
                            borderTop: '1px solid #EDE8DF',
                            paddingTop: 8,
                            marginTop: 8,
                          }}
                        >
                          {card.back}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {!isAudio && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#D9CFAE',
                      paddingTop: 2,
                    }}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
