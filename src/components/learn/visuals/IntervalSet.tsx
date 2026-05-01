'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, type Clef, type ParsedPitch } from '@/lib/learn/visuals/pitch'
import {
  engraveChord, accidentalColumnX, type EngravedChord,
} from '@/lib/learn/visuals/chord-engraving'

export interface IntervalEntry {
  /** The two pitches forming the dyad, e.g. ['C4', 'G4']. */
  pitches: [string, string]
  /** Short label rendered above the dyad. */
  label: string
  /** Optional sublabel rendered below the label, e.g. "4 half steps". */
  sublabel?: string
}

interface IntervalSetProps {
  /** Array of dyads to display side-by-side on a single shared staff. */
  intervals: IntervalEntry[]
  /**
   * 'treble' | 'bass' renders one staff with all notes routed there.
   * 'grand' renders treble + bass and routes each pitch by MIDI
   * (>= 60 -> treble, else bass). Default 'treble'.
   */
  clef?: Clef | 'grand'
  size?: LearnSize
  /** Optional figure caption. */
  caption?: string
}

interface DyadEngraving {
  idx: number
  parsed: ParsedPitch[]
  pitches: string[]
  staves: Array<{ clef: Clef; engraved: EngravedChord; pitches: string[] }>
}

/**
 * Renders multiple dyads on a single shared staff (or grand staff), side-by-
 * side, with one clef at the start and a single Play-all button below. Each
 * dyad is read as a unit: clicking any notehead plays the dyad as a chord;
 * hovering highlights both notes simultaneously.
 *
 * Engraving conventions in use here:
 *   - Whole notes (no stems). Stems would have to flip arbitrarily across
 *     dyads at different staff positions, and they convey rhythmic
 *     information that's irrelevant in a pedagogical interval row. Whole
 *     notes also unify simple intervals with cross-staff compound
 *     intervals (where stems-with-shared-flag would be ambiguous).
 *   - 2nd-displacement: notes one staff-position apart straddle the
 *     "stem" column (which here is just the implicit chord center), via
 *     the shared engraveChord helper.
 *   - Accidentals in their own left column, never tucked next to a
 *     displaced notehead.
 *
 * Highlight model: position-based, NOT midi-based. activeDyadIdx and
 * hoveredDyadIdx are scoped to the index of the dyad in the input array.
 * This is critical because the same midi (e.g. C4) appears in many dyads;
 * a midi-based highlight would light up every dyad sharing that pitch.
 */
