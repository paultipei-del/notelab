'use client'

/**
 * <MusicalExample> — the music-notation primitive for /learn.
 *
 * v2 (Phase 1) accepts a multi-stave / multi-voice `Score`. The legacy
 * single-staff `elements` + `clef` props are still accepted and wrapped
 * into a one-stave one-voice Score under the hood, so existing curriculum
 * usages keep their visual output unchanged.
 *
 * Score model (see ./notation-types):
 *   score.staves[]      one stave per system row (treble + bass = grand staff)
 *   stave.voices[]      multi-voice support: V1 stems up, V2 stems down
 *   voice.elements      flat MusicalElement[] (notes / rests / chords)
 *
 * Voices on the same stave (and across staves at the same measure index)
 * share a time grid: all voices land on the same x for elements that begin
 * on the same beat.
 *
 * Limitations (filled in by later Phase work):
 *   - Phase 2: tuplets
 *   - Phase 3: slurs
 *   - Phase 4: articulations / dynamics / ornaments / grace notes
 *   - Phase 5: repeats, key/time changes mid-piece, cross-system ties
 *   - Phase 6: cross-staff stems, beam slope
 *   - Phase 7: optical / proportional spacing engine
 *
 * Audio uses the shared Tone.js sampler. Each voice schedules its own
 * sequence on a common start time. Tied chains within a voice trigger one
 * attack with the combined duration.
 */

import React from 'react'
import { Staff, Caption, NoteHead, Rest, Tie } from './primitives'
import { Beam } from './primitives/Beam'
import { TimeSignature as TimeSigGlyph } from './primitives/TimeSignature'
import { BarLine, type BarLineVariant } from './primitives/BarLine'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, type LearnTokens } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'
import {
  durationToBeats,
  durationToSeconds,
  groupIntoMeasures,
  groupIntoBeams,
  computeStemDirection,
  accidentalsForKey,
  shouldRenderAccidental,
  pitchesOf,
  tiedChainSeconds,
  type MeasuredElement,
  type BeamGroup,
} from '@/lib/learn/visuals/notation-helpers'
import type {
  MusicalElement,
  MusicalNote,
  MusicalAnnotation,
  TimeSignature,
  Duration,
  Score,
  Stave,
  Voice,
  ClefName,
} from '@/lib/learn/visuals/notation-types'

interface MusicalExampleProps {
  /** v2 input: full Score. Takes precedence over `elements`+`clef`. */
  score?: Score
  /** v1 input: single voice on a single stave. Wrapped into a Score. */
  elements?: MusicalElement[]
  /** v1 input: clef for the single stave. Default 'treble'. */
  clef?: Clef
  /** Required for v1 input; ignored when `score` is given (Score carries it). */
  timeSignature?: TimeSignature
  /** Number of sharps (positive) or flats (negative). v1-input only. */
  keySignature?: number

  /** Tempo for playback. Default 80. */
  bpm?: number
  /**
   * Measure indices AFTER which to break to a new system. e.g. [4]
   * starts a new system after measure 4 (measures 0–3 on system 1,
   * 4+ on system 2). Default: render everything on one system.
   */
  systemBreaks?: number[]
  /** Annotations target the primary line (stave 0, voice 0). */
  annotations?: MusicalAnnotation[]
  showPlayButton?: boolean
  showMeasureNumbers?: boolean
  size?: LearnSize
  caption?: string
}

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const
const TREBLE_SHARP_POS: Record<string, number> = { F: 0, C: 3, G: -1, D: 2, A: 5, E: 1, B: 4 }
const TREBLE_FLAT_POS: Record<string, number> = { B: 4, E: 1, A: 5, D: 2, G: 6, C: 3, F: 7 }
const BASS_SHARP_POS: Record<string, number> = { F: 2, C: 5, G: 1, D: 4, A: 7, E: 3, B: 6 }
const BASS_FLAT_POS: Record<string, number> = { B: 6, E: 3, A: 7, D: 4, G: 1, C: 5, F: 2 }

const FLAG_UP_8 = ''
const FLAG_UP_16 = ''
const FLAG_DOWN_8 = ''
const FLAG_DOWN_16 = ''
const AUG_DOT = ''

// SMuFL articulation glyphs (above/below variants). Codepoints per the
// SMuFL standard articulation range U+E4A0–U+E4FF.
const ARTIC_GLYPHS: Record<string, { above: string; below: string }> = {
  accent:        { above: '', below: '' },
  staccato:      { above: '', below: '' },
  tenuto:        { above: '', below: '' },
  staccatissimo: { above: '', below: '' },
  marcato:       { above: '', below: '' },
  fermata:       { above: '', below: '' },
}
// SMuFL ornament glyphs — common-practice ornaments.
const ORNAMENT_GLYPHS: Record<string, string> = {
  trill:           '',
  mordent:         '',
  invertedMordent: '',
  turn:            '',
}
// SMuFL dynamics — used by Phase-4 dynamics rendering.
const DYNAMIC_GLYPHS: Record<string, string> = {
  pp:  '',
  p:   '',
  mp:  '',
  mf:  '',
  f:   '',
  ff:  '',
  sfz: '',
  fz:  '',
}

function isWhole(d: Duration): boolean {
  return d[0] === 'w'
}

function isDotted(d: Duration): boolean {
  return d.endsWith('.')
}

function flagFor(d: Duration, stemUp: boolean): string | null {
  const base = d[0]
  if (base === 'e') return stemUp ? FLAG_UP_8 : FLAG_DOWN_8
  if (base === 's') return stemUp ? FLAG_UP_16 : FLAG_DOWN_16
  return null
}

function beamCountForDuration(d: Duration): number {
  if (d[0] === 'e') return 1
  if (d[0] === 's') return 2
  return 0
}

function accGlyphFor(
  acc: 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat',
  T: LearnTokens,
): string {
  if (acc === 'sharp') return T.sharpGlyph
  if (acc === 'flat') return T.flatGlyph
  if (acc === 'natural') return T.naturalGlyph
  if (acc === 'doubleSharp') return T.doubleSharpGlyph
  return T.doubleFlatGlyph
}

/* ── Build a Score from incoming props (v1 → v2 compat). ──────────────── */
function buildScoreFromProps(props: MusicalExampleProps): Score {
  if (props.score) return props.score
  if (!props.elements || !props.timeSignature) {
    throw new Error('MusicalExample: provide either `score` or `elements` + `timeSignature`.')
  }
  const stave: Stave = {
    clef: (props.clef ?? 'treble') as ClefName,
    voices: [{ elements: props.elements, stemPolicy: 'auto' }],
  }
  return {
    staves: [stave],
    timeSignature: props.timeSignature,
    keySignature: props.keySignature ?? 0,
  }
}

function effectiveStemPolicy(
  voice: Voice,
  voiceIdx: number,
  voiceCount: number,
): 'auto' | 'up' | 'down' {
  if (voice.stemPolicy && voice.stemPolicy !== 'auto') return voice.stemPolicy
  if (voice.stemPolicy === 'auto') return 'auto'
  // Default: multi-voice → voice 0 up, voice 1 down. Single voice → auto.
  if (voiceCount <= 1) return 'auto'
  return voiceIdx === 0 ? 'up' : 'down'
}

/* ── Layout types ─────────────────────────────────────────────────────── */

interface PlacedElement {
  measured: MeasuredElement
  staveIdx: number
  voiceIdx: number
  /** Center x of the notehead column on the staff. */
  x: number
  /** System index (which line this lands on). */
  systemIdx: number
  /** Per-pitch staff positions (chord support). */
  positions: number[]
  /** Per-pitch accidentals to render (or null). */
  accidentals: Array<
    | 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat'
    | null
  >
  stemDir: 'up' | 'down'
  /** Beam-group index this note belongs to (per-voice within a measure). */
  beamGroupIdx: number | null
  /** Beam count (1 = eighth, 2 = sixteenth, 0 = not beamed). */
  beamCount: number
}

interface VoiceMeasureLayout {
  voiceIdx: number
  /** Effective stem policy for this voice in this measure. */
  stemPolicy: 'auto' | 'up' | 'down'
  /** Multi-voice on this stave? Used for rest stacking. */
  multiVoice: boolean
  placed: PlacedElement[]
  beamGroups: BeamGroup[]
}

interface StaveMeasureLayout {
  staveIdx: number
  /** Active clef for this stave on this measure. */
  clef: ClefName
  /** Y of this stave's top staff line on this system. */
  staffTop: number
  voices: VoiceMeasureLayout[]
  /** If non-null, an inline clef glyph is rendered at the start of this
   *  measure (the clef changed on this stave at this measure). */
  clefChange: ClefName | null
  /** Width reserved at the start of the measure for any stave's inline
   *  clef-change glyph. Shared across all staves of the same measure. */
  clefReserve: number
  /** If non-null, a precautionary (courtesy) clef is rendered just inside
   *  the right edge of this measure — used at the end of a system when
   *  the next system's first measure has a clef change. */
  precautionaryClef: ClefName | null
  /** Width reserved at the right edge of the measure for precautionary
   *  clef glyphs (shared across staves). */
  precautionaryReserve: number
}

interface MeasureLayout {
  systemIdx: number
  /** 0-indexed measure number across the whole piece. */
  globalIdx: number
  /** Measure index within its system. */
  measureIdxInSystem: number
  /** Inclusive start x. */
  x0: number
  /** Width of the measure body (excludes the bar line at the end). */
  width: number
  staves: StaveMeasureLayout[]
}

interface SystemLayout {
  systemIdx: number
  measures: MeasureLayout[]
  /** Per-stave top y (treble first, bass second, etc.). */
  staffTops: number[]
  /** Width of the staff lines on this system (from leftmost margin). */
  staffWidth: number
  /** x where the measures begin (after clef + keysig + timesig). */
  bodyStartX: number
}

/* ── MusicalExample ──────────────────────────────────────────────────── */

