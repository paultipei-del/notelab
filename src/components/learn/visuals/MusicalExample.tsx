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
 * Score-marking annotations (added in Chapter IX infra):
 *   voice.dynamics[]    DynamicMark { beat, level, modifier? } — Bravura
 *                       glyph (pp/p/mp/mf/f/ff/sfz/fz) below treble or
 *                       above bass at the resolved beat x.
 *   voice.hairpins[]    Hairpin { startBeat, endBeat, direction, placement? }
 *                       — two-line wedge (`<` cresc., `>` decresc.) split
 *                       cleanly across systems.
 *   voice.pedalMarks[]  PedalMark { startBeat, endBeat, style? } — 'text'
 *                       renders Ped./✱ glyphs at endpoints; 'bracket'
 *                       draws a continuous bracket below the bottom-most
 *                       stave with end ticks.
 *   score.tempoMarkings[]  TempoMarking { measureIdx, beat?, text?, metronome?,
 *                       style?, endMeasureIdx? } — placed above the top
 *                       staff. 'normal' = bold serif (Allegro); 'change'
 *                       = italic (rit., a tempo); 'change-with-line' adds
 *                       a dashed continuation line spanning to endMeasureIdx.
 *
 * Limitations still open:
 *   - Grace notes (data field exists but renderer skips them)
 *   - Tremolo, arpeggio sign
 *   - Mid-piece key / time changes (data fields exist, no renderer)
 *   - Cross-staff stems, asymmetric-meter beaming (5/4, 7/8)
 *   - Audio velocity from dynamics (visual-only for now)
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
  cautionaryAccidentalKind,
  pitchesOf,
  playPitchesOf,
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
import { ARTIC_GLYPHS, ORNAMENT_GLYPHS, DYNAMIC_GLYPHS, PEDAL_GLYPHS, METRONOME_GLYPHS } from '@/lib/bravura'

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
  /**
   * Beam-grouping override. Only useful for the beaming-rules lesson.
   * 'standard' (default) follows engraving rules. 'all-together' beams
   * every beamable note as one group (wrong on purpose). 'none' draws
   * no beams (every eighth/sixteenth flagged). Don't use elsewhere.
   */
  beamOverride?: 'standard' | 'all-together' | 'none'
  /** Suppress the Play button and click-to-play feedback. Default false. */
  audio?: boolean
  /** When true, every note renders in the highlight-accent color. Used by
   *  external "play me" controls (e.g. TransposingDemo) that want the staff
   *  to flash in sync with their own button state. */
  highlightAll?: boolean
  /**
   * '5-line' (default) is normal pitched notation. '1-line' renders a
   * single horizontal line, no clef, no key signature; pitch fields are
   * IGNORED — every notehead sits on the line. For rhythmic-only
   * notation. Audio plays each rhythmic note at a neutral fixed pitch.
   */
  staffType?: '5-line' | '1-line'
  showPlayButton?: boolean
  showMeasureNumbers?: boolean
  /** Render every beat (1, 2, 3, …) below the staff, evenly spaced across each
   *  measure. Useful for rhythmic-dictation lessons — beats appear even if no
   *  note attacks there (mid-rest, mid-held-note). */
  showBeatNumbers?: boolean
  /** Play a metronome click on every beat during Play. Accents the downbeat
   *  of each measure. Off by default. */
  metronome?: boolean
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

