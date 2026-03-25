'use client'
import React, { useRef, useEffect } from 'react'

interface FullPianoProps {
  onNote: (note: string) => void
  activeNote?: string  // highlight the current target note's octave region
}

// Full 88-key piano: A0 to C8
// White keys: 52 total
// Build all keys
const ALL_NOTES = ['C','D','E','F','G','A','B']
const BLACK_AFTER: Record<string, boolean> = { C: true, D: true, F: true, G: true, A: true }

interface Key {
  note: string
  octave: number
  black: boolean
  whiteIndex: number  // index among white keys
}

const KEYS: Key[] = []
let whiteIndex = 0

// A0, B0 first
for (const n of ['A','B']) {
  KEYS.push({ note: n, octave: 0, black: false, whiteIndex: whiteIndex++ })
  if (n === 'A') KEYS.push({ note: 'A#', octave: 0, black: true, whiteIndex: whiteIndex - 1 })
}

// C1 through C8
for (let oct = 1; oct <= 8; oct++) {
  const notes = oct === 8 ? ['C'] : ALL_NOTES
  for (const n of notes) {
    KEYS.push({ note: n, octave: oct, black: false, whiteIndex: whiteIndex++ })
    if (BLACK_AFTER[n] && !(oct === 8 && n === 'C')) {
      KEYS.push({ note: n + '#', octave: oct, black: true, whiteIndex: whiteIndex - 1 })
    }
  }
}

const WHITE_KEYS = KEYS.filter(k => !k.black)
const BLACK_KEYS = KEYS.filter(k => k.black)
const KEY_W = 28
const KEY_H = 100
const BLACK_W = 18
const BLACK_H = 62

export default function FullPiano({ onNote, activeNote }: FullPianoProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to middle C (C4) on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const c4WhiteIdx = WHITE_KEYS.findIndex(k => k.note === 'C' && k.octave === 4)
    const scrollX = c4WhiteIdx * KEY_W - scrollRef.current.clientWidth / 2 + KEY_W * 3
    scrollRef.current.scrollLeft = Math.max(0, scrollX)
  }, [])

  const totalWidth = WHITE_KEYS.length * KEY_W

  return (
    <div ref={scrollRef} style={{ overflowX: 'auto', width: '100%', cursor: 'default' }}>
      <div style={{ position: 'relative', width: totalWidth, height: KEY_H, flexShrink: 0 }}>
        {/* White keys */}
        {WHITE_KEYS.map((key, i) => {
          const isC = key.note === 'C'
          return (
            <button
              key={key.note + key.octave}
              onClick={() => onNote(key.note)}
              style={{
                position: 'absolute',
                left: i * KEY_W,
                top: 0,
                width: KEY_W - 1,
                height: KEY_H,
                background: 'white',
                border: '1px solid #D3D1C7',
                borderRadius: '0 0 6px 6px',
                cursor: 'pointer',
                zIndex: 1,
                boxShadow: '0 2px 4px rgba(26,26,24,0.06)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px',
              }}
            >
              {isC && (
                <span style={{ fontSize: '8px', color: '#D3D1C7', fontFamily: 'var(--font-jost), sans-serif', userSelect: 'none' }}>
                  C{key.octave}
                </span>
              )}
            </button>
          )
        })}
        {/* Black keys */}
        {BLACK_KEYS.map(key => (
          <button
            key={key.note + key.octave}
            onClick={() => onNote(key.note)}
            style={{
              position: 'absolute',
              left: key.whiteIndex * KEY_W + KEY_W - BLACK_W / 2,
              top: 0,
              width: BLACK_W,
              height: BLACK_H,
              background: '#1A1A18',
              borderRadius: '0 0 4px 4px',
              cursor: 'pointer',
              zIndex: 2,
              border: 'none',
              boxShadow: '0 3px 6px rgba(26,26,24,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
