'use client'

import React, { useState } from 'react'
import { MusicalExample } from './MusicalExample'
import { useSampler } from '@/lib/learn/audio/useSampler'

interface TransposingInstrument {
  name: string
  /** Sounding pitch when the player reads C5. */
  soundingPitch: string
  /** Display label for the sounding pitch (e.g. "B♭4"). */
  soundingLabel: string
  /** Short description of the transposition. */
  interval: string
}

const DEFAULT_INSTRUMENTS: TransposingInstrument[] = [
  { name: 'Piano / Violin / Flute', soundingPitch: 'C5',  soundingLabel: 'C5',  interval: 'concert pitch' },
  { name: 'Clarinet in B♭',         soundingPitch: 'Bb4', soundingLabel: 'B♭4', interval: 'down a major 2nd' },
  { name: 'Horn in F',              soundingPitch: 'F4',  soundingLabel: 'F4',  interval: 'down a perfect 5th' },
  { name: 'Alto Saxophone (E♭)',    soundingPitch: 'Eb4', soundingLabel: 'E♭4', interval: 'down a major 6th' },
]

interface TransposingDemoProps {
  instruments?: TransposingInstrument[]
  caption?: string
}

/**
 * Compact demo for transposing instruments. Shows ONE written C5 on a
 * treble staff, with a row of instrument buttons below. Each button plays
 * the corresponding sounding pitch — same written note, different
 * sounded result depending on the instrument.
 */
export function TransposingDemo({
  instruments = DEFAULT_INSTRUMENTS,
  caption = 'Written C5 on every part. Tap an instrument to hear what the audience would actually hear.',
}: TransposingDemoProps) {
  const sampler = useSampler()
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const handleClick = async (i: number, pitch: string) => {
    setActiveIdx(i)
    await sampler.ensureReady()
    await sampler.play(pitch, '1n')
    window.setTimeout(() => {
      setActiveIdx(prev => (prev === i ? null : prev))
    }, 1200)
  }

  return (
    <figure style={{ margin: '32px auto', maxWidth: 720 }}>
      <MusicalExample
        score={{
          timeSignature: { numerator: 4, denominator: 4 },
          keySignature: 0,
          staves: [{ clef: 'treble', voices: [{ elements: [{ type: 'note', pitch: 'C5', duration: 'w' }] }] }],
        }}
        audio={false}
        highlightAll={activeIdx !== null}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          marginTop: 8,
        }}
      >
        {instruments.map((inst, i) => {
          const isActive = activeIdx === i
          return (
            <button
              key={inst.name}
              type="button"
              onClick={() => handleClick(i, inst.soundingPitch)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: isActive
                  ? '1px solid #D85A30'
                  : '1px solid rgba(122, 112, 96, 0.25)',
                background: isActive ? '#FDF1EB' : '#FDFAF5',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 150ms ease, border-color 150ms ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = '#F5EFE2'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = '#FDFAF5'
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: isActive ? '#D85A30' : 'rgba(216, 90, 48, 0.12)',
                  color: isActive ? '#FFFFFF' : '#D85A30',
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >▶</span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: 17,
                    fontWeight: 600,
                    color: '#2A2318',
                    lineHeight: 1.2,
                  }}
                >{inst.name}</span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-cormorant), serif',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: '#7A7060',
                    marginTop: 2,
                    lineHeight: 1.3,
                  }}
                >{inst.interval}</span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-freight-text-pro), var(--font-cormorant), serif',
                  fontSize: 19,
                  color: '#2A2318',
                  fontFeatureSettings: '"lnum"',
                  flexShrink: 0,
                  paddingLeft: 4,
                }}
              >{inst.soundingLabel}</span>
            </button>
          )
        })}
      </div>
      {caption && (
        <figcaption
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 14,
            color: '#5F5E5A',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >{caption}</figcaption>
      )}
    </figure>
  )
}
