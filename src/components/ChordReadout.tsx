'use client'

/**
 * Chord readout — the visual anchor of the Harmony Reading page.
 *
 * Three stacked lines:
 *   1) Chord name (Cormorant 64). Em-dash placeholder when no chord.
 *   2) Roman numeral (Cormorant italic 36). Hidden when not diatonic.
 *   3) Verbose description (Jost 14, small caps, muted). Hidden when null.
 *
 * Edge cases (cluster, empty, single note, interval) are handled by
 * `detectChord` upstream — this component just renders whatever
 * ChordResult it receives, with a couple of presentational overrides
 * for the cluster + empty paths.
 */

import type { ChordResult } from '@/lib/chordDetection'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const INK = '#2A2318'
const MUTED = '#B0ACA4'
const MUTED_INK = '#7A7060'

type Props = {
  result: ChordResult
  currentKey: string
}

export function ChordReadout({ result, currentKey }: Props) {
  const isEmpty = result.spelledNotes.length === 0 && !result.isCluster
  const isCluster = result.isCluster

  const primary = isCluster
    ? 'cluster'
    : isEmpty
      ? '—'
      : (result.chordName ?? '—')

  const primaryColor = (isCluster || isEmpty || result.chordName === null) ? MUTED : INK

  const roman = !isCluster && !isEmpty ? result.romanNumeral : null
  const verbose = !isCluster && !isEmpty ? result.chordNameVerbose : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, textAlign: 'center', padding: '32px 24px',
    }}>
      <h2 style={{
        fontFamily: SERIF, fontWeight: 300,
        fontSize: 'clamp(40px, 7vw, 64px)',
        lineHeight: 1.05, letterSpacing: '0.01em',
        color: primaryColor,
        margin: 0,
      }}>
        {primary}
      </h2>

      {roman && (
        <p style={{
          fontFamily: SERIF, fontStyle: 'italic',
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 400,
          color: 'var(--oxblood)',
          margin: 0, lineHeight: 1.1,
        }}>
          {roman}
        </p>
      )}

      {verbose && (
        <p style={{
          fontFamily: F, fontSize: 14, fontWeight: 500,
          letterSpacing: '0.18em', textTransform: 'uppercase' as const,
          color: MUTED_INK,
          margin: '6px 0 0',
        }}>
          {verbose}
        </p>
      )}

      <p style={{
        fontFamily: F, fontSize: 11, fontWeight: 400,
        letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        color: MUTED,
        margin: '10px 0 0',
      }}>
        in {currentKey}
      </p>
    </div>
  )
}

export default ChordReadout