// SMuFL glyph maps for articulations / ornaments / dynamics live in
// '@/lib/bravura' so they can be reused by other primitives. The local
// destructure below keeps the reference style of the rest of this file
// unchanged.

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
  /** Per-pitch parallel array: true → render the accidental in parens
   *  (cautionary / courtesy marking). */
  accidentalCautionary: boolean[]
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
    annotations: annotationsTopLevel,
    beamOverride = 'standard',
    audio = true,
    highlightAll = false,
    staffType = '5-line',
    showPlayButton: showPlayButtonRaw = true,
    showMeasureNumbers = false,
    showBeatNumbers = false,
    metronome = false,
    size = 'inline',
    caption,
  } = props
  const showPlayButton = audio && showPlayButtonRaw
  const isOneLine = staffType === '1-line'

  const T = tokensFor(size)
  const sampler = useSampler()

  const score = React.useMemo(() => buildScoreFromProps(props), [props])
  const { staves, timeSignature, keySignature = 0, pickupBeats } = score
  // Author-friendly fallback: some MDX pages nest `annotations` inside the
  // `score` prop. Honor either form; top-level wins if both are provided.
  const annotations = annotationsTopLevel ?? (score as Score & { annotations?: MusicalAnnotation[] }).annotations

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
      stave.voices.map(voice => groupIntoMeasures(voice.elements, timeSignature, pickupBeats)),
    )
  }, [staves, timeSignature, pickupBeats])

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
  // Above-position 'label' annotations render as chord-symbol style — bigger
  // serif type, positioned above the actual stem-tip extent. Reserve extra
  // headroom whenever any such label exists so it doesn't get clipped at
  // the top of the SVG.
  const hasAboveLabels = (annotations ?? []).some(
    a => a.type === 'label' && (a.position ?? 'above') === 'above',
  )
  const hasBelowLabels = (annotations ?? []).some(
    a => a.type === 'label' && a.position === 'below',
  )
  const hasAboveBrackets = (annotations ?? []).some(
    a => (a.type === 'section' || a.type === 'bracket')
      && (a.position ?? 'above') === 'above',
  )
  const hasChordSymbolsLocal = (props.score?.chordSymbols?.length ?? 0) > 0
  const annotationHeadroom = annotations && annotations.length > 0
    ? Math.round(34 * T.scale + 10)
      + (hasAboveLabels ? Math.round(40 * T.scale + 16) : 0)
      + (hasAboveBrackets && hasChordSymbolsLocal ? Math.round(36 * T.scale + 16) : 0)
    : 0
  // Below labels need their own footroom budget so labels under low notes
  // (e.g. C4 below the staff) don't run off the bottom of the SVG.
  const annotationFootroom = hasBelowLabels ? Math.round(36 * T.scale + 12) : 0
  const hasTempoMarkings = (score.tempoMarkings?.length ?? 0) > 0
  const tempoHeadroom = hasTempoMarkings ? Math.round(58 * T.scale + 24) : 0
  const hasChordSymbols = (score.chordSymbols?.length ?? 0) > 0
  const chordSymbolHeadroom = hasChordSymbols ? Math.round(48 * T.scale + 28) : 0
  const hasVoiceMarks = staves.some(stave =>
    stave.voices.some(v =>
      (v.dynamics?.length ?? 0) > 0
      || (v.hairpins?.length ?? 0) > 0
      || (v.pedalMarks?.length ?? 0) > 0,
    ),
  )
  const voiceMarksFootroom = hasVoiceMarks ? Math.round(50 * T.scale + 18) : 0
  const measureNumberFootroom = showMeasureNumbers
    ? Math.round(20 * T.scale + 6) : 0
  // Per-system above-staff content (chord symbols, above-staff brackets,
  // tempo markings) lives ABOVE system N's staffTop. Without extra spacing,
  // it would overlap whatever system N-1 has BELOW its staff. Add the
  // above-staff budget to systemSpacing so each system gets its own
  // clearance.
  const baseSystemSpacing = Math.round(60 * T.scale + 24)
  const aboveStaffBudget =
    chordSymbolHeadroom
    + tempoHeadroom
    + (hasAboveLabels ? Math.round(40 * T.scale + 16) : 0)
    + (hasAboveBrackets && hasChordSymbolsLocal ? Math.round(36 * T.scale + 16) : 0)
  const systemSpacing = baseSystemSpacing + aboveStaffBudget

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

  // Stem extent pre-pass. Forced-up stems on notes above the top line (or
  // forced-down stems on notes below the bottom line, in multi-voice
  // configs) can project beyond the default headroom/footroom. Pre-scan
  // every voice on every stave to find the worst-case stem-tip distance
  // ABOVE staffTop and BELOW staffBottom, then expand the global
  // headroom/footroom so the SVG viewBox contains those tips.
  let stemExtraHeadroom = 0
  let stemExtraFootroom = 0
  staves.forEach((stave, si) => {
    const staveClef = stave.clef
    stave.voices.forEach(voice => {
      const policy = voice.stemPolicy ?? 'auto'
      voice.elements.forEach(el => {
        if (el.type !== 'note') return
        const ps = pitchesOf(el)
        if (ps.length === 0) return
        const positions: number[] = []
        for (const pitch of ps) {
          const parsed = parsePitch(pitch)
          if (!parsed) continue
          positions.push(staffPosition(parsed, staveClef))
        }
        if (positions.length === 0) return
        // Predict stem direction: explicit forceStem > policy > auto rule.
        let dir: 'up' | 'down'
        if ((el as MusicalNote).forceStem) {
          dir = (el as MusicalNote).forceStem!
        } else if (policy === 'up' || policy === 'down') {
          dir = policy
        } else {
          dir = computeStemDirection(ps, staveClef)
        }
        if (dir === 'up') {
          const topPos = Math.min(...positions)
          // Stem tip y = staffTop + topPos*step - stemLength.
          // Distance above staffTop = -topPos*step + stemLength (for topPos<0).
          const above = -topPos * T.step + T.stemLength
          if (above > stemExtraHeadroom) stemExtraHeadroom = above
        } else {
          const bottomPos = Math.max(...positions)
          // Distance below the bottom staff line (which is at staffTop + 8*step).
          const below = (bottomPos - 8) * T.step + T.stemLength
          if (below > stemExtraFootroom) stemExtraFootroom = below
        }
        // Ornaments stack ABOVE the topmost notehead regardless of stem
        // direction. For high notes (e.g. A5 with a mordent, or any note
        // above the staff with a trill/turn), the ornament glyph can
        // extend further above the staffTop than the stem ever would.
        const ornCount = (el as MusicalNote).ornaments?.length ?? 0
        if (ornCount > 0) {
          const topPos = Math.min(...positions)
          // Match the renderer's offset formula: notehead-half + base offset
          // + per-glyph stack + glyph half-height.
          const baseOffset = Math.round(10 * T.scale + 4)
          const perGlyphStack = Math.round(T.noteheadFontSize * 0.36)
          const glyphHalfHeight = Math.round(T.noteheadFontSize * 0.85 * 0.5)
          const ornAbove = -topPos * T.step
            + T.noteheadHalfHeight
            + baseOffset
            + (ornCount - 1) * perGlyphStack
            + glyphHalfHeight
          if (ornAbove > stemExtraHeadroom) stemExtraHeadroom = ornAbove
        }
      })
    })
  })
  // Add a small breathing pad above stem tips. Extra headroom is only added
  // when the pre-pass result exceeds the default headroom budget. When the
  // score has volta brackets, reserve extra room for the bracket + label
  // that sit ABOVE the topmost stem tip.
  const stemPad = Math.round(8 * T.scale + 4)
  const hasVoltaBracket = (score.measureMarks ?? []).some(m => !!m.voltaNumber)
  const voltaPad = hasVoltaBracket ? Math.round(28 * T.scale + 12) : 0
  const extraTop = Math.max(0, stemExtraHeadroom + stemPad + voltaPad - headroom)
  const extraBottom = Math.max(0, stemExtraFootroom + stemPad - footroom)

  // Per-system layout.
  const systems: SystemLayout[] = []
  let curSystemTop = headroom + extraTop + annotationHeadroom + tempoHeadroom + chordSymbolHeadroom

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
          const beamGroups = groupIntoBeams(voiceMeasure, timeSignature, beamOverride)
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
              accidentalCautionary: [],
              stemDir: 'up',
              beamGroupIdx: null,
              beamCount: beamCountForDuration(mEl.element.duration),
            }
            if (mEl.element.type === 'note') {
              const ps = pitchesOf(mEl.element)
              const isCautionary = (mEl.element as MusicalNote).cautionary === true
              if (isOneLine) {
                // 1-line staff: every note sits on the single line.
                // Pitches are ignored visually; positions = [4] (middle).
                for (let pi = 0; pi < Math.max(1, ps.length); pi++) {
                  entry.positions.push(4)
                  entry.accidentals.push(null)
                  entry.accidentalCautionary.push(false)
                }
                entry.stemDir = 'up'
                beamGroups.forEach((bg, bgi) => {
                  if (bg.indices.includes(idxInMeasure)) entry.beamGroupIdx = bgi
                })
                placed.push(entry)
                return
              }
              for (const pitch of ps) {
                const parsed = parsePitch(pitch)
                if (!parsed) {
                  entry.positions.push(4)
                  entry.accidentals.push(null)
                  entry.accidentalCautionary.push(false)
                  continue
                }
                entry.positions.push(staffPosition(parsed, activeClef))
                if (isCautionary) {
                  // Force the accidental glyph regardless of measure context;
                  // mark for parenthetical rendering. Still update the running
                  // accidentals map so the engraving rules stay consistent for
                  // any later notes in this measure.
                  const kind = cautionaryAccidentalKind(pitch)
                  shouldRenderAccidental(pitch, accidentalsRunning, keyAlt)
                  entry.accidentals.push(kind)
                  entry.accidentalCautionary.push(true)
                } else {
                  entry.accidentals.push(
                    shouldRenderAccidental(pitch, accidentalsRunning, keyAlt),
                  )
                  entry.accidentalCautionary.push(false)
                }
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

    curSystemTop += oneSystemHeight + footroom + voiceMarksFootroom + measureNumberFootroom + systemSpacing
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
  const totalH = curSystemTop - systemSpacing + footroom * 0.5 + extraBottom + measureNumberFootroom + annotationFootroom + 12
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

  // Per-(stave, voice) cumulative-beat → x lookup. Used to resolve
  // dynamics / hairpins / pedal / tempo "beat" anchors to a screen x.
  // beat 0 = downbeat of measure 0; beat == numerator = downbeat of measure 1.
  // Mid-piece time-signature changes aren't yet honored here (the code
  // assumes one constant time signature, matching the rest of v2).
  interface TimingEntry {
    cumBeat: number
    beatLen: number
    x: number
    /** Right boundary of this element on the staff: the next element's x
     *  in the same voice if there is one, otherwise the measure's right
     *  edge. Used to anchor "end-of-span" markings (pedal release ✱,
     *  bracket close, hairpin tail) at the actual end of the held note
     *  rather than at its left attack point. */
    endX: number
    systemIdx: number
    staffTop: number
    measureRightX: number
  }
  const voiceTiming = new Map<string, TimingEntry[]>()
  systems.forEach(sys => {
    sys.measures.forEach(mLayout => {
      const measureStart = mLayout.globalIdx * timeSignature.numerator
      mLayout.staves.forEach(staveLayout => {
        staveLayout.voices.forEach(voiceLayout => {
          const key = `s${staveLayout.staveIdx}v${voiceLayout.voiceIdx}`
          if (!voiceTiming.has(key)) voiceTiming.set(key, [])
          const arr = voiceTiming.get(key)!
          voiceLayout.placed.forEach(p => {
            arr.push({
              cumBeat: measureStart + p.measured.beatStart,
              beatLen: p.measured.beatLen,
              x: p.x,
              endX: 0, // populated after sort
              systemIdx: sys.systemIdx,
              staffTop: staveLayout.staffTop,
              measureRightX: mLayout.x0 + mLayout.width,
            })
          })
        })
      })
    })
  })
  voiceTiming.forEach(arr => {
    arr.sort((a, b) => a.cumBeat - b.cumBeat)
    for (let i = 0; i < arr.length; i++) {
      arr[i].endX = i + 1 < arr.length ? arr[i + 1].x : arr[i].measureRightX
    }
  })

  function resolveBeat(si: number, vi: number, beat: number): TimingEntry | null {
    const arr = voiceTiming.get(`s${si}v${vi}`)
    if (!arr || arr.length === 0) return null
    // Prefer the entry whose [cumBeat, cumBeat+beatLen) contains `beat`.
    for (const entry of arr) {
      if (beat >= entry.cumBeat - 1e-6 && beat < entry.cumBeat + entry.beatLen - 1e-6) {
        return entry
      }
    }
    // Fall back: nearest by cumBeat distance (handles past-end beats).
    let best = arr[0]
    let bestDist = Math.abs(arr[0].cumBeat - beat)
    for (const e of arr) {
      const d = Math.abs(e.cumBeat - beat)
      if (d < bestDist) { best = e; bestDist = d }
    }
    return best
  }

  // ── Audio playback ────────────────────────────────────────────────────
  const handleNoteClick = async (
    staveIdx: number,
    voiceIdx: number,
    origIdx: number,
    pitches: string[],
    duration: Duration,
    tuplet?: { actual: number; normal: number },
  ) => {
    if (!audio) return
    flashCellByKey(`s${staveIdx}v${voiceIdx}i${origIdx}`)
    const seconds = durationToSeconds(duration, bpm, timeSignature, tuplet)
    await sampler.ensureReady()
    const Tone = await import('tone')
    const t = Tone.now()
    pitches.forEach(p => sampler.playAt(p, seconds, t))
  }

  const [playing, setPlaying] = React.useState(false)
  // Holds the live Tone module reference + the scheduled Transport event
  // ids for the current play session. Stop cancels every pending id so
  // re-clicking Play doesn't layer the previous schedule on top.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transportRef = React.useRef<{ Tone: any; ids: number[] } | null>(null)

  const cancelTransportSchedule = React.useCallback(() => {
    const ref = transportRef.current
    if (!ref) return
    try {
      ref.ids.forEach(id => ref.Tone.Transport.clear(id))
      ref.Tone.Transport.stop()
      ref.Tone.Transport.cancel(0)
    } catch {}
    transportRef.current = null
  }, [])

  React.useEffect(() => cancelTransportSchedule, [cancelTransportSchedule])

  const handlePlayAll = async () => {
    if (playing) return
    setPlaying(true)
    clearPlayTimers()
    cancelTransportSchedule()
    await sampler.ensureReady()
    const Tone = await import('tone')
    // Reset the Transport to a known state so per-session scheduling
    // starts at transport time 0 every time.
    Tone.Transport.stop()
    Tone.Transport.cancel(0)
    Tone.Transport.position = 0

    const ids: number[] = []
    let maxEnd = 0

    // Build the play order from measureMarks (start/end repeat barlines
    // and volta brackets). Without marks, it's just every measure once.
    const measureMarks = score.measureMarks ?? []
    const playOrder = buildPlayOrder(measureMarks, totalMeasures)

    // Schedule each voice on each stave, walking measures in playOrder so
    // repeats and voltas produce the correct audible sequence.
    staves.forEach((stave, si) => {
      stave.voices.forEach((voice, vi) => {
        const voiceMeasures = measuresByVoice[si][vi]
        let cursorSec = 0
        for (let p = 0; p < playOrder.length; p++) {
          const playMeasureIdx = playOrder[p]
          const measure = voiceMeasures[playMeasureIdx]
          if (!measure) {
            // Empty measure (voice shorter than the score) — advance by
            // one measure of beats so other voices stay aligned.
            cursorSec += (60 / bpm) * timeSignature.numerator
            continue
          }
          // Find ties that resolve WITHIN this measure only. Cross-bar
          // ties on a repeated measure replay as fresh notes — acceptable
          // for the repeat-demo case.
          const seenInMeasure = new Set<number>()
          measure.forEach((me, mi) => {
            const el = me.element
            if (el.type === 'rest') {
              cursorSec += durationToSeconds(el.duration, bpm, timeSignature, el.tuplet)
              return
            }
            if (seenInMeasure.has(mi)) return
            const ps = playPitchesOf(el)
            // Tie chain inside this measure: extend audio while only the
            // first note triggers.
            let totalSeconds = durationToSeconds(el.duration, bpm, timeSignature, el.tuplet)
            if (el.tied) {
              for (let k = mi + 1; k < measure.length; k++) {
                seenInMeasure.add(k)
                const next = measure[k].element
                totalSeconds += durationToSeconds(next.duration, bpm, timeSignature, next.tuplet)
                if (next.type === 'note' && !next.tied) break
                if (next.type !== 'note') break
              }
            }
            const transportTime = cursorSec
            // Per-pass flash key so consecutive passes don't collide on
            // the same React state slot.
            const flashKey = `s${si}v${vi}p${p}i${me.origIdx}`
            const playArtic = (el as MusicalNote).playArtic ?? 'normal'
            const audioSeconds = playArtic === 'pluck'
              ? Math.max(0.05, totalSeconds * 0.22)
              : totalSeconds
            const visualKey = `s${si}v${vi}i${me.origIdx}`
            const id = Tone.Transport.scheduleOnce((time: number) => {
              ps.forEach(pi => sampler.playAt(pi, audioSeconds, time))
              flashCellByKey(visualKey, totalSeconds * 1000)
            }, transportTime)
            ids.push(id)
            cursorSec += totalSeconds
            void flashKey
          })
        }
        if (cursorSec > maxEnd) maxEnd = cursorSec
      })
    })

    if (metronome) {
      const beatSec = 60 / bpm
      const numerator = timeSignature.numerator
      const totalBeats = Math.ceil(maxEnd / beatSec)
      for (let i = 0; i < totalBeats; i++) {
        const accent = i % numerator === 0
        const id = Tone.Transport.scheduleOnce((time: number) => {
          sampler.tickAt(accent, time)
        }, i * beatSec)
        ids.push(id)
      }
    }

    // Schedule a final event to flip the playing flag back off when the
    // last note has finished. Also added to ids so Stop can cancel it.
    const endId = Tone.Transport.scheduleOnce(() => {
      setPlaying(false)
      transportRef.current = null
    }, maxEnd + 0.1)
    ids.push(endId)

    transportRef.current = { Tone, ids }
    // Small lead-in so the first event isn't clipped by the audio
    // context's lookahead.
    Tone.Transport.start('+0.05', 0)
  }

  const handleStop = () => {
    cancelTransportSchedule()
    sampler.stopAll()
    clearPlayTimers()
    setPlaying(false)
  }

  // ── Render ────────────────────────────────────────────────────────────
  const isGrandStaff = staves.length > 1
  return (
    <figure style={{ margin: '24px auto 48px auto', width: '100%' }}>
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
            {/* Staves: one per stave in the score, plus brace if multi.
                In 1-line mode, draw a single line at the staff middle and
                skip the clef. */}
            {isOneLine ? staves.map((_, si) => (
              <line
                key={`staff-${sys.systemIdx}-${si}`}
                x1={margin}
                x2={margin + sys.staffWidth}
                y1={sys.staffTops[si] + 4 * T.step}
                y2={sys.staffTops[si] + 4 * T.step}
                stroke={T.staffLineColor}
                strokeWidth={T.staffLineStroke}
              />
            )) : staves.map((_, si) => (
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
              if (ksCount === 0 || isOneLine) return null
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
                            renderPlaced(p, staveLayout, voiceLayout, T, flashKeys, handleNoteClick, isOneLine, highlightAll),
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
                    // Find the topmost stem-tip / notehead extent across
                    // ALL volta-bracketed measures in this system, so every
                    // volta bracket sits at the SAME height (engraving
                    // convention — voltas align as a row).
                    let topExtent = top
                    for (const sysM of sys.measures) {
                      const sysMark = (score.measureMarks ?? []).find(mm => mm.measureIdx === sysM.globalIdx)
                      if (!sysMark?.voltaNumber) continue
                      for (const stave of sysM.staves) {
                        for (const voice of stave.voices) {
                          for (const pp of voice.placed) {
                            if (pp.measured.element.type !== 'note') continue
                            if (pp.positions.length === 0) continue
                            const topPos = Math.min(...pp.positions)
                            const noteY = stave.staffTop + topPos * T.step
                            const stemTipY = pp.stemDir === 'up'
                              ? noteY - T.stemLength
                              : noteY - T.noteheadHalfHeight
                            if (stemTipY < topExtent) topExtent = stemTipY
                          }
                        }
                      }
                    }
                    // Bracket sits clearly ABOVE topExtent so stems don't
                    // poke through. Tighter on baseline staves (no stems
                    // up high), looser when notes reach above the staff.
                    const bracketY = Math.min(
                      top - Math.round(28 * T.scale + 8),
                      topExtent - Math.round(14 * T.scale + 6),
                    )
                    const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 17 : 15
                    // Descender ticks at each end of the bracket span the
                    // full vertical height of the volta number, so the
                    // bracket visually "boxes" the label.
                    const tickEnd = bracketY + Math.round(labelFont + 8)
                    // Number sits centered between bracketY and tickEnd.
                    const labelY = bracketY + Math.round((labelFont + 8) / 2 + 1)
                    const x1 = m.x0 + Math.round(4 * T.scale)
                    const x2 = barlineX - Math.round(4 * T.scale)
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

                  {/* Measure number below the lowest stave. With a pickup,
                      the pickup itself is unnumbered and the first full bar
                      is "1"; otherwise numbering starts at 1 from the first
                      bar. */}
                  {showMeasureNumbers && (() => {
                    const hasPickup = pickupBeats !== undefined && pickupBeats > 1e-6
                    if (hasPickup && m.globalIdx === 0) return null
                    const displayNum = hasPickup ? m.globalIdx : m.globalIdx + 1
                    return (
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
                        {displayNum}
                      </text>
                    )
                  })()}
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

        {/* Dynamics — Bravura glyph below treble / above bass at the
            anchored beat. Optional italic 'modifier' renders BEFORE the
            glyph per engraving convention ("sub. f", "subito p"). */}
        {staves.flatMap((stave, si) =>
          stave.voices.flatMap((voice, vi) =>
            (voice.dynamics ?? []).map((dyn, di) => {
              const entry = resolveBeat(si, vi, dyn.beat)
              if (!entry) return null
              const above = stave.clef === 'bass'
              const baseY = above
                ? entry.staffTop - Math.round(14 * T.scale + 6)
                : entry.staffTop + 8 * T.step + Math.round(36 * T.scale + 14)
              const glyph = DYNAMIC_GLYPHS[dyn.level]
              const dynFontSize = Math.round(T.noteheadFontSize * 0.85)
              // Modifier ('subito', 'sub.', 'molto', etc.) sits to the
              // LEFT of the glyph in italic serif. Read order matches
              // pronunciation: "sub. f" → first the qualifier, then the
              // dynamic level the qualifier applies to. Sized in line with
              // the dynamic glyph's optical weight (italic Bodoni at the
              // dynamic letter's cap-height reads as a pair).
              const modifierFontSize = Math.round(T.labelFontSize + 10)
              const modifierGap = Math.round(modifierFontSize * 0.45)
              return (
                <g key={`dyn-s${si}v${vi}-${di}`}>
                  {dyn.modifier && (
                    <text
                      x={entry.x - Math.round(dynFontSize * 0.36) - modifierGap}
                      y={baseY}
                      fontSize={modifierFontSize}
                      fontFamily={T.fontDisplay}
                      fontStyle="italic"
                      fill={T.ink}
                      textAnchor="end"
                      dominantBaseline="central"
                    >
                      {dyn.modifier}
                    </text>
                  )}
                  <text
                    x={entry.x}
                    y={baseY}
                    fontSize={dynFontSize}
                    fontFamily={T.fontMusic}
                    fill={T.ink}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {glyph}
                  </text>
                </g>
              )
            }),
          ),
        )}

        {/* Hairpins — two converging/diverging lines. Cross-system spans
            split into per-system segments at the body edges of each system.
            Endpoints clear adjacent dynamic glyphs by a small horizontal
            gap so the wedge never collides with the dynamic letter. */}
        {staves.flatMap((stave, si) =>
          stave.voices.flatMap((voice, vi) =>
            (voice.hairpins ?? []).flatMap((hp, hi) => {
              const startEntry = resolveBeat(si, vi, hp.startBeat)
              const endEntry = resolveBeat(si, vi, hp.endBeat)
              if (!startEntry || !endEntry) return []
              const placement = hp.placement
                ?? (stave.clef === 'bass' ? 'above' : 'below')
              const above = placement === 'above'
              const aperture = Math.round(8 * T.scale + 4)
              // Detect dynamic markings at the same beat on this voice;
              // a hairpin tip touching a dynamic glyph is the most common
              // overlap, so skirt past it by ~half a glyph + small gap.
              const dynGap = Math.round(T.noteheadFontSize * 0.5 + 4)
              const startHasDyn = (voice.dynamics ?? [])
                .some(d => Math.abs(d.beat - hp.startBeat) < 1e-6)
              const endHasDyn = (voice.dynamics ?? [])
                .some(d => Math.abs(d.beat - hp.endBeat) < 1e-6)
              // Detect another hairpin meeting this one at startBeat or
              // endBeat (back-to-back cresc / decresc shapes). Add a small
              // breathing gap so the two tips don't touch.
              const hairpinGap = Math.round(6 * T.scale + 2)
              const otherStartsAtMyEnd = (voice.hairpins ?? [])
                .some((other, j) => j !== hi
                  && Math.abs(other.startBeat - hp.endBeat) < 1e-6)
              const otherEndsAtMyStart = (voice.hairpins ?? [])
                .some((other, j) => j !== hi
                  && Math.abs(other.endBeat - hp.startBeat) < 1e-6)
              const segments: React.ReactNode[] = []
              for (let s = startEntry.systemIdx; s <= endEntry.systemIdx; s++) {
                const sys = systems[s]
                const isStart = s === startEntry.systemIdx
                const isEnd = s === endEntry.systemIdx
                const last = sys.measures[sys.measures.length - 1]
                const sysRight = last.x0 + last.width
                const sysLeft = sys.bodyStartX
                const startOffset = isStart
                  ? (startHasDyn ? dynGap : 0)
                    + (otherEndsAtMyStart ? hairpinGap : 0)
                  : 0
                const endOffset = isEnd
                  ? (endHasDyn ? -dynGap : 0)
                    + (otherStartsAtMyEnd ? -hairpinGap : 0)
                  : 0
                const x1 = isStart ? startEntry.x + startOffset : sysLeft
                const x2 = isEnd ? endEntry.x + endOffset : sysRight
                // Hairpin baseline matches the dynamic baseline so a
                // 'p < f' pattern reads as one horizontal phrase.
                const yBase = above
                  ? sys.staffTops[si] - Math.round(14 * T.scale + 6)
                  : sys.staffTops[si] + 8 * T.step + Math.round(36 * T.scale + 14)
                // Compute apertures per system endpoint. Crescendo: tip on
                // the LEFT only at the true start; right side opens.
                // Decrescendo: opens at left, tip on the RIGHT only at end.
                let leftAp: number, rightAp: number
                if (hp.direction === 'cresc') {
                  leftAp = isStart ? 0 : aperture * 0.9
                  rightAp = isEnd ? aperture : aperture * 0.9
                } else {
                  leftAp = isStart ? aperture : aperture * 0.9
                  rightAp = isEnd ? 0 : aperture * 0.9
                }
                segments.push(
                  <g key={`hp-s${si}v${vi}-${hi}-sys${s}`}>
                    <line
                      x1={x1} y1={yBase - leftAp / 2}
                      x2={x2} y2={yBase - rightAp / 2}
                      stroke={T.ink} strokeWidth={1}
                    />
                    <line
                      x1={x1} y1={yBase + leftAp / 2}
                      x2={x2} y2={yBase + rightAp / 2}
                      stroke={T.ink} strokeWidth={1}
                    />
                  </g>,
                )
              }
              return segments
            }),
          ),
        )}

        {/* Pedal markings — typically attached to the bass-clef voice in
            piano music. 'text' style: Ped./✱ glyphs at endpoints. 'bracket'
            style: continuous bracket below the bottom-most stave. */}
        {staves.flatMap((stave, si) =>
          stave.voices.flatMap((voice, vi) =>
            (voice.pedalMarks ?? []).flatMap((pm, pi) => {
              const startEntry = resolveBeat(si, vi, pm.startBeat)
              const endEntry = resolveBeat(si, vi, pm.endBeat)
              if (!startEntry || !endEntry) return []
              const style = pm.style ?? 'text'
              const baseY = (sys: SystemLayout) =>
                sys.staffTops[sys.staffTops.length - 1]
                  + 8 * T.step + Math.round(34 * T.scale + 10)
              if (style === 'text') {
                const items: React.ReactNode[] = []
                // ✱ placement: when the pedal spans multiple elements,
                // the release glyph sits BENEATH the last held note
                // (= endEntry.x). When the pedal sits on a single
                // element, that would collide with Ped. — pull it to
                // the right edge of the element, padded back from the
                // barline.
                const isSingleElement = startEntry === endEntry
                const endPad = Math.round(14 * T.scale + 6)
                const startX = startEntry.x
                const endX = isSingleElement
                  ? endEntry.measureRightX - endPad
                  : endEntry.x
                items.push(
                  <text
                    key={`ped-text-s${si}v${vi}-${pi}-start`}
                    x={startX}
                    y={baseY(systems[startEntry.systemIdx])}
                    fontSize={Math.round(T.noteheadFontSize * 0.7)}
                    fontFamily={T.fontMusic}
                    fill={T.ink}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >{PEDAL_GLYPHS.ped}</text>,
                )
                items.push(
                  <text
                    key={`ped-text-s${si}v${vi}-${pi}-end`}
                    x={endX}
                    y={baseY(systems[endEntry.systemIdx])}
                    fontSize={Math.round(T.noteheadFontSize * 0.65)}
                    fontFamily={T.fontMusic}
                    fill={T.ink}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >{PEDAL_GLYPHS.pedRelease}</text>,
                )
                return items
              }
              // bracket style — split by system
              const segments: React.ReactNode[] = []
              // Detect a pedal change: another mark in the same voice
              // starts where this one ends (or its start matches our end's
              // x). At the changeover x we draw a V-notch instead of a
              // straight bracket-end tick.
              const nextPm = (voice.pedalMarks ?? [])
                .find((other, j) => j !== pi
                  && Math.abs(other.startBeat - pm.endBeat - 1) < 1e-6)
                ?? (voice.pedalMarks ?? [])
                  .find((other, j) => j !== pi
                    && other.startBeat > pm.endBeat
                    && resolveBeat(si, vi, other.startBeat)?.x === endEntry.endX)
              const hasChangeAtEnd = !!nextPm
              const prevPm = (voice.pedalMarks ?? [])
                .find((other, j) => j !== pi
                  && Math.abs(pm.startBeat - other.endBeat - 1) < 1e-6)
                ?? (voice.pedalMarks ?? [])
                  .find((other, j) => j !== pi
                    && other.endBeat < pm.startBeat
                    && resolveBeat(si, vi, other.endBeat)?.endX === startEntry.x)
              const hasChangeAtStart = !!prevPm
              // When the pedal's end falls on the LAST element in its
              // voice (no next element), endEntry.endX falls right at the
              // measure's right barline. Pull it back a touch so the
              // bracket doesn't visually merge with the final barline.
              const endsAtMeasureEdge = endEntry.endX === endEntry.measureRightX
              const finalPad = endsAtMeasureEdge ? Math.round(12 * T.scale + 4) : 0
              for (let s = startEntry.systemIdx; s <= endEntry.systemIdx; s++) {
                const sys = systems[s]
                const isStart = s === startEntry.systemIdx
                const isEnd = s === endEntry.systemIdx
                const last = sys.measures[sys.measures.length - 1]
                const x1 = isStart ? startEntry.x : sys.bodyStartX
                const x2 = isEnd ? endEntry.endX - finalPad : (last.x0 + last.width)
                const y = baseY(sys)
                const tickH = Math.round(13 * T.scale + 4)
                const notchH = Math.round(tickH * 0.85)
                const notchHalfW = Math.round(8 * T.scale + 3)
                segments.push(
                  <g key={`ped-bracket-s${si}v${vi}-${pi}-sys${s}`}>
                    {/* Main horizontal bracket line. When this segment
                        terminates a pedal change, the V-notch dips into
                        the bracket near the right edge — render the line
                        only up to the start of the notch, then a slanted
                        descent. Mirror logic at the start. */}
                    {isStart && hasChangeAtStart ? (
                      <>
                        <line x1={x1} y1={y - notchH} x2={x1 + notchHalfW} y2={y}
                          stroke={T.ink} strokeWidth={1.2} />
                        <line x1={x1 + notchHalfW} y1={y} x2={isEnd && hasChangeAtEnd ? x2 - notchHalfW : x2} y2={y}
                          stroke={T.ink} strokeWidth={1.2} />
                      </>
                    ) : (
                      <line x1={x1} y1={y} x2={isEnd && hasChangeAtEnd ? x2 - notchHalfW : x2} y2={y}
                        stroke={T.ink} strokeWidth={1.2} />
                    )}
                    {isEnd && hasChangeAtEnd && (
                      <line x1={x2 - notchHalfW} y1={y} x2={x2} y2={y - notchH}
                        stroke={T.ink} strokeWidth={1.2} />
                    )}
                    {/* Opening tick — straight up unless this is the
                        receiving side of a pedal change (handled above). */}
                    {isStart && !hasChangeAtStart && (
                      <line x1={x1} y1={y} x2={x1} y2={y - tickH}
                        stroke={T.ink} strokeWidth={1.2} />
                    )}
                    {/* Closing tick — straight up unless this is the
                        releasing side of a pedal change (handled above). */}
                    {isEnd && !hasChangeAtEnd && (
                      <line x1={x2} y1={y} x2={x2} y2={y - tickH}
                        stroke={T.ink} strokeWidth={1.2} />
                    )}
                  </g>,
                )
              }
              return segments
            }),
          ),
        )}

        {/* Chord symbols — lead-sheet harmony names ('C', 'Am7', 'G/B')
            anchored to a beat. Sit above the top staff in serif text,
            below tempo markings. */}
        {(score.chordSymbols ?? []).map((cs, ci) => {
          const cumBeat = cs.beat
          const entry = resolveBeat(0, 0, cumBeat)
          if (!entry) return null
          const sys = systems[entry.systemIdx]
          const chordFont = T.size === 'small' ? 19 : T.size === 'hero' ? 26 : 22
          // Position above the actual top extent of every note/stem in the
          // system (not a fixed offset from the staff). This keeps the
          // symbol clear of high noteheads + ledger lines + stem tips.
          const sysTopExt = systemPrimaryTopExtent(sys, T)
          const baseY = sysTopExt - Math.round(12 * T.scale + chordFont * 0.6)
          return (
            <text
              key={`chord-${ci}`}
              x={entry.x}
              y={baseY}
              fontSize={chordFont}
              fontFamily={T.fontDisplay}
              fontWeight={500}
              fill={T.highlightAccent}
              textAnchor="middle"
              dominantBaseline="central"
            >{cs.symbol}</text>
          )
        })}

        {/* Tempo markings — above the topmost staff. Per engraving
            convention:
              - 'normal' tempo words (Allegro, Andante) are BOLD ROMAN
                SERIF (Bodoni-family). For measure-0 normal markings the
                anchor is the system's left edge so the word sits above
                the system header (clef + ks + ts) rather than the first
                note.
              - 'change' (rit., a tempo, accel.) is ITALIC SERIF, regular
                weight, anchored at the beat where the change starts.
              - Metronome marks use the SMuFL met-range glyphs (designed
                for inline text alignment, NOT the full-note glyphs at
                U+E1D5+). When a tempo word is present the metronome is
                parenthesized after it: "Allegro (♩ = 120)". */}
        {(score.tempoMarkings ?? []).flatMap((tm, ti) => {
          const cumBeat = tm.measureIdx * timeSignature.numerator + (tm.beat ?? 0)
          const entry = resolveBeat(0, 0, cumBeat)
          if (!entry) return []
          const sys = systems[entry.systemIdx]
          const baseY = sys.staffTops[0] - Math.round(40 * T.scale + 18)
          const style = tm.style ?? 'normal'
          const items: React.ReactNode[] = []
          // For a 'normal' tempo at measure 0, sit above the system
          // header — slightly indented from the absolute left margin so
          // it visually sits over the music rather than the page edge.
          const isMeasureZeroHeadline = style === 'normal' && tm.measureIdx === 0
          // Anchor the headline tempo (Allegro, Andantino) directly above
          // the time signature so it sits over the music's pulse, not the
          // page edge.
          const tempoTextX = isMeasureZeroHeadline
            ? margin + clefReserve + clefGap + ksWidth + ksGap
            : entry.x
          const tempoTextAnchor: 'start' | 'middle' =
            style === 'normal' ? 'start' : 'middle'
          // Tempo headline (Allegro, Andante) prints at ~16-18pt in real
          // engraved scores — large enough to read across the staff at a
          // glance. Tempo changes (rit., a tempo) stay smaller.
          const tempoFontSize = style === 'normal'
            ? Math.round(T.labelFontSize + 12)
            : Math.round(T.labelFontSize + 4)
          if (tm.text) {
            items.push(
              <text
                key={`tempo-${ti}-text`}
                x={tempoTextX}
                y={baseY}
                fontSize={tempoFontSize}
                fontFamily={T.fontDisplay}
                fontStyle={style === 'normal' ? 'normal' : 'italic'}
                fontWeight={style === 'normal' ? 600 : 400}
                fill={T.ink}
                textAnchor={tempoTextAnchor}
                dominantBaseline="central"
              >{tm.text}</text>,
            )
          }
          if (tm.metronome) {
            // SMuFL met-range glyph chosen by beat-note base. Dotted
            // beat-notes get an augmentation-dot glyph appended.
            const baseDur = tm.metronome.beatNote[0]
            const dotted = tm.metronome.beatNote.endsWith('.')
            const metGlyph = (() => {
              if (baseDur === 'h') return METRONOME_GLYPHS.half
              if (baseDur === 'e') return METRONOME_GLYPHS.eighth
              if (baseDur === 's') return METRONOME_GLYPHS.sixteenth
              return METRONOME_GLYPHS.quarter
            })()
            const noteWithDot = dotted
              ? `${metGlyph} ${METRONOME_GLYPHS.augmentationDot}`
              : metGlyph
            // Right edge of the tempo word (rough estimate from char count
            // × cap-height). When no tempo word, anchor at entry.x.
            const charWidthEstimate = Math.round(tempoFontSize * 0.55)
            const tempoWordRight = tm.text
              ? tempoTextX
                + (tempoTextAnchor === 'middle'
                    ? Math.round(tm.text.length * charWidthEstimate * 0.5)
                    : Math.round(tm.text.length * charWidthEstimate))
              : entry.x
            const xMetro = tm.text
              ? tempoWordRight + Math.round(8 * T.scale + 4)
              : entry.x
            const metFontSize = Math.round(T.labelFontSize + 2)
            items.push(
              <g key={`tempo-${ti}-metro`}>
                {tm.text && (
                  <text
                    x={xMetro - Math.round(metFontSize * 0.32)}
                    y={baseY}
                    fontSize={metFontSize}
                    fontFamily={T.fontDisplay}
                    fill={T.ink}
                    textAnchor="end"
                    dominantBaseline="central"
                  >(</text>
                )}
                <text
                  x={xMetro}
                  y={baseY}
                  fontSize={metFontSize}
                  fontFamily={T.fontMusic}
                  fill={T.ink}
                  textAnchor="start"
                  dominantBaseline="central"
                >{noteWithDot}</text>
                <text
                  x={xMetro + Math.round(metFontSize * 0.95) + (dotted ? Math.round(metFontSize * 0.36) : 0)}
                  y={baseY}
                  fontSize={metFontSize}
                  fontFamily={T.fontDisplay}
                  fontStyle="italic"
                  fill={T.ink}
                  textAnchor="start"
                  dominantBaseline="central"
                >{` = ${tm.metronome.bpm}${tm.text ? ')' : ''}`}</text>
              </g>,
            )
          }
          if (style === 'change-with-line' && tm.endMeasureIdx !== undefined) {
            const endCumBeat = (tm.endMeasureIdx + 1) * timeSignature.numerator - 0.0001
            const endEntry = resolveBeat(0, 0, endCumBeat)
            if (endEntry) {
              for (let s = entry.systemIdx; s <= endEntry.systemIdx; s++) {
                const sysS = systems[s]
                const isStart = s === entry.systemIdx
                const isEnd = s === endEntry.systemIdx
                const last = sysS.measures[sysS.measures.length - 1]
                const x1 = isStart
                  ? entry.x + Math.round(40 * T.scale + 12)
                  : sysS.bodyStartX
                const x2 = isEnd ? endEntry.x : (last.x0 + last.width)
                const y = sysS.staffTops[0] - Math.round(22 * T.scale + 8)
                items.push(
                  <line
                    key={`tempo-${ti}-line-${s}`}
                    x1={x1} y1={y} x2={x2} y2={y}
                    stroke={T.ink}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />,
                )
              }
            }
          }
          return items
        })}

        {/* Beat numbers — uniform grid below the staff, every beat in every
            measure gets a number regardless of whether an element attacks
            there. For rhythmic-dictation lessons. */}
        {showBeatNumbers && (() => {
          const numerator = timeSignature.numerator
          const arr = voiceTiming.get('s0v0') ?? []
          return systems.flatMap(sys =>
            sys.measures.flatMap(m => {
              const measureStart = m.globalIdx * numerator
              const bottomY = sys.staffTops[sys.staffTops.length - 1] + staffHeight
              const beatY = bottomY + Math.round(34 * T.scale + 10)
              const measureRightX = m.x0 + m.width
              return Array.from({ length: numerator }).map((_, b) => {
                const cumBeat = measureStart + b
                // Find the element whose [cumBeat, cumBeat+beatLen) contains
                // this beat. Anchors the label to the note/rest sounding at
                // that moment — even if it started earlier (held note).
                const entry = arr.find(e =>
                  cumBeat >= e.cumBeat - 1e-6 &&
                  cumBeat < e.cumBeat + e.beatLen - 1e-6,
                )
                let x: number
                if (!entry) {
                  // Past the last element — fall back to even slot.
                  x = m.x0 + (m.width / numerator) * (b + 0.5)
                } else if (Math.abs(entry.cumBeat - cumBeat) < 1e-6) {
                  // Beat aligns with element attack — center on the head.
                  x = entry.x
                } else {
                  // Mid-element (held note or rest): interpolate between
                  // this element's head x and the next element's head x
                  // (or the measure's right edge if it's the last element).
                  const nextEntry = arr.find(e =>
                    e.cumBeat > entry.cumBeat + 1e-6 &&
                    e.cumBeat <= entry.cumBeat + entry.beatLen + 1e-6,
                  )
                  const endX = nextEntry ? nextEntry.x : measureRightX
                  const frac = (cumBeat - entry.cumBeat) / entry.beatLen
                  x = entry.x + frac * (endX - entry.x)
                }
                return (
                  <text
                    key={`bn-${sys.systemIdx}-${m.globalIdx}-${b}`}
                    x={x}
                    y={beatY}
                    fontSize={T.labelFontSize + 2}
                    fontFamily={T.fontLabel}
                    fontWeight={500}
                    fill={T.highlightAccent}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {b + 1}
                  </text>
                )
              })
            }),
          )
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
            aboveStaffOffset={hasChordSymbols ? Math.round(34 * T.scale + 14) : 0}
            hasPrimaryDynamics={(staves[0]?.voices[0]?.dynamics?.length ?? 0) > 0}
          />
        ))}
      </svg>

      {showPlayButton && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -12 }}>
          <button
            onClick={playing ? handleStop : handlePlayAll}
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
            {playing ? '◼ Stop' : '▶ Play'}
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

/**
 * Walk the score's measureMarks and emit the actual sequence of measure
 * indices the audio should play. Honours start/end repeat barlines and
 * volta brackets:
 *   - End-repeat sends playback back to the most-recent start-repeat
 *     (or measure 0 if none) — but only ONCE per repeat block.
 *   - Volta 1 is played on the FIRST pass; on subsequent passes the
 *     player skips to volta 2 (the next measure with voltaNumber === 2).
 */
function buildPlayOrder(
  measureMarks: ReadonlyArray<{
    measureIdx: number
    startRepeat?: boolean
    endRepeat?: boolean
    voltaNumber?: number
  }>,
  totalMeasures: number,
): number[] {
  if (totalMeasures <= 0) return []
  const markFor = (idx: number) => measureMarks.find(m => m.measureIdx === idx)
  const order: number[] = []
  const passCount = new Map<number, number>()
  let i = 0
  // Bound the loop so a malformed measureMarks set can't infinite-loop.
  let safety = totalMeasures * 8 + 16

  while (i < totalMeasures && safety-- > 0) {
    const mark = markFor(i)
    // Volta 1: skip on subsequent passes (already played once). Look ahead
    // for the next volta-2 measure and jump there. If none, end playback.
    if (mark?.voltaNumber === 1 && (passCount.get(i) ?? 0) >= 1) {
      const v2 = measureMarks.find(m => m.voltaNumber === 2 && m.measureIdx > i)
      if (v2) {
        i = v2.measureIdx
        continue
      }
      break
    }
    order.push(i)
    passCount.set(i, (passCount.get(i) ?? 0) + 1)
    if (mark?.endRepeat) {
      // Find the most recent start-repeat at or before i; default to 0.
      let back = 0
      for (const m of measureMarks) {
        if (m.startRepeat && m.measureIdx <= i && m.measureIdx > back) {
          back = m.measureIdx
        }
      }
      if ((passCount.get(back) ?? 0) < 2) {
        i = back
        continue
      }
    }
    i++
  }
  return order
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
  isOneLine: boolean,
  highlightAll: boolean = false,
): React.ReactNode {
  const el = p.measured.element
  const lit = highlightAll || flashKeys.has(flashKeyFor(p))
  const staffTop = stave.staffTop

  if (el.type === 'rest') {
    // Per Gould: a rest representing an entire measure of silence is always
    // notated with the whole-rest glyph hanging from line 4 — regardless of
    // the actual meter (3/8, 6/8, etc.). The `wholeMeasureRest` flag
    // overrides the per-duration glyph to make this happen.
    const isWholeBar = el.wholeMeasureRest === true
    const restValue = isWholeBar ? 'whole' : restValueFor(el.duration)
    const dotted = !isWholeBar && isDotted(el.duration)
    const xCenter = p.x
    // Default rest position: middle line of the 5-line staff
    // (lineY n=2 → staffTop + 4*step). For multi-voice on the same stave,
    // stack voice 0 rests above the middle and voice 1 rests below — far
    // enough that the rest glyph doesn't touch the other voice's notes
    // above or below the stave middle. Whole-measure rests skip the
    // multi-voice offset and stay at the conventional hanging position.
    let restY = staffTop + 4 * T.step
    if (voice.multiVoice && !isWholeBar) {
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

  // Note (possibly chord). `ps` is the displayed pitch set; `playPs` may
  // override for transposing-instrument audio (defaults to ps).
  const ps = pitchesOf(el)
  const playPs = playPitchesOf(el)
  const noteClickArg = () =>
    onNoteClick(p.staveIdx, p.voiceIdx, p.measured.origIdx, playPs, el.duration, el.tuplet)

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
  // Per-accidental x. Single accidental → one column. Multiple accidentals
  // close together (within 5 step-units) get staggered into a second column
  // further left, alternating starting from the topmost — standard engraving
  // rule to prevent overlap on chords like C-Eb-Gb.
  const accidentalCol1X = p.x - Math.round(T.accidentalKerning * 0.95)
  const accidentalCol2X = p.x - Math.round(T.accidentalKerning * 1.85)
  const accidentalColumns: (0 | 1)[] = (() => {
    const cols: (0 | 1)[] = accidentals.map(() => 0)
    const indices = accidentals
      .map((acc, i) => acc ? i : -1)
      .filter(i => i >= 0)
      .sort((a, b) => p.positions[a] - p.positions[b]) // top to bottom
    let lastCol1Pos = -Infinity
    let lastCol2Pos = -Infinity
    for (const i of indices) {
      const pos = p.positions[i]
      // Try column 1 first; if too close to the last col-1 accidental,
      // place in column 2.
      if (pos - lastCol1Pos >= 5) {
        cols[i] = 0
        lastCol1Pos = pos
      } else if (pos - lastCol2Pos >= 5) {
        cols[i] = 1
        lastCol2Pos = pos
      } else {
        cols[i] = 0
        lastCol1Pos = pos
      }
    }
    return cols
  })()

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
        const isCautionary = p.accidentalCautionary[i] === true
        // Parens use a serif (Cormorant) glyph at roughly half the SMuFL
        // accidental's nominal fontSize — that matches the visible height
        // of the accidental glyph itself. Offsets are tuned to sit just
        // outside the glyph's visible left/right edges.
        const parenFontSize = Math.round(T.accidentalFontSize * 0.42)
        const parenOffset = Math.round(T.accidentalFontSize * 0.18)
        // Cautionary parens project slightly to the right of the accidental
        // glyph and would otherwise crowd the notehead. Shift the whole
        // group further left so the right paren keeps a clear breathing gap.
        const cautionaryShift = isCautionary ? Math.round(8 * T.scale) : 0
        const baseX = accidentalColumns[i] === 1 ? accidentalCol2X : accidentalCol1X
        const x = baseX - cautionaryShift
        return (
          <g key={`acc-${flashKeyFor(p)}-${i}`}>
            {isCautionary && (
              <text
                x={x - parenOffset}
                y={noteY}
                fontSize={parenFontSize}
                fontFamily={T.fontDisplay}
                fill={lit ? T.highlightAccent : T.ink}
                textAnchor="middle"
                dominantBaseline="central"
              >(</text>
            )}
            <text
              x={x}
              y={noteY}
              fontSize={T.accidentalFontSize}
              fontFamily={T.fontMusic}
              fill={lit ? T.highlightAccent : T.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {accGlyphFor(acc, T)}
            </text>
            {isCautionary && (
              <text
                x={x + parenOffset}
                y={noteY}
                fontSize={parenFontSize}
                fontFamily={T.fontDisplay}
                fill={lit ? T.highlightAccent : T.ink}
                textAnchor="middle"
                dominantBaseline="central"
              >)</text>
            )}
          </g>
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
          posOverride={isOneLine ? p.positions[i] : undefined}
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
          always sits ABOVE regardless of stem direction. Engraving rule:
          a dot/wedge/bar should always sit in a STAFF SPACE (odd staff
          position), not crossing a staff line. We compute the natural
          offset position then snap to the next clean space if needed. */}
      {el.articulations && el.articulations.length > 0 && el.articulations.map((a, i) => {
        const glyphSet = ARTIC_GLYPHS[a]
        if (!glyphSet) return null
        const above = a === 'fermata' ? true : !stemUp
        const glyph = above ? glyphSet.above : glyphSet.below
        const refPos = above ? minPos : maxPos
        // Snap the articulation to the nearest STAFF SPACE outside the
        // notehead. Staff positions: even = line, odd = space. For an
        // articulation positioned ONE position past the notehead, if the
        // notehead sits on a line (even), the next space is +/-1; if it
        // sits in a space (odd), we need +/-2 to clear into the next space
        // (otherwise the glyph straddles the immediate line).
        // Notehead occupies ~1.6 staff-positions worth of vertical space,
        // so we need at least 2 positions out, AND must land in a SPACE
        // (odd staff position). Note-on-line: refPos±2 lands on another
        // line — bump to ±3 (next space). Note-in-space: refPos±2 already
        // lands in a space — use it directly.
        const noteOnLine = refPos % 2 === 0
        const stepOut = noteOnLine ? 3 : 2
        const baseTargetPos = above ? refPos - stepOut : refPos + stepOut
        // Stack additional articulations one space further out.
        const targetPos = above ? baseTargetPos - 2 * i : baseTargetPos + 2 * i
        // Fermata gets extra breathing room — engraved much further from
        // the notehead than a tiny staccato dot.
        const fermataExtra = a === 'fermata' ? Math.round(10 * T.scale + 4) : 0
        const y = above
          ? staffTop + targetPos * T.step - fermataExtra
          : staffTop + targetPos * T.step + fermataExtra
        const fontSize = a === 'fermata'
          ? Math.round(T.noteheadFontSize * 0.95)
          : Math.round(T.noteheadFontSize * 0.78)
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
        const offset = Math.round(10 * T.scale + 4) + i * Math.round(T.noteheadFontSize * 0.36)
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
  /** Extra vertical offset above the staff to account for chord symbols /
   *  tempo markings already occupying space — keeps section brackets above
   *  them rather than colliding. */
  aboveStaffOffset?: number
  /** True when the primary voice has dynamics (rendered below the staff
   *  for treble). Below-staff labels (solfège, beat counts, character
   *  markings) need extra clearance so they don't overlap the dynamics. */
  hasPrimaryDynamics?: boolean
}

/**
 * Highest y-extent (notehead + stem-up tip) across the primary line of a
 * single system. Used to place above-staff lead-sheet chord symbols on a
 * single uniform baseline that clears the tallest stem in the system.
 */
function systemPrimaryTopExtent(system: SystemLayout, T: LearnTokens): number {
  const topStaffTop = system.staffTops[0]
  let top = topStaffTop
  for (const m of system.measures) {
    const primary = m.staves[0]?.voices[0]
    if (!primary) continue
    for (const p of primary.placed) {
      if (p.measured.element.type !== 'note') continue
      for (const pos of p.positions) {
        const y = m.staves[0].staffTop + pos * T.step - T.noteheadHalfHeight
        if (y < top) top = y
      }
      if (p.positions.length > 0 && p.stemDir === 'up') {
        const topPos = Math.min(...p.positions)
        const tipY = m.staves[0].staffTop + topPos * T.step - T.stemLength
        if (tipY < top) top = tipY
      }
    }
  }
  return top
}

/**
 * Lowest y-extent (notehead + stem-down tip) across the primary line of a
 * single system. Used to place below-staff labels (solfège, beat counts)
 * on a single uniform baseline so a row of labels reads as one horizontal
 * line rather than tracking each note's height.
 */
function systemPrimaryBottomExtent(
  system: SystemLayout,
  T: LearnTokens,
  hasPrimaryDynamics: boolean = false,
): number {
  const bottomStaffTop = system.staffTops[system.staffTops.length - 1]
  let bottom = bottomStaffTop + 8 * T.step
  for (const m of system.measures) {
    const primary = m.staves[0]?.voices[0]
    if (!primary) continue
    for (const p of primary.placed) {
      if (p.measured.element.type !== 'note') continue
      for (const pos of p.positions) {
        const y = m.staves[0].staffTop + pos * T.step + T.noteheadHalfHeight
        if (y > bottom) bottom = y
      }
      if (p.positions.length > 0 && p.stemDir === 'down') {
        const bottomPos = Math.max(...p.positions)
        const tipY = m.staves[0].staffTop + bottomPos * T.step + T.stemLength
        if (tipY > bottom) bottom = tipY
      }
    }
  }
  // When the primary voice has dynamics (rendered below the bottom stave
  // for treble), reserve space so below-labels (solfège, beat counts,
  // German/French character markings) sit BELOW the dynamic glyph rather
  // than colliding with it.
  if (hasPrimaryDynamics) {
    const dynamicsBottom = bottomStaffTop + 8 * T.step
      + Math.round(36 * T.scale + 14)
      + Math.round(T.noteheadFontSize * 0.85 * 0.5)
    if (dynamicsBottom > bottom) bottom = dynamicsBottom
  }
  return bottom
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
      // Stem reach — stems can extend well past the notehead bounds, so a
      // bracket positioned above/below the staff must clear them. Stem
      // origin is the extreme notehead in the stem direction; the tip is
      // T.stemLength further along.
      if (p.positions.length > 0) {
        if (p.stemDir === 'up') {
          const topPos = Math.min(...p.positions)
          const stemTipY = m.staves[0].staffTop + topPos * T.step - T.stemLength
          if (stemTipY < top) top = stemTipY
        } else if (p.stemDir === 'down') {
          const bottomPos = Math.max(...p.positions)
          const stemTipY = m.staves[0].staffTop + bottomPos * T.step + T.stemLength
          if (stemTipY > bottom) bottom = stemTipY
        }
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
  aboveStaffOffset = 0,
  hasPrimaryDynamics = false,
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
    if (above) {
      // Above-staff labels are typically chord symbols. Use serif (Bodoni)
      // upright type matching standard chord-chart conventions, sized larger
      // than below-staff pedagogical labels (solfège, beat counts).
      // Position above the actual top extent of the placed element so labels
      // never collide with stems on tall stems-up chords.
      const placed = start.placed
      const topPos = Math.min(...placed.positions)
      const stemUp = placed.stemDir === 'up'
      const topNoteY = topStaffTop + topPos * T.step
      const stemTopY = stemUp ? topNoteY - T.stemLength : topNoteY
      const ledgerY = topPos < 0 ? topStaffTop + topPos * T.step : topStaffTop
      const elementTopY = Math.min(stemTopY, ledgerY, topStaffTop)
      const chordFont = T.size === 'small' ? 17 : T.size === 'hero' ? 24 : 20
      const baseY = elementTopY - Math.round(14 * T.scale + chordFont * 0.7)
      return (
        <text
          x={start.placed.x}
          y={baseY}
          fontSize={chordFont}
          fontFamily={T.fontDisplay}
          fontWeight={500}
          fill={T.ink}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {annotation.label}
        </text>
      )
    }
    // Below-staff labels stay as pedagogical italics (solfège syllables,
    // beat-counting labels, scale-degree numbers, character markings).
    // Use the SYSTEM-wide lowest extent (across the whole primary line)
    // so a row of labels sits on a uniform horizontal baseline rather
    // than tracking each note's individual height.
    // Special case: `dynamicLine` annotations (cresc., dim., poco a poco)
    // sit at the SAME baseline as dynamic glyphs so they read inline
    // with the dynamics row, not below it.
    const dynamicLine = annotation.dynamicLine === true
    let baseY: number
    let belowFont: number
    if (dynamicLine) {
      // Match the dynamic glyph baseline + render slightly larger italic
      // serif so 'cresc.' reads as a peer of 'p' / 'f' nearby.
      baseY = sys.staffTops[sys.staffTops.length - 1] + 8 * T.step
        + Math.round(36 * T.scale + 14)
      belowFont = T.size === 'small' ? 18 : T.size === 'hero' ? 24 : 22
    } else {
      const sysExt = systemPrimaryBottomExtent(sys, T, hasPrimaryDynamics)
      const elementBottomY = Math.max(sysExt, bottomStaffBottom)
      belowFont = T.size === 'small' ? 15 : T.size === 'hero' ? 20 : 17
      baseY = elementBottomY + Math.round(12 * T.scale + belowFont * 0.7)
    }
    return (
      <text
        x={start.placed.x}
        y={baseY}
        fontSize={belowFont}
        fontFamily={dynamicLine ? T.fontDisplay : T.fontLabel}
        fontStyle="italic"
        fill={dynamicLine ? T.ink : T.inkMuted}
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
  // Brackets carry primary labels (interval names, section labels) — render
  // them larger than the small pedagogical labelFont so they're legible at a
  // glance. Section labels stay extra-prominent.
  const bracketLabelFont = isSection
    ? Math.round(labelFont + 6)
    : (T.size === 'small' ? 13 : T.size === 'hero' ? 20 : 16)
  const labelOffset = bracketLabelFont + 4
  // Bracket reaches the OUTER edges of the first/last noteheads, not their
  // centers — so it visually wraps the full extent of the interval.
  const noteheadHalfWidth = Math.round(T.noteheadHalfHeight * 0.95)

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
      x1 = r.firstX - noteheadHalfWidth
      x2 = r.lastX + noteheadHalfWidth
    } else if (isStartSystem) {
      const r = systemRangeXs(sys, annotation.startIdx, annotation.endIdx)
      if (!r) continue
      x1 = r.firstX - noteheadHalfWidth
      x2 = sysBodyRight
    } else if (isEndSystem) {
      const r = systemRangeXs(sys, annotation.startIdx, annotation.endIdx)
      if (!r) continue
      x1 = sysBodyLeft
      x2 = r.lastX + noteheadHalfWidth
    } else {
      x1 = sysBodyLeft
      x2 = sysBodyRight
    }

    const ext = isIntermediate
      ? { top: topStaffTop, bottom: bottomStaffBottom }
      : noteheadVerticalExtent(sys, annotation.startIdx, annotation.endIdx, T)
    const bracketY = above
      ? Math.min(ext.top, topStaffTop) - padding - aboveStaffOffset
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
              fontSize={bracketLabelFont}
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
