'use client'

/**
 * <MusicXmlScore> — fetch a MusicXML file, parse the FULL multi-staff /
 * multi-voice score for a measure range, and render it via <MusicalExample>
 * in v2 (Score) mode. Use this for grand-staff piano excerpts.
 *
 * For single-line excerpts (one hand only), keep using <MusicXmlMelody>.
 */

import React from 'react'
import { MusicalExample } from './MusicalExample'
import { parseMusicXmlScore, type ParsedScore } from '@/lib/learn/musicxml/parser'
import type { MusicalAnnotation } from '@/lib/learn/visuals/notation-types'
import type { LearnSize } from '@/lib/learn/visuals/tokens'

interface MusicXmlScoreProps {
  /** URL of the MusicXML file (uncompressed .musicxml). */
  src: string
  /** [from, to] measure range, 1-indexed inclusive. */
  measureRange: [number, number]
  /** Tempo override. Default 96. */
  bpm?: number
  systemBreaks?: number[]
  /** Annotations target the primary line (stave 0, voice 0). */
  annotations?: MusicalAnnotation[]
  caption?: string
  showMeasureNumbers?: boolean
  size?: LearnSize
}

export function MusicXmlScore({
  src,
  measureRange,
  bpm = 96,
  systemBreaks,
  annotations,
  caption,
  showMeasureNumbers,
  size,
}: MusicXmlScoreProps) {
  const [data, setData] = React.useState<ParsedScore | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch(src)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch ${src}: ${r.status}`)
        return r.text()
      })
      .then(xml => {
        if (cancelled) return
        const parsed = parseMusicXmlScore(xml, {
          measureFrom: measureRange[0],
          measureTo: measureRange[1],
        })
        setData(parsed)
      })
      .catch(e => {
        if (!cancelled) setError(String(e?.message ?? e))
      })
    return () => {
      cancelled = true
    }
  }, [src, measureRange[0], measureRange[1]])

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
        Couldn&apos;t load score from <code>{src}</code>: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: 220,
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

  // Default to system breaks suggested by the MusicXML when the caller
  // didn't supply their own (parsed from `<print new-system="yes"/>`).
  const effectiveBreaks = systemBreaks ?? (data.systemBreaks.length > 0
    ? data.systemBreaks
    : undefined)

  return (
    <MusicalExample
      score={data.score}
      bpm={bpm}
      systemBreaks={effectiveBreaks}
      annotations={annotations}
      caption={caption}
      showMeasureNumbers={showMeasureNumbers}
      size={size}
    />
  )
}
