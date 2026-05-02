'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'

const SHARP_ORDER: Array<'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B'> = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: Array<'B' | 'E' | 'A' | 'D' | 'G' | 'C' | 'F'> = ['B', 'E', 'A', 'D', 'G', 'C', 'F']
const TREBLE_SHARP_POS: Record<string, number> = { F: 0, C: 3, G: -1, D: 2, A: 5, E: 1, B: 4 }
const TREBLE_FLAT_POS: Record<string, number> = { B: 4, E: 1, A: 5, D: 2, G: 6, C: 3, F: 7 }
const BASS_SHARP_POS: Record<string, number> = { F: 2, C: 5, G: 1, D: 4, A: 7, E: 3, B: 6 }
const BASS_FLAT_POS: Record<string, number> = { B: 6, E: 3, A: 7, D: 4, G: 1, C: 5, F: 2 }

type Voice = 'soprano' | 'alto' | 'tenor' | 'bass'

export interface SATBChord {
  voices: {
    soprano: string
    alto: string
    tenor: string
    bass: string
  }
  romanNumeral?: string
  label?: string
}

interface VoiceLeadingAnnotation {
  chordIdx: number
  voice: Voice
  label: string
}

interface VoiceLeadingScoreProps {
  chords: SATBChord[]
  keySignature?: number
  showVoiceMotion?: boolean
  emphasizedVoices?: Voice[]
  annotations?: VoiceLeadingAnnotation[]
  audio?: boolean
  size?: LearnSize
  caption?: string
}