export function IntervalSet({
  intervals,
  clef = 'treble',
  size = 'inline',
  caption,
}: IntervalSetProps) {
  const T = tokensFor(size)
  const { ready, playChord } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [hoveredDyadIdx, setHoveredDyadIdx] = React.useState<number | null>(null)
  const [activeDyadIdx, setActiveDyadIdx] = React.useState<number | null>(null)
  const activeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Parse dyads
  const parsedDyads = intervals.map((iv) => {
    const a = parsePitch(iv.pitches[0])
    const b = parsePitch(iv.pitches[1])
    if (!a || !b) return null
    const ordered: [ParsedPitch, ParsedPitch] = a.midi <= b.midi ? [a, b] : [b, a]
    const pitches: [string, string] = a.midi <= b.midi
      ? [iv.pitches[0], iv.pitches[1]]
      : [iv.pitches[1], iv.pitches[0]]
    return { parsed: ordered, pitches }
  })

  if (parsedDyads.some(d => d === null)) return null

  const isGrand = clef === 'grand'
  const fallbackClef: Clef = !isGrand ? clef : 'treble'

  // Label fonts scale up for hero size — the global token only bumps
  // labelFontSize from 11 -> 12 between inline and hero, which leaves
  // labels visibly tiny next to the doubled-size staff. Override here.
  // Label fonts scale up at hero size — global tokens barely budge
  // (12/11) which leaves the labels visibly tiny next to the doubled
  // staff. Override here for hero only; small + inline keep defaults.
  const labelFs = T.size === 'jumbo' ? 38 : T.size === 'hero' ? 22 : T.labelFontSize
  const sublabelFs = T.size === 'jumbo' ? 30 : T.size === 'hero' ? 17 : T.smallLabelFontSize

  // ── Slot width: auto-size from the widest label / sublabel so the
  //    text never overlaps adjacent slots. We cap below at the existing
  //    notehead-width-driven minimum so dense rows still pack tightly.
  const charWidthLabel = labelFs * 0.62
  const charWidthSub = sublabelFs * 0.62
  const widestLabelChars = Math.max(0, ...intervals.map(iv => iv.label.length))
  const widestSubChars = Math.max(0, ...intervals.map(iv => (iv.sublabel ?? '').length))
  const labelTextWidth = widestLabelChars * charWidthLabel
  const subTextWidth = widestSubChars * charWidthSub
  const noteheadSlotMin = Math.round(70 * T.scale) + Math.round(28 * T.scale) // notehead room + accidental column
  const labelDriven = Math.round(Math.max(labelTextWidth, subTextWidth) + 28)
  const slotWidth = Math.max(noteheadSlotMin, labelDriven)

  const margin = Math.round(20 * T.scale + 8)
  const braceReserve = isGrand ? Math.round(34 * T.scale) : 0
  const labelHeight = labelFs + 4
  const sublabelHeight = intervals.some(i => i.sublabel) ? sublabelFs + 4 : 0

  const staffX = margin + braceReserve
  const innerWidth = T.clefReserve + slotWidth * intervals.length + Math.round(12 * T.scale)
  const staffWidth = innerWidth

  const slotCenterX = (i: number) =>
    staffX + T.clefReserve + slotWidth * (i + 0.5)

  // First-pass engraving (staffY=0) for headroom calc.
  const firstPass = parsedDyads.map((d, i) => {
    const { parsed, pitches } = d!
    const cx = slotCenterX(i)
    const staves: Array<{ clef: Clef; engraved: EngravedChord; pitches: string[] }> = []
    if (isGrand) {
      const tre = engraveChord(parsed.filter(p => p.midi >= 60), 'treble', 0, cx, T)
      const bas = engraveChord(parsed.filter(p => p.midi < 60), 'bass', 0, cx, T)
      const trebleStrs = pitches.filter((_, k) => parsed[k].midi >= 60)
      const bassStrs = pitches.filter((_, k) => parsed[k].midi < 60)
      if (tre) staves.push({ clef: 'treble', engraved: tre, pitches: trebleStrs })
      if (bas) staves.push({ clef: 'bass', engraved: bas, pitches: bassStrs })
    } else {
      const e = engraveChord(parsed, fallbackClef, 0, cx, T)
      if (e) staves.push({ clef: fallbackClef, engraved: e, pitches: [...pitches] })
    }
    return { idx: i, parsed, pitches, staves }
  })

  const trebleTopExtents = firstPass.flatMap(d =>
    d.staves
      .filter(s => s.clef === (isGrand ? 'treble' : fallbackClef))
      .map(s => s.engraved.topExtent)
  )
  const headroomFromNotes = trebleTopExtents.length > 0
    ? Math.max(0, -Math.min(...trebleTopExtents))
    : 0
  const labelArea = labelHeight + sublabelHeight + Math.round(8 * T.scale)
  const trebleStaffY = margin + headroomFromNotes + labelArea
  const trebleStaffHeight = T.step * 8
  const grandStaffGap = Math.round(96 * T.scale)
  const bassStaffY = isGrand ? trebleStaffY + trebleStaffHeight + grandStaffGap : trebleStaffY

  // Re-engrave with real staffY so accidental Y values are correct.
  const dyads: DyadEngraving[] = firstPass.map(d => {
    const cx = slotCenterX(d.idx)
    const staves: DyadEngraving['staves'] = d.staves.map(s => {
      const sy = s.clef === 'treble' ? trebleStaffY : bassStaffY
      const subset = isGrand
        ? d.parsed.filter(p => (s.clef === 'treble' ? p.midi >= 60 : p.midi < 60))
        : d.parsed
      const e = engraveChord(subset, s.clef, sy, cx, T)
      return e ? { clef: s.clef, engraved: e, pitches: s.pitches } : s
    })
    return { idx: d.idx, parsed: [...d.parsed], pitches: [...d.pitches], staves }
  })

  const lowestYAcrossDyads = Math.max(
    ...dyads.flatMap(d => d.staves.map(s => s.engraved.bottomExtent)),
    isGrand ? bassStaffY + 8 * T.step : trebleStaffY + 8 * T.step,
  )

  const totalH = lowestYAcrossDyads + margin
  const totalW = staffX + staffWidth + margin

  const labelY = trebleStaffY - Math.round(8 * T.scale) - sublabelHeight - 2
  const sublabelY = trebleStaffY - Math.round(8 * T.scale)

  // ── Audio + position-based highlight ──────────────────────────────
  const lightDyad = (idx: number, durationMs: number) => {
    setActiveDyadIdx(idx)
    if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current)
    activeTimeoutRef.current = setTimeout(() => setActiveDyadIdx(curr => curr === idx ? null : curr), durationMs)
  }

  const playDyad = async (dyadIdx: number) => {
    setInteracted(true)
    const d = parsedDyads[dyadIdx]
    if (!d) return
    lightDyad(dyadIdx, 800)
    await playChord(d.pitches)
  }

  const playAll = async () => {
    setInteracted(true)
    setPlaying(true)
    const dyadDuration = 600
    const gap = 200
    for (let i = 0; i < parsedDyads.length; i++) {
      const d = parsedDyads[i]
      if (!d) continue
      lightDyad(i, dyadDuration + 100)
      void playChord(d.pitches)
      await new Promise(r => setTimeout(r, dyadDuration + gap))
    }
    setActiveDyadIdx(null)
    setPlaying(false)
  }

  const handleDyadClick = async (dyadIdx: number) => {
    await playDyad(dyadIdx)
  }

  React.useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current)
    }
  }, [])

  // ── Render helpers ────────────────────────────────────────────────
  const renderStave = (
    dyadIdx: number,
    s: { clef: Clef; engraved: EngravedChord; pitches: string[] },
  ) => {
    const accCol = accidentalColumnX(s.engraved.noteXs, T)
    const sy = s.clef === 'treble' ? trebleStaffY : bassStaffY
    const dyadIsHot = activeDyadIdx === dyadIdx || hoveredDyadIdx === dyadIdx
    return (
      <g key={`d${dyadIdx}-${s.clef}`}>
        {s.engraved.accidentals.map((a, i) => a && (
          <text
            key={`acc-${dyadIdx}-${s.clef}-${i}-${a.midi}`}
            x={accCol}
            y={a.y}
            fontSize={T.accidentalFontSize}
            fontFamily={T.fontMusic}
            fill={dyadIsHot ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {a.glyph}
          </text>
        ))}
        {s.engraved.parsed.map((p, i) => (
          <NoteHead
            key={`nh-${dyadIdx}-${s.clef}-${p.midi}-${i}`}
            pitch={s.pitches[i]}
            staffTop={sy}
            x={s.engraved.noteXs[i]}
            clef={s.clef}
            T={T}
            // Whole notes — no stems, ever. The IntervalSet is a
            // pedagogical row, not a rhythmic figure.
            duration="whole"
            noStem
            noAccidental
            highlight={dyadIsHot}
            onMouseEnter={() => setHoveredDyadIdx(dyadIdx)}
            onMouseLeave={() => setHoveredDyadIdx(null)}
            onClick={() => handleDyadClick(dyadIdx)}
            ariaLabel={`Interval: ${s.pitches.join(' and ')}`}
          />
        ))}
      </g>
    )
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `Interval set: ${intervals.map(i => i.label).join(', ')}`}
      >
        {isGrand && (
          <>
            <line
              x1={staffX}
              y1={trebleStaffY}
              x2={staffX}
              y2={bassStaffY + 8 * T.step}
              stroke={T.ink}
              strokeWidth={T.graceLineStroke}
            />
            <text
              x={staffX - 8}
              y={bassStaffY + 8 * T.step}
              fontSize={(bassStaffY + 8 * T.step) - trebleStaffY}
              fontFamily={T.fontMusic}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {T.braceGlyph}
            </text>
          </>
        )}

        <Staff clef={isGrand ? 'treble' : fallbackClef} x={staffX} y={trebleStaffY} width={staffWidth} T={T} />
        {isGrand && (
          <Staff clef="bass" x={staffX} y={bassStaffY} width={staffWidth} T={T} />
        )}

        {intervals.map((iv, i) => {
          const cx = slotCenterX(i)
          const dyadIsHot = activeDyadIdx === i || hoveredDyadIdx === i
          return (
            <g
              key={`lbl-${i}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredDyadIdx(i)}
              onMouseLeave={() => setHoveredDyadIdx(null)}
              onClick={() => handleDyadClick(i)}
            >
              <text
                x={cx} y={labelY}
                fontSize={labelFs}
                fontFamily={T.fontLabel}
                fill={dyadIsHot ? T.highlightAccent : T.ink}
                fontWeight={500}
                textAnchor="middle"
              >
                {iv.label}
              </text>
              {iv.sublabel && (
                <text
                  x={cx} y={sublabelY}
                  fontSize={sublabelFs}
                  fontFamily={T.fontLabel}
                  fill={dyadIsHot ? T.highlightAccent : T.inkSubtle}
                  textAnchor="middle"
                >
                  {iv.sublabel}
                </text>
              )}
            </g>
          )
        })}

        {dyads.map(d => d.staves.map(s => renderStave(d.idx, s)))}
      </svg>

      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center',
        marginTop: 14, flexWrap: 'wrap',
      }}>
        <button
          onClick={playAll}
          disabled={playing || (interacted && !ready)}
          style={btnStyle(T, playing || (interacted && !ready))}
        >
          {playing ? 'Playing…' : 'Play all'}
        </button>
        {interacted && !ready && (
          <span style={{
            fontFamily: T.fontLabel,
            fontSize: T.smallLabelFontSize,
            color: T.inkSubtle,
            fontStyle: 'italic',
          }}>
            Loading piano samples…
          </span>
        )}
      </div>

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}

const btnStyle = (
  T: ReturnType<typeof tokensFor>,
  disabled: boolean = false,
): React.CSSProperties => ({
  fontFamily: T.fontLabel,
  fontSize: 13,
  padding: '8px 18px',
  background: 'transparent',
  border: `0.5px solid ${T.ink}`,
  borderRadius: 8,
  cursor: disabled ? 'wait' : 'pointer',
  color: T.ink,
  opacity: disabled ? 0.5 : 1,
  transition: 'background 150ms ease, opacity 150ms ease',
  minWidth: 120,
})