export function MusicalExample(props: MusicalExampleProps) {
  const {
    bpm = 80,
    systemBreaks,
    annotations,
    showPlayButton = true,
    showMeasureNumbers = false,
    size = 'inline',
    caption,
  } = props

  const T = tokensFor(size)
  const sampler = useSampler()

  const score = React.useMemo(() => buildScoreFromProps(props), [props])
  const { staves, timeSignature, keySignature = 0 } = score

  // Per-element flash state for click playback feedback. Keyed by composite
  // string `s{stave}v{voice}i{origIdx}` so multi-voice flashes don't collide.
  // A Set of flash keys lets multiple concurrent voices light up at the
  // same time (RH and LH playing notes on the same beat both highlight).
  const [flashKeys, setFlashKeys] = React.useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const flashHoldTimers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const flashCellByKey = React.useCallback((k: string, holdMs = 500) => {
    setFlashKeys(prev => {
      if (prev.has(k)) return prev
      const next = new Set(prev)
      next.add(k)
      return next
    })
    const existing = flashHoldTimers.current.get(k)
    if (existing) clearTimeout(existing)
    const t = setTimeout(() => {
      setFlashKeys(prev => {
        if (!prev.has(k)) return prev
        const next = new Set(prev)
        next.delete(k)
        return next
      })
      flashHoldTimers.current.delete(k)
    }, holdMs)
    flashHoldTimers.current.set(k, t)
  }, [])
  React.useEffect(() => {
    return () => {
      flashHoldTimers.current.forEach(t => clearTimeout(t))
      flashHoldTimers.current.clear()
    }
  }, [])

  const playTimersRef = React.useRef<Array<ReturnType<typeof setTimeout>>>([])
  const clearPlayTimers = React.useCallback(() => {
    playTimersRef.current.forEach(t => clearTimeout(t))
    playTimersRef.current = []
  }, [])
  React.useEffect(() => clearPlayTimers, [clearPlayTimers])

  // ── Layout pipeline ──────────────────────────────────────────────────
  // Per stave, per voice → measure list. measuresByVoice[s][v] = measures[]
  const measuresByVoice = React.useMemo(() => {
    return staves.map(stave =>
      stave.voices.map(voice => groupIntoMeasures(voice.elements, timeSignature)),
    )
  }, [staves, timeSignature])

  // Total measure count = max across all voices. Voices that fall short get
  // empty trailing measures (silent). v2 Phase 1 expects equal-length voices;
  // unequal lengths are tolerated but not heavily exercised yet.
  const totalMeasures = React.useMemo(() => {
    let n = 0
    measuresByVoice.forEach(stave => stave.forEach(voice => {
      if (voice.length > n) n = voice.length
    }))
    return n
  }, [measuresByVoice])

  // Page geometry.
  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)

  const isSharpKey = keySignature > 0
  const ksCount = Math.abs(keySignature)
  const ksOrder = isSharpKey ? SHARP_ORDER : FLAT_ORDER
  const ksPosFor = (clef: ClefName): Record<string, number> =>
    clef === 'treble'
      ? (isSharpKey ? TREBLE_SHARP_POS : TREBLE_FLAT_POS)
      : (isSharpKey ? BASS_SHARP_POS : BASS_FLAT_POS)
  const ksSlot = Math.round(T.accidentalKerning * 0.95)
  const ksWidth = ksCount > 0 ? ksCount * ksSlot + Math.round(8 * T.scale) : 0
  const ksGap = ksWidth > 0 ? Math.round(12 * T.scale) : Math.round(6 * T.scale)

  const tsWidth = Math.round(T.noteheadFontSize * 0.9)
  const tsGap = Math.round(12 * T.scale)

  // Optical (proportional) spacing — sqrt of beat length, per Gould /
  // LilyPond convention. Linear spacing makes whole notes absurdly wide
  // and crushes sixteenths; sqrt compresses long durations and breathes
  // out short ones, producing more even visual density.
  const opticalBase = Math.round(20 * T.scale + 10)
  const opticalBeatScale = Math.round(34 * T.scale + 12)
  const minElementWidth = Math.round(26 * T.scale + 8)
  const accidentalReserve = Math.round(T.accidentalKerning * 0.95) + 4
  const measureRightPad = Math.round(14 * T.scale + 4)

  function elementWidth(m: MeasuredElement): number {
    const beats = Math.max(0.0625, m.beatLen)
    const optical = opticalBase + Math.round(opticalBeatScale * Math.sqrt(beats))
    const intrinsic = Math.max(minElementWidth, optical)
    let bump = 0
    if (m.element.type === 'note') {
      const ps = pitchesOf(m.element)
      if (ps.length > 1) bump += Math.round(8 * T.scale)
    }
    return intrinsic + bump
  }

  // Slot-based unified time grid for a single measure across all voices.
  // Each unique beatStart becomes a slot; slot width = max element width
  // starting there. Voices share x-positions when they share beatStarts;
  // a half note in V1 occupies slot 0 only and lets later eighths in V2
  // determine subsequent slot widths. When a note will render an explicit
  // accidental, its slot is widened by an accidentalReserve so the glyph
  // doesn't crowd the previous element's notehead.
  interface SlotInfo {
    slotXs: Map<number, number>   // beatStart key → x (relative to measure body)
    bodyWidth: number             // total x consumed by slots
  }
  function computeSlots(measureAcrossVoices: MeasuredElement[][]): SlotInfo {
    const widthByBeat = new Map<number, number>()
    measureAcrossVoices.forEach(voiceMeasure => {
      // Per-voice running accidentals so each voice's bump matches what
      // shouldRenderAccidental will decide during placement.
      const running = new Map<string, string>()
      const keyAlt = accidentalsForKey(keySignature)
      voiceMeasure.forEach(m => {
        const baseW = elementWidth(m)
        let hasAccidental = false
        if (m.element.type === 'note') {
          const ps = pitchesOf(m.element)
          for (const p of ps) {
            if (shouldRenderAccidental(p, running, keyAlt)) hasAccidental = true
          }
        }
        const w = baseW + (hasAccidental
          ? accidentalReserve + Math.round(4 * T.scale)
          : 0)
        const key = quantize(m.beatStart)
        widthByBeat.set(key, Math.max(widthByBeat.get(key) ?? 0, w))
      })
    })
    const sorted = Array.from(widthByBeat.keys()).sort((a, b) => a - b)
    const slotXs = new Map<number, number>()
    let cursor = 0
    for (const k of sorted) {
      const w = widthByBeat.get(k)!
      slotXs.set(k, cursor + w / 2)
      cursor += w
    }
    return { slotXs, bodyWidth: cursor }
  }
  function quantize(b: number): number {
    return Math.round(b * 1024)
  }

  // Compute per-measure unified slot layout (relative x positions for each
  // beatStart in the measure across all voices/staves).
  const measureSlots: Array<{ slotXs: Map<number, number>; bodyWidth: number }> = React.useMemo(() => {
    const out: Array<{ slotXs: Map<number, number>; bodyWidth: number }> = []
    for (let mi = 0; mi < totalMeasures; mi++) {
      const allVoiceMeasures: MeasuredElement[][] = []
      for (let si = 0; si < staves.length; si++) {
        const voiceCount = staves[si].voices.length
        for (let vi = 0; vi < voiceCount; vi++) {
          const m = measuresByVoice[si][vi][mi]
          if (m) allVoiceMeasures.push(m)
        }
      }
      const { slotXs, bodyWidth } = computeSlots(allVoiceMeasures)
      out.push({ slotXs, bodyWidth })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staves, measuresByVoice, totalMeasures, T])

  // Active clef per stave per global measure. Driven by stave.clef +
  // stave.clefChanges (sorted by measureIdx).
  const activeClefByStave: ClefName[][] = React.useMemo(() => {
    return staves.map(stave => {
      const arr: ClefName[] = []
      let cur = stave.clef
      const changes = (stave.clefChanges ?? []).slice().sort((a, b) => a.measureIdx - b.measureIdx)
      let ci = 0
      for (let mi = 0; mi < totalMeasures; mi++) {
        while (ci < changes.length && changes[ci].measureIdx <= mi) {
          cur = changes[ci].clef
          ci++
        }
        arr.push(cur)
      }
      return arr
    })
  }, [staves, totalMeasures])

  // Width reserved at the start of a measure for an inline clef-change glyph.
  // Carries enough left padding so the clef glyph doesn't crowd the bar
  // line that ends the previous measure, and right padding so it doesn't
  // crowd the first note's accidental.
  const inlineClefWidth = Math.round(46 * T.scale + 4)
  const inlineClefLeftPad = Math.round(8 * T.scale + 2)
  function clefChangesAtMeasure(globalMi: number): Array<{ staveIdx: number; clef: ClefName }> {
    if (globalMi === 0) return []
    const out: Array<{ staveIdx: number; clef: ClefName }> = []
    for (let si = 0; si < staves.length; si++) {
      const here = activeClefByStave[si][globalMi]
      const prev = activeClefByStave[si][globalMi - 1]
      if (here !== prev) out.push({ staveIdx: si, clef: here })
    }
    return out
  }
  // Precautionary clef = a small clef glyph rendered at the END of a system
  // when the FIRST measure of the NEXT system has a clef change on a stave.
  // Width reserve added to the system's last measure for these glyphs.
  const precautionaryClefWidth = Math.round(50 * T.scale + 4)

  // Split measures into systems based on systemBreaks.
  const systemSlices: Array<[number, number]> = React.useMemo(() => {
    if (!systemBreaks || systemBreaks.length === 0) return [[0, totalMeasures]]
    const sorted = [...systemBreaks].filter(b => b > 0 && b < totalMeasures).sort((a, b) => a - b)
    const out: Array<[number, number]> = []
    let cursor = 0
    for (const b of sorted) {
      out.push([cursor, b])
      cursor = b
    }
    out.push([cursor, totalMeasures])
    return out.filter(([s, e]) => e > s)
  }, [systemBreaks, totalMeasures])

  // Stave geometry on a system.
  const staffHeight = 8 * T.step
  const defaultInterStaffGap = Math.round(110 * T.scale + 8)

  const headroom = Math.round(40 * T.scale + 16)
  const footroom = Math.round(48 * T.scale + 12)
  const annotationHeadroom = annotations && annotations.length > 0
    ? Math.round(34 * T.scale + 10) : 0
  const measureNumberFootroom = showMeasureNumbers
    ? Math.round(20 * T.scale + 6) : 0
  const systemSpacing = Math.round(60 * T.scale + 24)

  // Per-system flexible inter-staff distance: when notes between the staves
  // (low notes in upper stave, high notes in lower stave) need ledger-line
  // room, expand the gap so the noteheads don't crowd the opposite staff.
  function computeInterStaffGap(
    sliceStart: number,
    sliceEnd: number,
    upperIdx: number,
    lowerIdx: number,
  ): number {
    let lowestUpperPos = 8   // below = bigger position number; default = bottom line
    let highestLowerPos = 0  // above = smaller; default = top line
    for (let mi = sliceStart; mi < sliceEnd; mi++) {
      const upperVoices = measuresByVoice[upperIdx] ?? []
      for (const voiceMeasures of upperVoices) {
        const measure = voiceMeasures[mi]
        if (!measure) continue
        for (const me of measure) {
          if (me.element.type !== 'note') continue
          const clef = activeClefByStave[upperIdx][mi]
          for (const pitch of pitchesOf(me.element)) {
            const p = parsePitch(pitch)
            if (!p) continue
            const pos = staffPosition(p, clef)
            if (pos > lowestUpperPos) lowestUpperPos = pos
          }
        }
      }
      const lowerVoices = measuresByVoice[lowerIdx] ?? []
      for (const voiceMeasures of lowerVoices) {
        const measure = voiceMeasures[mi]
        if (!measure) continue
        for (const me of measure) {
          if (me.element.type !== 'note') continue
          const clef = activeClefByStave[lowerIdx][mi]
          for (const pitch of pitchesOf(me.element)) {
            const p = parsePitch(pitch)
            if (!p) continue
            const pos = staffPosition(p, clef)
            if (pos < highestLowerPos) highestLowerPos = pos
          }
        }
      }
    }
    // Slurs on notes near the inter-staff edge add extra vertical room.
    let upperSlurExtra = 0
    let lowerSlurExtra = 0
    for (let mi = sliceStart; mi < sliceEnd; mi++) {
      const upperVoices = measuresByVoice[upperIdx] ?? []
      for (const voiceMeasures of upperVoices) {
        const measure = voiceMeasures[mi]
        if (!measure) continue
        for (const me of measure) {
          if (me.element.type !== 'note') continue
          if (me.element.slur && lowestUpperPos > 8) {
            upperSlurExtra = Math.max(upperSlurExtra, Math.round(12 * T.scale + 4))
          }
        }
      }
      const lowerVoices = measuresByVoice[lowerIdx] ?? []
      for (const voiceMeasures of lowerVoices) {
        const measure = voiceMeasures[mi]
        if (!measure) continue
        for (const me of measure) {
          if (me.element.type !== 'note') continue
          if (me.element.slur && highestLowerPos < 0) {
            lowerSlurExtra = Math.max(lowerSlurExtra, Math.round(12 * T.scale + 4))
          }
        }
      }
    }
    const upperOverhang = lowestUpperPos > 8
      ? (lowestUpperPos - 8) * T.step + T.noteheadHalfHeight + upperSlurExtra
      : 0
    const lowerOverhang = highestLowerPos < 0
      ? -highestLowerPos * T.step + T.noteheadHalfHeight + lowerSlurExtra
      : 0
    // Generous buffer accounts for accidentals + small marks that project
    // toward the opposite stave.
    const buffer = Math.round(34 * T.scale + 12)
    return Math.max(defaultInterStaffGap, upperOverhang + lowerOverhang + buffer)
  }

  // Per-system layout.
  const systems: SystemLayout[] = []
  let curSystemTop = headroom + annotationHeadroom

  systemSlices.forEach(([sliceStart, sliceEnd], systemIdx) => {
    const showTimeSig = systemIdx === 0
    const headerWidth =
      clefReserve
      + clefGap
      + ksWidth
      + ksGap
      + (showTimeSig ? tsWidth + tsGap : 0)
    const bodyStartX = margin + headerWidth

    // Per-system inter-staff gap. With >2 staves, compute pairwise; for
    // grand staff (2 staves) we just compute one value between them.
    const interStaffGaps: number[] = []
    for (let si = 0; si + 1 < staves.length; si++) {
      interStaffGaps.push(computeInterStaffGap(sliceStart, sliceEnd, si, si + 1))
    }
    const oneSystemHeight = staves.length * staffHeight
      + interStaffGaps.reduce((a, b) => a + b, 0)

    const staffTops: number[] = []
    for (let si = 0; si < staves.length; si++) {
      let y = curSystemTop
      for (let k = 0; k < si; k++) {
        y += staffHeight + interStaffGaps[k]
      }
      staffTops.push(y)
    }

    let cursor = bodyStartX
    const measureLayouts: MeasureLayout[] = []

    for (let mi = sliceStart; mi < sliceEnd; mi++) {
      const slot = measureSlots[mi]
      // Inline clef change at this measure? Only count when this isn't the
      // first measure of a system — at a system boundary the new clef is
      // absorbed into the system header instead.
      const isFirstMeasureOfSystem = mi === sliceStart
      const inlineClefChanges = isFirstMeasureOfSystem
        ? []
        : clefChangesAtMeasure(mi)
      const clefReserve = inlineClefChanges.length > 0 ? inlineClefWidth : 0

      // Precautionary clef at the END of this measure if it's the LAST
      // measure of the system AND the next system's first measure has a
      // clef change.
      const isLastMeasureOfSystem = mi === sliceEnd - 1
      const nextSliceStart = sliceEnd  // start of next system
      const precautionaryChanges: Array<{ staveIdx: number; clef: ClefName }> =
        (isLastMeasureOfSystem && nextSliceStart < totalMeasures)
          ? clefChangesAtMeasure(nextSliceStart)
          : []
      const precautionaryReserve = precautionaryChanges.length > 0
        ? precautionaryClefWidth : 0

      const w = clefReserve
        + accidentalReserve + slot.bodyWidth + measureRightPad
        + precautionaryReserve

      const staveLayouts: StaveMeasureLayout[] = staves.map((stave, si) => {
        const staffTop = staffTops[si]
        const activeClef = activeClefByStave[si][mi]
        const voiceLayouts: VoiceMeasureLayout[] = stave.voices.map((voice, vi) => {
          const voiceMeasure = measuresByVoice[si][vi][mi] ?? []
          const policy = effectiveStemPolicy(voice, vi, stave.voices.length)
          const beamGroups = groupIntoBeams(voiceMeasure, timeSignature)
          const placed: PlacedElement[] = []

          const accidentalsRunning = new Map<string, string>()
          const keyAlt = accidentalsForKey(keySignature)

          voiceMeasure.forEach((mEl, idxInMeasure) => {
            const slotKey = quantize(mEl.beatStart)
            const slotX = slot.slotXs.get(slotKey) ?? 0
            const x = cursor + clefReserve + accidentalReserve + slotX

            const entry: PlacedElement = {
              measured: mEl,
              staveIdx: si,
              voiceIdx: vi,
              x,
              systemIdx,
              positions: [],
              accidentals: [],
              stemDir: 'up',
              beamGroupIdx: null,
              beamCount: beamCountForDuration(mEl.element.duration),
            }
            if (mEl.element.type === 'note') {
              const ps = pitchesOf(mEl.element)
              for (const pitch of ps) {
                const parsed = parsePitch(pitch)
                if (!parsed) {
                  entry.positions.push(4)
                  entry.accidentals.push(null)
                  continue
                }
                entry.positions.push(staffPosition(parsed, activeClef))
                entry.accidentals.push(
                  shouldRenderAccidental(pitch, accidentalsRunning, keyAlt),
                )
              }
              // forceStem (from MusicXML <stem>) > voice policy > auto.
              const forced = (mEl.element as MusicalNote).forceStem
              if (forced) {
                entry.stemDir = forced
              } else if (policy === 'auto') {
                entry.stemDir = computeStemDirection(ps, activeClef)
              } else {
                entry.stemDir = policy
              }
            }
            beamGroups.forEach((bg, bgi) => {
              if (bg.indices.includes(idxInMeasure)) {
                entry.beamGroupIdx = bgi
              }
            })
            placed.push(entry)
          })

          return {
            voiceIdx: vi,
            stemPolicy: policy,
            multiVoice: stave.voices.length > 1,
            placed,
            beamGroups,
          }
        })

        // Inter-voice notehead displacement: when two voices share a beat
        // and have noteheads ≤ 1 staff position apart, the lower-priority
        // voice's notehead is pushed to the right of the slot center so
        // the heads don't overlap. Apply only on multi-voice staves.
        if (stave.voices.length > 1) {
          const noteheadShift = Math.round(T.noteheadFontSize * 0.55)
          for (let vi = 1; vi < voiceLayouts.length; vi++) {
            const me = voiceLayouts[vi]
            for (const p of me.placed) {
              if (p.measured.element.type !== 'note') continue
              for (let v0 = 0; v0 < vi; v0++) {
                const other = voiceLayouts[v0]
                const concurrent = other.placed.find(
                  q => Math.abs(q.measured.beatStart - p.measured.beatStart) < 1e-6,
                )
                if (!concurrent || concurrent.measured.element.type !== 'note') continue
                let collision = false
                for (const a of p.positions) {
                  for (const b of concurrent.positions) {
                    if (Math.abs(a - b) <= 1) { collision = true; break }
                  }
                  if (collision) break
                }
                if (collision) {
                  p.x += noteheadShift
                  break
                }
              }
            }
          }
        }

        return {
          staveIdx: si,
          clef: activeClef,
          staffTop,
          voices: voiceLayouts,
          clefChange: inlineClefChanges.find(c => c.staveIdx === si)?.clef ?? null,
          clefReserve,
          precautionaryClef: precautionaryChanges.find(c => c.staveIdx === si)?.clef ?? null,
          precautionaryReserve,
        }
      })

      // Voice rest omission: if a voice's measure consists of only rests
      // AND another voice on the same stave has any note in that measure,
      // omit the resting voice's elements (don't render). Standard piano
      // engraving convention — avoids redundant rests cluttering the staff.
      staveLayouts.forEach(staveLayout => {
        if (staveLayout.voices.length <= 1) return
        const voiceHasNotes = staveLayout.voices.map(v =>
          v.placed.some(p => p.measured.element.type === 'note'),
        )
        const anyHasNotes = voiceHasNotes.some(Boolean)
        if (!anyHasNotes) return
        staveLayout.voices.forEach((v, vi) => {
          if (voiceHasNotes[vi]) return
          v.placed = []
          v.beamGroups = []
        })
      })

      // Recompute per-measure multi-voice flag based on the EFFECTIVE voice
      // count after rest omission. A measure where only one voice still has
      // content shouldn't apply rest stacking — the resting voice's rest
      // sits on the middle line as if it were the only voice.
      staveLayouts.forEach(staveLayout => {
        const activeVoiceCount = staveLayout.voices.filter(v => v.placed.length > 0).length
        const isMulti = activeVoiceCount > 1
        staveLayout.voices.forEach(v => { v.multiVoice = isMulti })
      })

      measureLayouts.push({
        systemIdx,
        globalIdx: mi,
        measureIdxInSystem: mi - sliceStart,
        x0: cursor,
        width: w,
        staves: staveLayouts,
      })
      cursor += w
    }

    const staffWidth = cursor - margin
    systems.push({
      systemIdx,
      measures: measureLayouts,
      staffTops,
      staffWidth,
      bodyStartX,
    })

    curSystemTop += oneSystemHeight + footroom + measureNumberFootroom + systemSpacing
  })

  // ── Equal-length system stretch (page-fill) ──
  // Different systems naturally end at different x because the first
  // system carries the time signature in its header and successive systems
  // may have different measure counts / content widths. To match
  // engraving convention (every system stretches to a uniform right
  // margin), stretch each shorter system's measure body so it ends at the
  // same x as the longest system. The leading header (clef + ks + ts)
  // stays unchanged; only the measure-body region is scaled.
  if (systems.length > 1) {
    let targetEndX = 0
    systems.forEach(sys => {
      const last = sys.measures[sys.measures.length - 1]
      if (!last) return
      const endX = last.x0 + last.width
      if (endX > targetEndX) targetEndX = endX
    })
    systems.forEach(sys => {
      const last = sys.measures[sys.measures.length - 1]
      if (!last) return
      const naturalBodyW = (last.x0 + last.width) - sys.bodyStartX
      const targetBodyW = targetEndX - sys.bodyStartX
      if (targetBodyW <= naturalBodyW + 0.5) return
      const k = targetBodyW / naturalBodyW
      let cursor = sys.bodyStartX
      sys.measures.forEach(m => {
        const oldX0 = m.x0
        const oldWidth = m.width
        const newWidth = oldWidth * k
        const newX0 = cursor
        // Scale every placed element's x position around the measure's
        // old left edge: x_new = newX0 + (x_old - oldX0) * k.
        m.staves.forEach(stl => {
          stl.voices.forEach(vl => {
            vl.placed.forEach(p => {
              p.x = newX0 + (p.x - oldX0) * k
            })
          })
        })
        m.x0 = newX0
        m.width = newWidth
        cursor += newWidth
      })
      sys.staffWidth = cursor - margin
    })
  }

  // Final SVG dimensions.
  const totalH = curSystemTop - systemSpacing + footroom * 0.5 + measureNumberFootroom + 12
  const totalW = systems.reduce(
    (acc, s) => Math.max(acc, margin + s.staffWidth + margin),
    0,
  )

  // Map each (s,v,origIdx) of the primary line to its system+measure for
  // annotation overlays. Annotations target stave 0, voice 0.
  const primaryElementMap = new Map<number, {
    systemIdx: number
    measureLayout: MeasureLayout
    placed: PlacedElement
  }>()
  systems.forEach(sys => {
    sys.measures.forEach(measureLayout => {
      const primary = measureLayout.staves[0]?.voices[0]
      if (!primary) return
      primary.placed.forEach(p => {
        primaryElementMap.set(p.measured.origIdx, {
          systemIdx: sys.systemIdx,
          measureLayout,
          placed: p,
        })
      })
    })
  })

  // ── Audio playback ────────────────────────────────────────────────────
  const handleNoteClick = async (
    staveIdx: number,
    voiceIdx: number,
    origIdx: number,
    pitches: string[],
    duration: Duration,
    tuplet?: { actual: number; normal: number },
  ) => {
    flashCellByKey(`s${staveIdx}v${voiceIdx}i${origIdx}`)
    const seconds = durationToSeconds(duration, bpm, timeSignature, tuplet)
    await sampler.ensureReady()
    const Tone = await import('tone')
    const t = Tone.now()
    pitches.forEach(p => sampler.playAt(p, seconds, t))
  }

  const [playing, setPlaying] = React.useState(false)
  const handlePlayAll = async () => {
    if (playing) return
    setPlaying(true)
    clearPlayTimers()
    await sampler.ensureReady()
    const Tone = await import('tone')
    const startTime = Tone.now() + 0.1
    let maxEnd = 0

    // Schedule each voice on each stave independently.
    staves.forEach((stave, si) => {
      stave.voices.forEach((voice, vi) => {
        let cursorSec = 0
        const seenTied = new Set<number>()
        voice.elements.forEach((el, idx) => {
          if (el.type === 'rest') {
            // Rests advance the playback cursor but don't flash — the
            // visual highlight should track only what's actually sounding.
            const sec = durationToSeconds(el.duration, bpm, timeSignature, el.tuplet)
            cursorSec += sec
            return
          }
          if (seenTied.has(idx)) return
          const ps = pitchesOf(el)
          const { totalSeconds, chainEnd } = tiedChainSeconds(voice.elements, idx, bpm, timeSignature)
          for (let j = idx + 1; j <= chainEnd; j++) seenTied.add(j)
          const t = startTime + cursorSec
          ps.forEach(p => sampler.playAt(p, totalSeconds, t))
          const flashTimer = setTimeout(
            () => flashCellByKey(`s${si}v${vi}i${idx}`, totalSeconds * 1000),
            (t - Tone.now()) * 1000,
          )
          playTimersRef.current.push(flashTimer)
          cursorSec += totalSeconds
        })
        if (cursorSec > maxEnd) maxEnd = cursorSec
      })
    })

    const stopTimer = setTimeout(
      () => setPlaying(false),
      (startTime + maxEnd - Tone.now()) * 1000 + 200,
    )
    playTimersRef.current.push(stopTimer)
  }

  // ── Render ────────────────────────────────────────────────────────────
  const isGrandStaff = staves.length > 1
  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Musical example'}
      >
        {systems.map(sys => {
          const sliceStart = sys.measures[0]?.globalIdx ?? 0
          const systemStartClef = (si: number): ClefName =>
            activeClefByStave[si]?.[sliceStart] ?? staves[si].clef
          return (
          <g key={`sys-${sys.systemIdx}`}>
            {/* Staves: one per stave in the score, plus brace if multi. */}
            {staves.map((_, si) => (
              <Staff
                key={`staff-${sys.systemIdx}-${si}`}
                clef={systemStartClef(si)}
                x={margin}
                y={sys.staffTops[si]}
                width={sys.staffWidth}
                T={T}
              />
            ))}
            {isGrandStaff && (
              <SystemBrace
                x={margin}
                topY={sys.staffTops[0]}
                bottomY={sys.staffTops[sys.staffTops.length - 1] + staffHeight}
                T={T}
              />
            )}

            {/* Per-stave key signature on every system. */}
            {staves.map((_, si) => {
              if (ksCount === 0) return null
              const posMap = ksPosFor(systemStartClef(si))
              return (
                <g key={`ks-${sys.systemIdx}-${si}`}>
                  {ksOrder.slice(0, ksCount).map((letter, i) => (
                    <text
                      key={`ks-${sys.systemIdx}-${si}-${i}`}
                      x={margin + clefReserve + clefGap + i * ksSlot + ksSlot / 2}
                      y={sys.staffTops[si] + posMap[letter] * T.step}
                      fontSize={T.accidentalFontSize}
                      fontFamily={T.fontMusic}
                      fill={T.ink}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {isSharpKey ? T.sharpGlyph : T.flatGlyph}
                    </text>
                  ))}
                </g>
              )
            })}

            {/* Time signature only on first system. Centered vertically on
                every stave (grand staff: one per stave). */}
            {sys.systemIdx === 0 && staves.map((_, si) => (
              <TimeSigGlyph
                key={`ts-${si}`}
                numerator={timeSignature.numerator}
                denominator={timeSignature.denominator}
                x={margin + clefReserve + clefGap + ksWidth + ksGap + tsWidth / 2}
                staffTop={sys.staffTops[si]}
                T={T}
              />
            ))}

            {/* Measures + bar lines + per-voice element rendering. */}
            {sys.measures.map((m, mi) => {
              const isLastMeasureOfPiece =
                sys.systemIdx === systems.length - 1 && mi === sys.measures.length - 1
              const barlineX = m.x0 + m.width
              return (
                <g key={`m-${sys.systemIdx}-${mi}`}>
                  {/* Inline clef-change glyphs at measure start (one per
                      stave whose clef differs from the previous measure).
                      Positioned with left-pad from the barline so the glyph
                      doesn't overlap the previous measure's bar line. */}
                  {m.staves.map(staveLayout => (
                    staveLayout.clefChange ? (
                      <InlineClef
                        key={`clef-change-${sys.systemIdx}-${mi}-s${staveLayout.staveIdx}`}
                        clef={staveLayout.clefChange}
                        x={m.x0 + inlineClefLeftPad
                          + (staveLayout.clefReserve - inlineClefLeftPad) / 2}
                        staffTop={staveLayout.staffTop}
                        T={T}
                        scale={0.78}
                      />
                    ) : null
                  ))}

                  {/* Precautionary clef glyphs at the END of this measure
                      (just before the bar line) — when the next system's
                      first measure has a clef change. Shifted left of the
                      reserve's centre so the glyph (especially the bass
                      clef's dots) doesn't touch the bar line. */}
                  {m.staves.map(staveLayout => (
                    staveLayout.precautionaryClef ? (
                      <InlineClef
                        key={`pclef-${sys.systemIdx}-${mi}-s${staveLayout.staveIdx}`}
                        clef={staveLayout.precautionaryClef}
                        x={barlineX - staveLayout.precautionaryReserve * 0.62}
                        staffTop={staveLayout.staffTop}
                        T={T}
                        scale={0.78}
                      />
                    ) : null
                  ))}

                  {/* Per-stave: per-voice notes / rests / beams / ties. */}
                  {m.staves.map(staveLayout => (
                    <g key={`m-${sys.systemIdx}-${mi}-s${staveLayout.staveIdx}`}>
                      {staveLayout.voices.map(voiceLayout => (
                        <g key={`m-${sys.systemIdx}-${mi}-s${staveLayout.staveIdx}-v${voiceLayout.voiceIdx}`}>
                          {voiceLayout.placed.map(p =>
                            renderPlaced(p, staveLayout, voiceLayout, T, flashKeys, handleNoteClick),
                          )}
                          {voiceLayout.beamGroups.map((bg, bgi) =>
                            renderBeam(bg, voiceLayout, staveLayout.staffTop, T),
                          )}
                          {/* Tuplet numbers — one per run of consecutive
                              same-tuplet notes within this voice/measure. */}
                          {renderTuplets(voiceLayout, staveLayout.staffTop, T)}
                          {/* Within-measure ties. */}
                          {voiceLayout.placed.map((p, pi) => {
                            if (p.measured.element.type !== 'note') return null
                            if (!p.measured.element.tied) return null
                            const next = voiceLayout.placed[pi + 1]
                            if (!next) return null
                            return renderTie(p, next, staveLayout.staffTop, T)
                          })}
                        </g>
                      ))}
                    </g>
                  ))}

                  {/* Repeat-start bar line at the LEFT side of this measure
                      (just after the clef-change reserve / before the body). */}
                  {(() => {
                    const mark = (score.measureMarks ?? []).find(mm => mm.measureIdx === m.globalIdx)
                    if (!mark?.startRepeat) return null
                    const x = m.x0 + Math.round(10 * T.scale + 4)
                    if (isGrandStaff) {
                      return (
                        <g>
                          {sys.staffTops.map((sy, si) => (
                            <BarLine
                              key={`sr-${si}`}
                              x={x}
                              staffTop={sy}
                              T={T}
                              variant="startRepeat"
                            />
                          ))}
                        </g>
                      )
                    }
                    return (
                      <BarLine
                        x={x}
                        staffTop={m.staves[0].staffTop}
                        T={T}
                        variant="startRepeat"
                      />
                    )
                  })()}

                  {/* Bar line — single line spanning all staves on grand.
                      End-repeat replaces the right-edge barline when the
                      measure carries that mark; final piece-end takes the
                      thin+thick variant. */}
                  {(() => {
                    const mark = (score.measureMarks ?? []).find(mm => mm.measureIdx === m.globalIdx)
                    const variant: BarLineVariant = mark?.endRepeat
                      ? 'endRepeat'
                      : (isLastMeasureOfPiece ? 'final' : 'normal')
                    if (isGrandStaff && variant !== 'endRepeat') {
                      return (
                        <BarLineSpan
                          x={barlineX}
                          topY={sys.staffTops[0]}
                          bottomY={sys.staffTops[sys.staffTops.length - 1] + staffHeight}
                          T={T}
                          variant={variant === 'final' ? 'final' : 'normal'}
                        />
                      )
                    }
                    if (isGrandStaff) {
                      return (
                        <g>
                          {sys.staffTops.map((sy, si) => (
                            <BarLine
                              key={`bl-${si}`}
                              x={barlineX}
                              staffTop={sy}
                              T={T}
                              variant={variant}
                            />
                          ))}
                        </g>
                      )
                    }
                    return (
                      <BarLine
                        x={barlineX}
                        staffTop={m.staves[0].staffTop}
                        T={T}
                        variant={variant}
                      />
                    )
                  })()}

                  {/* Volta bracket — rendered above the topmost stave when
                      this measure starts a volta. The bracket spans this
                      measure's body width. */}
                  {(() => {
                    const mark = (score.measureMarks ?? []).find(mm => mm.measureIdx === m.globalIdx)
                    if (!mark?.voltaNumber) return null
                    const top = sys.staffTops[0]
                    const labelY = top - Math.round(28 * T.scale + 8)
                    const bracketY = top - Math.round(18 * T.scale + 4)
                    const tickEnd = bracketY + Math.round(8 * T.scale + 3)
                    const x1 = m.x0 + Math.round(4 * T.scale)
                    const x2 = barlineX - Math.round(4 * T.scale)
                    const labelFont = T.size === 'small' ? 11 : T.size === 'hero' ? 14 : 12
                    return (
                      <g key={`volta-${m.globalIdx}`}>
                        <line x1={x1} y1={bracketY} x2={x2} y2={bracketY} stroke={T.ink} strokeWidth={1.4} />
                        <line x1={x1} y1={bracketY} x2={x1} y2={tickEnd} stroke={T.ink} strokeWidth={1.4} />
                        {mark.voltaCloseRight && (
                          <line x1={x2} y1={bracketY} x2={x2} y2={tickEnd} stroke={T.ink} strokeWidth={1.4} />
                        )}
                        <text
                          x={x1 + Math.round(8 * T.scale + 4)}
                          y={labelY}
                          fontSize={labelFont}
                          fontFamily={T.fontLabel}
                          fontWeight={500}
                          fill={T.ink}
                          textAnchor="start"
                          dominantBaseline="central"
                        >
                          {`${mark.voltaNumber}.`}
                        </text>
                      </g>
                    )
                  })()}

                  {/* Measure number below the lowest stave. */}
                  {showMeasureNumbers && (
                    <text
                      x={m.x0 + m.width / 2}
                      y={sys.staffTops[sys.staffTops.length - 1]
                        + staffHeight + Math.round(18 * T.scale + 6)}
                      fontSize={T.smallLabelFontSize}
                      fontFamily={T.fontLabel}
                      fill={T.inkSubtle}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {m.globalIdx + 1}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
          )
        })}

        {/* Cross-measure ties. Destination lookup tries the same voice
            first, then falls back to any voice on the same stave whose
            first element shares a pitch with the source — handles ties
            that cross voice boundaries (common when one voice ends a
            measure and the same melodic line continues in another voice
            in the next measure). Same-system ties draw one full arc;
            cross-system ties draw a partial arc on each system. */}
        {systems.map(sys =>
          sys.measures.map((m, mi) =>
            m.staves.map(staveLayout =>
              staveLayout.voices.map(voiceLayout =>
                voiceLayout.placed.map((p, pi) => {
                  if (p.measured.element.type !== 'note') return null
                  if (!p.measured.element.tied) return null
                  if (voiceLayout.placed[pi + 1]) return null
                  const findDest = (destStave: StaveMeasureLayout): PlacedElement | null => {
                    const fromPitches = pitchesOf(p.measured.element as MusicalNote)
                    const sameVoice = destStave.voices.find(v => v.voiceIdx === voiceLayout.voiceIdx)
                    const candidates: PlacedElement[] = []
                    if (sameVoice?.placed[0]) candidates.push(sameVoice.placed[0])
                    for (const v of destStave.voices) {
                      if (v.voiceIdx === voiceLayout.voiceIdx) continue
                      if (v.placed[0]) candidates.push(v.placed[0])
                    }
                    for (const c of candidates) {
                      if (c.measured.element.type !== 'note') continue
                      const cps = pitchesOf(c.measured.element)
                      if (fromPitches.some(fp => cps.includes(fp))) return c
                    }
                    return null
                  }
                  const sameSysNext = sys.measures[mi + 1]
                  if (sameSysNext) {
                    const destStave = sameSysNext.staves[staveLayout.staveIdx]
                    const dest = destStave ? findDest(destStave) : null
                    if (!dest) return null
                    return renderTie(p, dest, staveLayout.staffTop, T)
                  }
                  // Cross-system fallback.
                  const nextSystem = systems[sys.systemIdx + 1]
                  if (!nextSystem) return null
                  const destMeasure = nextSystem.measures[0]
                  const destStave = destMeasure?.staves[staveLayout.staveIdx]
                  const dest = destStave ? findDest(destStave) : null
                  if (!dest) return null
                  const sourceRightX = m.x0 + m.width
                  const trail = Math.round(20 * T.scale + 6)
                  const destLeftX = nextSystem.bodyStartX - Math.round(8 * T.scale + 4)
                  return (
                    <g key={`xtie-${flashKeyFor(p)}`}>
                      {renderTie(p, { ...p, x: sourceRightX + trail }, staveLayout.staffTop, T)}
                      {renderTie({ ...dest, x: destLeftX }, dest, destStave!.staffTop, T)}
                    </g>
                  )
                }),
              ),
            ),
          ),
        )}

        {/* Slurs — phrase arcs across one or more notes within a voice.
            Same-system slurs draw a single arc; cross-system slurs draw a
            partial arc on each system. Direction is opposite the stem of
            the starting note. */}
        {(() => {
          const arcs: React.ReactNode[] = []
          for (let si = 0; si < staves.length; si++) {
            for (let vi = 0; vi < staves[si].voices.length; vi++) {
              type Anchor = { p: PlacedElement; staffTop: number; system: SystemLayout }
              let openStart: Anchor | null = null
              for (const sys of systems) {
                for (const m of sys.measures) {
                  const stl = m.staves[si]
                  if (!stl) continue
                  const vl = stl.voices.find(v => v.voiceIdx === vi)
                  if (!vl) continue
                  for (const p of vl.placed) {
                    const el = p.measured.element
                    if (el.type !== 'note') continue
                    if (el.slur === 'start') {
                      openStart = { p, staffTop: stl.staffTop, system: sys }
                    } else if (el.slur === 'stop' && openStart) {
                      const start = openStart
                      const end: Anchor = { p, staffTop: stl.staffTop, system: sys }
                      const stemUp = start.p.stemDir === 'up'
                      // Slurs curve OPPOSITE the stem direction, attaching
                      // to the notehead side away from where the stem
                      // extends. Stem-up → slur below (under); stem-down →
                      // slur above (over).
                      const direction: 'over' | 'under' = stemUp ? 'under' : 'over'
                      const key = `slur-s${si}v${vi}-${start.p.measured.origIdx}-${end.p.measured.origIdx}`
                      // Endpoints kiss the notehead's outer edge — no gap.
                      const yFor = (anchor: Anchor) => {
                        const positions = anchor.p.positions
                        if (positions.length === 0) {
                          return stemUp
                            ? anchor.staffTop + 8 * T.step + Math.round(14 * T.scale + 6)
                            : anchor.staffTop - Math.round(14 * T.scale + 6)
                        }
                        const refPos = stemUp ? Math.max(...positions) : Math.min(...positions)
                        const noteY = anchor.staffTop + refPos * T.step
                        return stemUp
                          ? noteY + T.noteheadHalfHeight
                          : noteY - T.noteheadHalfHeight
                      }
                      if (start.system === end.system) {
                        arcs.push(
                          renderSlurArc(start.p.x, end.p.x, yFor(start), yFor(end), direction, T, key),
                        )
                      } else {
                        // Cross-system: trail past last bar line on source,
                        // lead in from left on destination. Each fragment
                        // uses its own end-anchor y (start side trails out
                        // straight; dest side leads in straight).
                        const lastM = start.system.measures[start.system.measures.length - 1]
                        const trail = Math.round(20 * T.scale + 6)
                        const sourceRightX = lastM.x0 + lastM.width + trail
                        const destLeftX = end.system.bodyStartX - Math.round(8 * T.scale + 4)
                        const startY = yFor(start)
                        const endY = yFor(end)
                        arcs.push(
                          renderSlurArc(start.p.x, sourceRightX, startY, startY, direction, T, `${key}-a`),
                        )
                        arcs.push(
                          renderSlurArc(destLeftX, end.p.x, endY, endY, direction, T, `${key}-b`),
                        )
                      }
                      openStart = null
                    }
                  }
                }
              }
            }
          }
          return <g>{arcs}</g>
        })()}

        {/* Annotations target the primary line. */}
        {annotations && annotations.length > 0 && annotations.map((ann, ai) => (
          <AnnotationOverlay
            key={`ann-${ai}`}
            annotation={ann}
            primaryElementMap={primaryElementMap}
            systems={systems}
            T={T}
            staffHeight={staffHeight}
          />
        ))}
      </svg>

      {showPlayButton && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={handlePlayAll}
            disabled={playing}
            style={{
              fontFamily: T.fontLabel,
              fontSize: 12,
              color: T.bgPaper,
              background: T.ink,
              border: 'none',
              padding: '6px 14px',
              borderRadius: 4,
              cursor: playing ? 'wait' : 'pointer',
              letterSpacing: '0.04em',
              opacity: playing ? 0.55 : 1,
            }}
          >
            {playing ? 'Playing…' : 'Play'}
          </button>
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function flashKeyFor(p: PlacedElement): string {
  return `s${p.staveIdx}v${p.voiceIdx}i${p.measured.origIdx}`
}

function renderPlaced(
  p: PlacedElement,
  stave: StaveMeasureLayout,
  voice: VoiceMeasureLayout,
  T: LearnTokens,
  flashKeys: ReadonlySet<string>,
  onNoteClick: (
    staveIdx: number, voiceIdx: number, origIdx: number,
    pitches: string[], duration: Duration,
    tuplet?: { actual: number; normal: number },
  ) => void,
): React.ReactNode {
  const el = p.measured.element
  const lit = flashKeys.has(flashKeyFor(p))
  const staffTop = stave.staffTop

  if (el.type === 'rest') {
    const restValue = restValueFor(el.duration)
    const dotted = isDotted(el.duration)
    const xCenter = p.x
    // Default rest position: middle line of the 5-line staff
    // (lineY n=2 → staffTop + 4*step). For multi-voice on the same stave,
    // stack voice 0 rests above the middle and voice 1 rests below — far
    // enough that the rest glyph doesn't touch the other voice's notes
    // above or below the stave middle.
    let restY = staffTop + 4 * T.step
    if (voice.multiVoice) {
      const offset = 3 * T.step
      restY = voice.voiceIdx === 0 ? restY - offset : restY + offset
    }
    return (
      <g key={`el-${flashKeyFor(p)}`}>
        <Rest
          value={restValue}
          x={xCenter}
          y={restY}
          T={T}
          highlight={lit}
        />
        {dotted && (
          <text
            x={xCenter + Math.round(T.noteheadFontSize * 0.32)}
            y={restY - Math.round(3 * T.scale)}
            fontSize={T.noteheadFontSize}
            fontFamily={T.fontMusic}
            fill={lit ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {AUG_DOT}
          </text>
        )}
      </g>
    )
  }

  // Note (possibly chord).
  const ps = pitchesOf(el)
  const noteClickArg = () =>
    onNoteClick(p.staveIdx, p.voiceIdx, p.measured.origIdx, ps, el.duration, el.tuplet)

  const headDuration = (() => {
    const base = el.duration[0]
    if (base === 'w') return 'whole' as const
    if (base === 'h') return 'half' as const
    return 'quarter' as const
  })()
  const stemUp = p.stemDir === 'up'
  const minPos = p.positions.length > 0 ? Math.min(...p.positions) : 4
  const maxPos = p.positions.length > 0 ? Math.max(...p.positions) : 4
  const stemAnchorPos = stemUp ? maxPos : minPos
  const stemAnchorY = staffTop + stemAnchorPos * T.step
  const stemX = stemUp ? p.x + T.stemXOffset : p.x - T.stemXOffset
  const inBeam = p.beamGroupIdx !== null
  const chordSpan = (maxPos - minPos) * T.step
  const naturalExtension = T.stemLength + chordSpan
  const stemTipY = stemUp
    ? stemAnchorY - naturalExtension
    : stemAnchorY + naturalExtension
  const renderStem = !isWhole(el.duration) && !inBeam
  const renderFlag = !inBeam && !isWhole(el.duration) && (el.duration[0] === 'e' || el.duration[0] === 's')
  const flagGlyph = renderFlag ? flagFor(el.duration, stemUp) : null

  const accidentals = p.accidentals
  const accidentalX = p.x - Math.round(T.accidentalKerning * 0.95)

  return (
    <g
      key={`el-${flashKeyFor(p)}`}
      onClick={noteClickArg}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`${ps.join(', ')} ${el.duration}`}
    >
      {accidentals.map((acc, i) => {
        if (!acc) return null
        const noteY = staffTop + p.positions[i] * T.step
        return (
          <text
            key={`acc-${flashKeyFor(p)}-${i}`}
            x={accidentalX}
            y={noteY}
            fontSize={T.accidentalFontSize}
            fontFamily={T.fontMusic}
            fill={lit ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {accGlyphFor(acc, T)}
          </text>
        )
      })}

      {ps.map((pitch, i) => (
        <NoteHead
          key={`nh-${flashKeyFor(p)}-${i}`}
          pitch={pitch}
          staffTop={staffTop}
          x={p.x}
          clef={stave.clef}
          T={T}
          duration={headDuration}
          noStem
          noAccidental
          highlight={lit}
        />
      ))}

      {renderStem && (
        <line
          x1={stemX}
          y1={stemAnchorY}
          x2={stemX}
          y2={stemTipY}
          stroke={lit ? T.highlightAccent : T.ink}
          strokeWidth={T.stemStroke}
        />
      )}

      {flagGlyph && (
        <text
          x={stemX - 0.5}
          y={stemUp ? stemTipY : stemTipY + Math.round(10 * T.scale)}
          fontSize={Math.round(T.noteheadFontSize * 0.9)}
          fontFamily={T.fontMusic}
          fill={lit ? T.highlightAccent : T.ink}
          textAnchor="start"
          dominantBaseline="auto"
        >
          {flagGlyph}
        </text>
      )}

      {isDotted(el.duration) && p.positions.map((pos, i) => {
        const onLine = pos % 2 === 0
        const dotPos = onLine ? pos - 1 : pos
        const dotX = p.x + Math.round(T.noteheadFontSize * 0.30)
        const dotY = staffTop + dotPos * T.step
        return (
          <text
            key={`dot-${flashKeyFor(p)}-${i}`}
            x={dotX}
            y={dotY}
            fontSize={T.noteheadFontSize}
            fontFamily={T.fontMusic}
            fill={lit ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {AUG_DOT}
          </text>
        )
      })}

      {/* Articulations — placed on the side opposite the stem when
          possible (above for stem-down notes, below for stem-up). Fermata
          always sits ABOVE regardless of stem direction. The glyph sits
          flush against the notehead with only a hair of breathing room. */}
      {el.articulations && el.articulations.length > 0 && el.articulations.map((a, i) => {
        const glyphSet = ARTIC_GLYPHS[a]
        if (!glyphSet) return null
        const above = a === 'fermata' ? true : !stemUp
        const glyph = above ? glyphSet.above : glyphSet.below
        // Glyph centre sits just past the notehead's outer edge. The visible
        // glyph (especially the staccato dot) is small enough that minimal
        // gap reads as "attached to the note" without overlap.
        const baseGap = a === 'fermata'
          ? Math.round(10 * T.scale + 4)
          : 0
        const offset = baseGap + i * Math.round(T.noteheadFontSize * 0.22)
        const refPos = above ? minPos : maxPos
        const refY = staffTop + refPos * T.step
        const y = above
          ? refY - T.noteheadHalfHeight - offset
          : refY + T.noteheadHalfHeight + offset
        const fontSize = a === 'fermata'
          ? Math.round(T.noteheadFontSize * 0.78)
          : Math.round(T.noteheadFontSize * 0.62)
        return (
          <text
            key={`art-${flashKeyFor(p)}-${i}`}
            x={p.x}
            y={y}
            fontSize={fontSize}
            fontFamily={T.fontMusic}
            fill={lit ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {glyph}
          </text>
        )
      })}

      {/* Ornaments — always above the notehead, stacked vertically. */}
      {el.ornaments && el.ornaments.length > 0 && el.ornaments.map((o, i) => {
        const glyph = ORNAMENT_GLYPHS[o]
        if (!glyph) return null
        const offset = Math.round(18 * T.scale + 6) + i * Math.round(T.noteheadFontSize * 0.36)
        const refY = staffTop + minPos * T.step
        return (
          <text
            key={`orn-${flashKeyFor(p)}-${i}`}
            x={p.x}
            y={refY - T.noteheadHalfHeight - offset}
            fontSize={Math.round(T.noteheadFontSize * 0.85)}
            fontFamily={T.fontMusic}
            fill={lit ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {glyph}
          </text>
        )
      })}
    </g>
  )
}

function restValueFor(d: Duration): 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' {
  const base = d[0]
  if (base === 'w') return 'whole'
  if (base === 'h') return 'half'
  if (base === 'q') return 'quarter'
  if (base === 'e') return 'eighth'
  return 'sixteenth'
}

function renderBeam(
  bg: BeamGroup,
  voice: VoiceMeasureLayout,
  staffTop: number,
  T: LearnTokens,
): React.ReactNode {
  const placed = bg.indices.map(i => voice.placed[i])
  if (placed.length < 2) return null

  // Stem direction for the group. forceStem (from MusicXML <stem>) on any
  // member wins; otherwise voice policy; otherwise average position.
  let stemDir: 'up' | 'down' | null = null
  for (const p of placed) {
    const el = p.measured.element
    if (el.type === 'note' && el.forceStem) {
      stemDir = el.forceStem
      break
    }
  }
  if (!stemDir) {
    if (voice.stemPolicy === 'up') stemDir = 'up'
    else if (voice.stemPolicy === 'down') stemDir = 'down'
    else {
      const allPositions: number[] = []
      for (const p of placed) allPositions.push(...p.positions)
      if (allPositions.length === 0) return null
      const avg = allPositions.reduce((a, b) => a + b, 0) / allPositions.length
      stemDir = avg >= 4 ? 'up' : 'down'
    }
  }

  // Override per-note stem direction within this group so all stems align.
  placed.forEach(p => {
    p.stemDir = stemDir
  })

  // Compute "natural" stem-tip Y for each note (used for slope decision).
  const naturalTips = placed.map(p => {
    const pos = stemDir === 'up' ? Math.max(...p.positions) : Math.min(...p.positions)
    const anchorY = staffTop + pos * T.step
    const span = (Math.max(...p.positions) - Math.min(...p.positions)) * T.step
    const ext = T.stemLength + span * 0.5
    return stemDir === 'up' ? anchorY - ext : anchorY + ext
  })

  // Beam slope follows the contour of the first → last natural-tip Y, but
  // gently — clamped so the beam never points away from where its end-of-
  // run note sits. Also clamped to a maximum slope for engraving sanity.
  const noteXs = placed.map(p => p.x)
  const firstStemX = stemDir === 'up'
    ? noteXs[0] + T.stemXOffset
    : noteXs[0] - T.stemXOffset
  const lastStemX = stemDir === 'up'
    ? noteXs[noteXs.length - 1] + T.stemXOffset
    : noteXs[noteXs.length - 1] - T.stemXOffset
  // Take the EXTREMA of the contour and use them as the line endpoints,
  // ensuring the beam clears every stem.
  const extremaY = stemDir === 'up'
    ? Math.min(...naturalTips)
    : Math.max(...naturalTips)
  // Compute desired slope from first to last natural Y, dampen.
  const dy = naturalTips[naturalTips.length - 1] - naturalTips[0]
  const dx = lastStemX - firstStemX
  const rawSlope = dx === 0 ? 0 : dy / dx
  const maxAbsSlope = 0.22  // gentle cap (~ 1 staff space per beam group)
  const dampened = Math.max(-maxAbsSlope, Math.min(maxAbsSlope, rawSlope * 0.6))
  // Anchor at the extrema: choose the y at firstStemX so the line doesn't
  // cross any stem in the wrong direction.
  // First find the line that passes through extrema and has the dampened slope.
  // y(x) = a + dampened * (x - reference). Pick reference = the note whose
  // natural tip equals extremaY.
  const refIdx = stemDir === 'up'
    ? naturalTips.indexOf(Math.min(...naturalTips))
    : naturalTips.indexOf(Math.max(...naturalTips))
  const refX = stemDir === 'up'
    ? noteXs[refIdx] + T.stemXOffset
    : noteXs[refIdx] - T.stemXOffset
  const beamYAtX = (x: number) => extremaY + dampened * (x - refX)
  const beamY = beamYAtX(firstStemX)
  const beamY2 = beamYAtX(lastStemX)

  // Per-note beam counts so mixed-value groups (dotted-eighth + sixteenth,
  // etc.) get correct broken-beam fragments at the higher level.
  const noteBeamCounts = bg.beamCounts.slice()

  return (
    <g key={`beam-${flashKeyFor(placed[0])}`}>
      {placed.map((p, j) => {
        const anchorPos = stemDir === 'up' ? Math.max(...p.positions) : Math.min(...p.positions)
        const stemAnchorY = staffTop + anchorPos * T.step
        const stemX = stemDir === 'up' ? p.x + T.stemXOffset : p.x - T.stemXOffset
        const stemBeamY = beamYAtX(stemX)
        return (
          <line
            key={`bstem-${j}`}
            x1={stemX}
            y1={stemAnchorY}
            x2={stemX}
            y2={stemBeamY}
            stroke={T.ink}
            strokeWidth={T.stemStroke}
          />
        )
      })}
      <Beam
        noteXs={noteXs}
        beamY={beamY}
        beamY2={beamY2}
        noteBeamCounts={noteBeamCounts}
        stemDirection={stemDir}
        T={T}
      />
    </g>
  )
}

/**
 * For each run of consecutive same-tuplet placed elements in a voice's
 * measure, render the tuplet number ("3" for triplet, etc.) above the beam
 * (or above the noteheads if the group isn't beamed). No bracket — just
 * the number, in italic — matches the modern engraving convention for
 * beamed tuplets.
 */
function renderTuplets(
  voice: VoiceMeasureLayout,
  staffTop: number,
  T: LearnTokens,
): React.ReactNode {
  const placed = voice.placed
  if (placed.length === 0) return null

  type Run = { from: number; to: number; actual: number }
  const runs: Run[] = []
  let i = 0
  while (i < placed.length) {
    const t = placed[i].measured.element.type === 'note' || placed[i].measured.element.type === 'rest'
      ? placed[i].measured.element.tuplet
      : undefined
    if (!t) { i++; continue }
    let j = i
    while (j + 1 < placed.length) {
      const n = placed[j + 1].measured.element
      const nt = (n.type === 'note' || n.type === 'rest') ? n.tuplet : undefined
      if (!nt) break
      if (nt.actual !== t.actual || nt.normal !== t.normal) break
      // Break at beam-group boundary so each beamed cluster gets its own
      // tuplet number (e.g. two "3"s above two beam groups of triplet
      // eighths in a 2/4 measure rather than one "3" spanning the bar).
      if (placed[j].beamGroupIdx !== placed[j + 1].beamGroupIdx) break
      j++
    }
    runs.push({ from: i, to: j, actual: t.actual })
    i = j + 1
  }

  if (runs.length === 0) return null

  // Stem direction within the voice — used to decide tuplet number side.
  const voiceStemUp =
    voice.stemPolicy === 'up' ? true
    : voice.stemPolicy === 'down' ? false
    : (() => {
        const all: number[] = []
        for (const p of placed) all.push(...p.positions)
        if (all.length === 0) return true
        return (all.reduce((a, b) => a + b, 0) / all.length) >= 4
      })()

  const labelFontSize = T.labelFontSize
  const verticalOffset = Math.round(20 * T.scale + 4)

  return (
    <g>
      {runs.map((run, ri) => {
        const xMin = placed[run.from].x
        const xMax = placed[run.to].x
        const midX = (xMin + xMax) / 2
        // Y above (or below) the staff. For stem-up groups, sit above the
        // staff top; for stem-down, below the staff bottom.
        const y = voiceStemUp
          ? staffTop - verticalOffset
          : staffTop + 8 * T.step + verticalOffset
        return (
          <text
            key={`tup-${ri}-${run.from}`}
            x={midX}
            y={y}
            fontSize={labelFontSize}
            fontFamily={T.fontLabel}
            fontStyle="italic"
            fontWeight={500}
            fill={T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {run.actual}
          </text>
        )
      })}
    </g>
  )
}

/**
 * Slur arc — curved phrase line connecting two notes (or two stem-side
 * endpoints). Direction is opposite the start note's stem (stem-up → arc
 * above; stem-down → arc below). The shape is a tapered crescent path.
 */
function renderSlurArc(
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  direction: 'over' | 'under',
  T: LearnTokens,
  key: string,
): React.ReactNode {
  const sign = direction === 'over' ? -1 : 1
  const dx = x2 - x1
  const dy = y2 - y1
  // Line length (slur "chord"). Arc magnitude scales on this so steeply
  // sloped slurs (notes that drop) still bulge meaningfully — purely
  // horizontal-span scaling makes them read as nearly-straight lines.
  const L = Math.sqrt(dx * dx + dy * dy) || 1
  const arc = Math.max(8, Math.round(L * 0.13 + 5 * T.scale))
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  // Perpendicular to the chord, on the requested side. For 'over' we
  // offset by (dy, -dx)/L * arc; 'under' is the opposite. This rotates
  // the apex with the chord so the curve always reads as a proper bow.
  const perpX = sign === -1 ? dy / L : -dy / L
  const perpY = sign === -1 ? -dx / L : dx / L
  const apexX = midX + perpX * arc
  const apexY = midY + perpY * arc
  const thickness = Math.max(1.4, +(1.8 * T.scale + 0.6).toFixed(2))
  const innerArc = Math.max(1, arc - thickness * 1.4)
  const innerApexX = midX + perpX * innerArc
  const innerApexY = midY + perpY * innerArc
  // Inset along the chord direction. When the slur slopes steeply (big
  // drop or jump), the START side gets an extra inward shift so the curve
  // begins past the first notehead — produces a more natural-looking
  // bow rather than a near-straight line that just barely starts to lift.
  const baseInset = Math.max(1, Math.round(1.5 * T.scale))
  const slopeFactor = Math.abs(dy) / L  // 0 (flat) … 1 (vertical)
  const startExtra = Math.round(slopeFactor * (12 * T.scale + 4))
  const startInset = baseInset + startExtra
  const endInset = baseInset
  const sx1 = x1 + (dx / L) * startInset
  const sy1 = y1 + (dy / L) * startInset
  const sx2 = x2 - (dx / L) * endInset
  const sy2 = y2 - (dy / L) * endInset
  const d =
    `M ${sx1} ${sy1} Q ${apexX} ${apexY}, ${sx2} ${sy2}` +
    ` Q ${innerApexX} ${innerApexY}, ${sx1} ${sy1} Z`
  return <path key={key} d={d} fill={T.ink} stroke="none" />
}

function renderTie(
  from: PlacedElement,
  to: PlacedElement,
  staffTop: number,
  T: LearnTokens,
): React.ReactNode {
  if (from.measured.element.type !== 'note') return null
  const fromPositions = from.positions
  if (fromPositions.length === 0) return null
  const stemUp = from.stemDir === 'up'
  const refPos = stemUp ? Math.max(...fromPositions) : Math.min(...fromPositions)
  // Endpoints kiss the notehead's outer edge — no breathing gap. Standard
  // Gould convention: tie tip is flush with the notehead so the arc reads
  // as connecting the two heads.
  const tieY = staffTop + refPos * T.step + (stemUp
    ? T.noteheadHalfHeight
    : -T.noteheadHalfHeight)
  return (
    <Tie
      key={`tie-${flashKeyFor(from)}`}
      x1={from.x}
      x2={to.x}
      y={tieY}
      direction={stemUp ? 'under' : 'over'}
      T={T}
    />
  )
}

/* Brace + barline span helpers for grand staff. */

function SystemBrace({
  x, topY, bottomY, T,
}: { x: number; topY: number; bottomY: number; T: LearnTokens }) {
  const braceHeight = bottomY - topY
  // The system barline sits at x = staff start, touching the leftmost
  // edge of the staff lines. The brace glyph sits to its left.
  return (
    <g>
      <line
        x1={x} y1={topY}
        x2={x} y2={bottomY}
        stroke={T.ink} strokeWidth={T.graceLineStroke}
      />
      <text
        x={x - 10} y={bottomY}
        fontSize={braceHeight} fontFamily={T.fontMusic}
        fill={T.ink} textAnchor="middle" dominantBaseline="auto"
      >
        {T.braceGlyph}
      </text>
    </g>
  )
}

function InlineClef({
  clef, x, staffTop, T, scale = 0.8,
}: { clef: ClefName; x: number; staffTop: number; T: LearnTokens; scale?: number }) {
  // Mid-piece (and precautionary) clef glyphs render at a fraction of the
  // system clef size.
  if (clef === 'treble') {
    const fontSize = Math.round(T.trebleClefFontSize * scale)
    return (
      <text
        x={x}
        y={staffTop + 6 * T.step}
        fontSize={fontSize}
        fontFamily={T.fontMusic}
        fill={T.ink}
        textAnchor="middle"
        dominantBaseline="auto"
      >
        {T.trebleClefGlyph}
      </text>
    )
  }
  const fontSize = Math.round(T.bassClefFontSize * scale)
  return (
    <text
      x={x}
      y={staffTop + 2 * T.step + T.bassClefYOffset}
      fontSize={fontSize}
      fontFamily={T.fontMusic}
      fill={T.ink}
      textAnchor="middle"
      dominantBaseline="auto"
    >
      {T.bassClefGlyph}
    </text>
  )
}

function BarLineSpan({
  x, topY, bottomY, T, variant,
}: { x: number; topY: number; bottomY: number; T: LearnTokens; variant: 'normal' | 'final' }) {
  const thinStroke = T.staffLineStroke
  const thickStroke = Math.max(thinStroke * 2.5, 3)
  if (variant === 'final') {
    const gap = Math.max(3, Math.round(3 * T.scale))
    return (
      <g>
        <line
          x1={x - gap} y1={topY} x2={x - gap} y2={bottomY}
          stroke={T.ink} strokeWidth={thinStroke}
        />
        <rect
          x={x - thickStroke / 2} y={topY}
          width={thickStroke} height={bottomY - topY}
          fill={T.ink}
        />
      </g>
    )
  }
  return (
    <line
      x1={x} y1={topY} x2={x} y2={bottomY}
      stroke={T.ink} strokeWidth={thinStroke}
    />
  )
}

/* ── Annotations (scoped to primary line only). ─────────────────────── */

interface AnnotationOverlayProps {
  annotation: MusicalAnnotation
  primaryElementMap: Map<number, { systemIdx: number; measureLayout: MeasureLayout; placed: PlacedElement }>
  systems: SystemLayout[]
  T: LearnTokens
  staffHeight: number
}

function noteheadVerticalExtent(
  system: SystemLayout,
  startIdx: number,
  endIdx: number,
  T: LearnTokens,
): { top: number; bottom: number } {
  const topStaffTop = system.staffTops[0]
  const bottomStaffTop = system.staffTops[system.staffTops.length - 1]
  let top = topStaffTop
  let bottom = bottomStaffTop + 8 * T.step
  for (const m of system.measures) {
    const primary = m.staves[0]?.voices[0]
    if (!primary) continue
    for (const p of primary.placed) {
      const oi = p.measured.origIdx
      if (oi < startIdx || oi > endIdx) continue
      if (p.measured.element.type !== 'note') continue
      for (const pos of p.positions) {
        const y = m.staves[0].staffTop + pos * T.step
        const noteTop = y - T.noteheadHalfHeight
        const noteBottom = y + T.noteheadHalfHeight
        if (noteTop < top) top = noteTop
        if (noteBottom > bottom) bottom = noteBottom
      }
    }
  }
  return { top, bottom }
}

function systemRangeXs(
  system: SystemLayout,
  startIdx: number,
  endIdx: number,
): { firstX: number; lastX: number } | null {
  let firstX: number | null = null
  let lastX: number | null = null
  for (const m of system.measures) {
    const primary = m.staves[0]?.voices[0]
    if (!primary) continue
    for (const p of primary.placed) {
      const oi = p.measured.origIdx
      if (oi < startIdx || oi > endIdx) continue
      if (firstX === null || p.x < firstX) firstX = p.x
      if (lastX === null || p.x > lastX) lastX = p.x
    }
  }
  if (firstX === null || lastX === null) return null
  return { firstX, lastX }
}

function AnnotationOverlay({
  annotation,
  primaryElementMap,
  systems,
  T,
  staffHeight,
}: AnnotationOverlayProps) {
  const start = primaryElementMap.get(annotation.startIdx)
  const end = primaryElementMap.get(annotation.endIdx)
  if (!start || !end) return null

  const labelFont = T.size === 'small' ? 11 : T.size === 'hero' ? 14 : 12
  const sublabelFont = labelFont - 2
  const isSection = annotation.type === 'section'
  const isCadence = annotation.type === 'cadence'
  const isLabel = annotation.type === 'label'
  const above = (annotation.position ?? 'above') === 'above'

  if (isLabel) {
    const sys = systems[start.systemIdx]
    const topStaffTop = sys.staffTops[0]
    const bottomStaffBottom = sys.staffTops[sys.staffTops.length - 1] + staffHeight
    const baseY = above
      ? topStaffTop - Math.round(20 * T.scale + 6)
      : bottomStaffBottom + Math.round(28 * T.scale + 8)
    return (
      <text
        x={start.placed.x}
        y={baseY}
        fontSize={labelFont}
        fontFamily={T.fontLabel}
        fontStyle="italic"
        fill={T.inkMuted}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {annotation.label}
      </text>
    )
  }

  if (isCadence) {
    const sys = systems[start.systemIdx]
    const topStaffTop = sys.staffTops[0]
    const bottomStaffBottom = sys.staffTops[sys.staffTops.length - 1] + staffHeight
    const baseY = above
      ? topStaffTop - Math.round(20 * T.scale + 6)
      : bottomStaffBottom + Math.round(28 * T.scale + 8)
    const tickHalf = Math.round(6 * T.scale + 4)
    return (
      <g>
        <line
          x1={start.placed.x}
          x2={start.placed.x}
          y1={bottomStaffBottom + 2}
          y2={bottomStaffBottom + 2 + tickHalf}
          stroke={T.ink}
          strokeWidth={1.2}
        />
        <text
          x={start.placed.x}
          y={baseY}
          fontSize={labelFont}
          fontFamily={T.fontLabel}
          fontStyle="italic"
          fill={T.inkMuted}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {annotation.label}
        </text>
      </g>
    )
  }

  const stroke = isSection ? T.highlightAccent : T.ink
  const strokeWidth = isSection ? 1.6 : 1.0
  const tickHeight = Math.round(8 * T.scale + 3)
  const padding = Math.max(Math.round(T.step * 3), Math.round(20 * T.scale + 6))
  const labelOffset = labelFont + 4

  const segments: React.ReactNode[] = []
  for (let s = start.systemIdx; s <= end.systemIdx; s++) {
    const sys = systems[s]
    const topStaffTop = sys.staffTops[0]
    const bottomStaffBottom = sys.staffTops[sys.staffTops.length - 1] + staffHeight
    const isStartSystem = s === start.systemIdx
    const isEndSystem = s === end.systemIdx
    const isSingle = isStartSystem && isEndSystem
    const isIntermediate = !isStartSystem && !isEndSystem

    const lastMeasure = sys.measures[sys.measures.length - 1]
    const sysBodyLeft = sys.bodyStartX + 4
    const sysBodyRight = lastMeasure.x0 + lastMeasure.width - 4

    let x1: number
    let x2: number
    if (isSingle) {
      const r = systemRangeXs(sys, annotation.startIdx, annotation.endIdx)
      if (!r) continue
      x1 = r.firstX
      x2 = r.lastX
    } else if (isStartSystem) {
      const r = systemRangeXs(sys, annotation.startIdx, annotation.endIdx)
      if (!r) continue
      x1 = r.firstX
      x2 = sysBodyRight
    } else if (isEndSystem) {
      const r = systemRangeXs(sys, annotation.startIdx, annotation.endIdx)
      if (!r) continue
      x1 = sysBodyLeft
      x2 = r.lastX
    } else {
      x1 = sysBodyLeft
      x2 = sysBodyRight
    }

    const ext = isIntermediate
      ? { top: topStaffTop, bottom: bottomStaffBottom }
      : noteheadVerticalExtent(sys, annotation.startIdx, annotation.endIdx, T)
    const bracketY = above
      ? Math.min(ext.top, topStaffTop) - padding
      : Math.max(ext.bottom, bottomStaffBottom) + padding
    const tickEnd = above ? bracketY + tickHeight : bracketY - tickHeight

    const showLeftTick = isSingle || isStartSystem
    const showRightTick = isSingle || isEndSystem
    const showLabel = isSingle || isStartSystem
    const labelY = above ? bracketY - labelOffset : bracketY + labelOffset

    segments.push(
      <g key={`anno-seg-${s}`}>
        <line x1={x1} y1={bracketY} x2={x2} y2={bracketY} stroke={stroke} strokeWidth={strokeWidth} />
        {showLeftTick && (
          <line x1={x1} y1={bracketY} x2={x1} y2={tickEnd} stroke={stroke} strokeWidth={strokeWidth} />
        )}
        {showRightTick && (
          <line x1={x2} y1={bracketY} x2={x2} y2={tickEnd} stroke={stroke} strokeWidth={strokeWidth} />
        )}
        {showLabel && (
          <>
            <text
              x={(x1 + x2) / 2}
              y={labelY}
              fontSize={labelFont}
              fontFamily={T.fontLabel}
              fontWeight={isSection ? 600 : 500}
              fill={isSection ? T.highlightAccent : T.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {annotation.label}
            </text>
            {annotation.sublabel && (
              <text
                x={(x1 + x2) / 2}
                y={above ? labelY - sublabelFont - 2 : labelY + sublabelFont + 2}
                fontSize={sublabelFont}
                fontFamily={T.fontLabel}
                fontStyle="italic"
                fill={T.inkMuted}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {annotation.sublabel}
              </text>
            )}
          </>
        )}
      </g>,
    )
  }

  return <g>{segments}</g>
}