export function VoiceLeadingScore({
  chords,
  keySignature = 0,
  showVoiceMotion = false,
  emphasizedVoices,
  annotations,
  audio = true,
  size = 'inline',
  caption,
}: VoiceLeadingScoreProps) {
  const T = tokensFor(size)
  const { playChord } = useSampler()

  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)
  const isSharp = keySignature > 0
  const ksCount = Math.abs(keySignature)
  const ksOrder = isSharp ? SHARP_ORDER : FLAT_ORDER
  const ksSlot = Math.round(T.accidentalKerning * 0.95)
  const ksWidth = ksCount > 0 ? ksCount * ksSlot + Math.round(8 * T.scale) : 0
  const ksGap = ksWidth > 0 ? Math.round(12 * T.scale) : Math.round(6 * T.scale)
  // Slightly wider per-chord slot (was 110 * scale) gives the voice-motion
  // arcs room to breathe between adjacent noteheads instead of being squeezed
  // through them.
  const chordSlot = Math.round(140 * T.scale)
  const trailingPad = Math.round(20 * T.scale)
  const staffWidth = clefReserve + clefGap + ksWidth + ksGap + chords.length * chordSlot + trailingPad

  const ksStartX = margin + clefReserve + clefGap + Math.round(T.accidentalKerning * 0.5)
  const bodyStartX = margin + clefReserve + clefGap + ksWidth + ksGap
  const chordX = (i: number) => bodyStartX + (i + 0.5) * chordSlot

  const annotationFont = T.size === 'small' ? 11 : T.size === 'hero' ? 14 : 12
  const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 16 : 14

  const headroom = Math.round(40 * T.scale + annotationFont + 10)
  const trebleStaffY = headroom
  const trebleHeight = 8 * T.step
  const grandGap = Math.round(80 * T.scale)
  const bassStaffY = trebleStaffY + trebleHeight + grandGap
  const labelY = bassStaffY + 8 * T.step + Math.round(28 * T.scale)
  const subLabelY = labelY + labelFont + 6
  const totalH = subLabelY + Math.round(20 * T.scale)
  const totalW = margin + staffWidth + margin

  const ksPosTreble = isSharp ? TREBLE_SHARP_POS : TREBLE_FLAT_POS
  const ksPosBass = isSharp ? BASS_SHARP_POS : BASS_FLAT_POS

  // Engrave one voice's notehead position for each chord.
  // Returns { x, y, pos, parsed } per chord per voice.
  type VoiceLayout = { x: number; y: number; pos: number; pitch: string }
  const voiceLayouts: Record<Voice, (VoiceLayout | null)[]> = {
    soprano: [], alto: [], tenor: [], bass: [],
  }
  chords.forEach((chord, i) => {
    (['soprano', 'alto', 'tenor', 'bass'] as Voice[]).forEach(v => {
      const pitch = chord.voices[v]
      const parsed = parsePitch(pitch)
      const clef: Clef = (v === 'soprano' || v === 'alto') ? 'treble' : 'bass'
      const staffY = clef === 'treble' ? trebleStaffY : bassStaffY
      if (!parsed) {
        voiceLayouts[v].push(null)
        return
      }
      const pos = staffPosition(parsed, clef)
      voiceLayouts[v].push({
        x: chordX(i),
        y: staffY + pos * T.step,
        pos,
        pitch,
      })
    })
  })

  const stemDirOf = (voice: Voice): 'up' | 'down' =>
    (voice === 'soprano' || voice === 'tenor') ? 'up' : 'down'

  const handleChordClick = (i: number) => {
    const c = chords[i]
    const pitches = [c.voices.bass, c.voices.tenor, c.voices.alto, c.voices.soprano]
    void playChord(pitches, '2n')
  }

  const handlePlaySequence = async () => {
    for (let i = 0; i < chords.length; i++) {
      const c = chords[i]
      const pitches = [c.voices.bass, c.voices.tenor, c.voices.alto, c.voices.soprano]
      void playChord(pitches, '2n')
      if (i < chords.length - 1) {
        await new Promise(r => setTimeout(r, 1100))
      }
    }
  }

  const annotationFor = (chordIdx: number, voice: Voice): string | null => {
    return annotations?.find(a => a.chordIdx === chordIdx && a.voice === voice)?.label ?? null
  }

  const isEmphasized = (v: Voice) =>
    !emphasizedVoices || emphasizedVoices.length === 0 || emphasizedVoices.includes(v)

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Four-voice SATB progression'}
      >
        {/* Brace */}
        <line
          x1={margin}
          y1={trebleStaffY}
          x2={margin}
          y2={bassStaffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={T.graceLineStroke}
        />
        <text
          x={margin - 8}
          y={bassStaffY + 8 * T.step}
          fontSize={(bassStaffY + 8 * T.step) - trebleStaffY}
          fontFamily={T.fontMusic}
          fill={T.ink}
          textAnchor="middle"
          dominantBaseline="auto"
        >
          {T.braceGlyph}
        </text>

        {/* Staves */}
        <Staff clef="treble" x={margin} y={trebleStaffY} width={staffWidth} T={T} />
        <Staff clef="bass" x={margin} y={bassStaffY} width={staffWidth} T={T} />

        {/* Key signature */}
        {ksCount > 0 && ksOrder.slice(0, ksCount).map((letter, i) => (
          <g key={`ks-${i}`}>
            <text
              x={ksStartX + i * ksSlot}
              y={trebleStaffY + ksPosTreble[letter] * T.step}
              fontSize={T.accidentalFontSize}
              fontFamily={T.fontMusic}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {isSharp ? T.sharpGlyph : T.flatGlyph}
            </text>
            <text
              x={ksStartX + i * ksSlot}
              y={bassStaffY + ksPosBass[letter] * T.step}
              fontSize={T.accidentalFontSize}
              fontFamily={T.fontMusic}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {isSharp ? T.sharpGlyph : T.flatGlyph}
            </text>
          </g>
        ))}

        {/* Voice motion arcs. Each line starts at the right edge of the
            start notehead and ends at the left edge of the next chord's
            notehead, so the curve never tunnels through the heads. The
            curve bulges away from the connecting axis (upward for ascending
            or level motion, downward for descending) so the line stays clear
            of the heads even when two adjacent voices share an x range. */}
        {showVoiceMotion && (['soprano', 'alto', 'tenor', 'bass'] as Voice[]).map(v => {
          const layouts = voiceLayouts[v]
          const segments: React.ReactNode[] = []
          // Notehead half-width plus a small breathing gap. Heads are about
          // 22 * scale wide (so half-width ~11 * scale); we anchor several
          // pixels past the edge so the line stops short of the notehead
          // with a visible gap on both ends.
          const headEdge = Math.round(13 * T.scale + 6)
          for (let i = 0; i < layouts.length - 1; i++) {
            const a = layouts[i]
            const b = layouts[i + 1]
            if (!a || !b) continue
            const sx = a.x + headEdge
            const sy = a.y
            const ex = b.x - headEdge
            const ey = b.y
            const dx = ex - sx
            const dy = ey - sy
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            // Curve perpendicular to the line, bulging "outward" — up when the
            // motion is descending or level, down when ascending — so the arc
            // never crosses neighbouring voices on the way over.
            const ascending = ey < sy
            const curveMagnitude = Math.min(18, Math.max(8, len * 0.12))
            // Soprano keeps its default arc orientation; the lower three
            // voices flip so their arcs bow on the opposite side. This
            // keeps neighbouring lines from curving into each other when
            // multiple voices move in parallel.
            const voiceFlip = v === 'soprano' ? 1 : -1
            const perpSign = (ascending ? 1 : -1) * voiceFlip
            const px = (-dy / len) * curveMagnitude * perpSign
            const py = (dx / len) * curveMagnitude * perpSign
            const mx = (sx + ex) / 2 + px
            const my = (sy + ey) / 2 + py
            const dim = !isEmphasized(v)
            const color = dim ? T.inkSubtle : T.highlightAccent
            const opacity = dim ? 0.4 : 0.85
            segments.push(
              <path
                key={`vm-${v}-${i}`}
                d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                fill="none"
                stroke={color}
                strokeWidth={1.4}
                opacity={opacity}
                strokeLinecap="round"
                strokeDasharray={dim ? '3 3' : undefined}
                pointerEvents="none"
              />
            )
          }
          return <g key={`vmotion-${v}`}>{segments}</g>
        })}

        {/* Noteheads with explicit stem directions */}
        {chords.map((chord, i) => {
          const handlers = {
            onClick: () => handleChordClick(i),
            style: { cursor: 'pointer' as const },
          }
          return (
            <g key={`chord-${i}`} {...handlers} role="button" aria-label={`Chord ${i + 1}`}>
              {(['soprano', 'alto', 'tenor', 'bass'] as Voice[]).map(v => {
                const layout = voiceLayouts[v][i]
                if (!layout) return null
                const clef: Clef = (v === 'soprano' || v === 'alto') ? 'treble' : 'bass'
                const staffY = clef === 'treble' ? trebleStaffY : bassStaffY
                const ann = annotationFor(i, v)
                return (
                  <g key={`note-${v}-${i}`}>
                    <NoteHead
                      pitch={layout.pitch}
                      staffTop={staffY}
                      x={layout.x}
                      clef={clef}
                      T={T}
                      duration="whole"
                      stemDirection={stemDirOf(v)}
                    />
                    {ann && (
                      <text
                        x={layout.x}
                        y={staffY === trebleStaffY
                          ? trebleStaffY - Math.round(8 * T.scale) - annotationFont / 2
                          : bassStaffY + 8 * T.step + Math.round(8 * T.scale) + annotationFont / 2}
                        fontSize={annotationFont}
                        fontFamily={T.fontLabel}
                        fill={T.highlightAccent}
                        fontStyle="italic"
                        fontWeight={600}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {ann}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Roman numerals + labels under bass staff */}
        {chords.map((chord, i) => (
          <g key={`labels-${i}`}>
            {chord.romanNumeral && (
              <text
                x={chordX(i)}
                y={labelY + labelFont / 2}
                fontSize={labelFont}
                fontFamily={T.fontLabel}
                fill={T.ink}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {chord.romanNumeral}
              </text>
            )}
            {chord.label && (
              <text
                x={chordX(i)}
                y={subLabelY + annotationFont / 2}
                fontSize={annotationFont}
                fontFamily={T.fontLabel}
                fill={T.inkMuted}
                fontStyle="italic"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {chord.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {audio && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={handlePlaySequence}
            style={{
              fontFamily: T.fontLabel,
              fontSize: 12,
              color: T.bgPaper,
              background: T.ink,
              border: 'none',
              padding: '6px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Play progression
          </button>
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
