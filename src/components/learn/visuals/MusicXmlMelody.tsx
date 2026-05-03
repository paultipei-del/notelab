'use client'

/**
 * <MusicXmlMelody> — fetch a MusicXML score, parse a single melodic line
 * from a measure range, and render it via <MusicalExample>. Source of truth
 * is the MusicXML file (right-hand staff, voice 1 by default); the rendering
 * + audio playback path is the same as any other <MusicalExample>.
 *
 * v1 limitations inherit from the parser and from <MusicalExample>: single
 * staff, no triplets, no slurs/ornaments. See parser.ts for details.
 */

import React from 'react'
import { MusicalExample } from './MusicalExample'
import { parseMusicXmlMelody, type ParsedMelody } from '@/lib/learn/musicxml/parser'
import type { MusicalAnnotation } from '@/lib/learn/visuals/notation-types'
import type { LearnSize } from '@/lib/learn/visuals/tokens'

interface MusicXmlMelodyProps {
  /** URL of the MusicXML file (uncompressed .musicxml). */
  src: string
  /** [from, to] measure range, 1-indexed inclusive. */
  measureRange: [number, number]
  /** Which staff to extract. Default 1 (treble / right hand). */
  staff?: number
  /** Which voice to extract. Default 1. */
  voice?: number
  /** Tempo override. Default 96. */
  bpm?: number
  systemBreaks?: number[]
  annotations?: MusicalAnnotation[]
  caption?: string
  showMeasureNumbers?: boolean
  size?: LearnSize
}

export function MusicXmlMelody({
  src,
  measureRange,
  staff = 1,
  voice = 1,
  bpm = 96,
  systemBreaks,
  annotations,
  caption,
  showMeasureNumbers,
  size,
}: MusicXmlMelodyProps) {
  const [data, setData] = React.useState<ParsedMelody | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Re-parse whenever the source or range changes.
  React.useEffect(() => {
    let cancelled = false
    fetch(src)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch ${src}: ${r.status}`)
        return r.text()
      })
      .then(xml => {
        if (cancelled) return
        const parsed = parseMusicXmlMelody(xml, {
          measureFrom: measureRange[0],
          measureTo: measureRange[1],
          staff,
          voice,
        })
        setData(parsed)
      })
      .catch(e => {
        if (!cancelled) setError(String(e?.message ?? e))
      })
    return () => {
      cancelled = true
    }
  }, [src, measureRange[0], measureRange[1], staff, voice])

  if (error) {
    return (
      <div
        style={{
          padding: '20px 24px',
          border: '1px solid #D85A30',
          borderRadius: 6,
          background: '#FBF1EC',
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: 13,
          color: '#B5402A',
          margin: '24px 0',
        }}
      >
        Couldn't load score from <code>{src}</code>: {error}
      </div>
    )
  }

  if (!data) {
    // Reserve roughly the height of a one-system staff so layout doesn't
    // jump when the parse finishes.
    return (
      <div
        style={{
          minHeight: 160,
          margin: '24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: 13,
          color: '#7A7060',
          fontStyle: 'italic',
        }}
      >
        Loading score…
      </div>
    )
  }

  return (
    <MusicalExample
      elements={data.elements}
      timeSignature={data.timeSignature}
      keySignature={data.keySignature}
      clef={data.clef}
      bpm={bpm}
      systemBreaks={systemBreaks}
      annotations={annotations}
      caption={caption}
      showMeasureNumbers={showMeasureNumbers}
      size={size}
    />
  )
}
