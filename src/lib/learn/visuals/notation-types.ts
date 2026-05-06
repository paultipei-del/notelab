/**
 * Data model for the <MusicalExample> primitive.
 *
 * v1 surface: a flat `MusicalElement[]` for one staff, one voice — still
 * accepted by the renderer for backwards compatibility.
 *
 * v2 surface (Phase 1): a `Score` with one or more `Stave`s, each with one
 * or more `Voice`s. The renderer aligns voices on a shared time grid per
 * measure and supports grand-staff (treble + bass + brace) layouts.
 */

/**
 * Note-value duration codes. The single character is the basic value:
 *   w = whole, h = half, q = quarter, e = eighth, s = sixteenth
 * A trailing dot ('.') marks a dotted duration (1.5× the base).
 */
export type Duration = 'w' | 'h' | 'q' | 'e' | 's' | 'h.' | 'q.' | 'e.' | 's.'

export interface MusicalNote {
  type: 'note'
  /** Single pitch (e.g. 'C4', 'F#5', 'Bb3'). Either `pitch` or `pitches` is provided. */
  pitch?: string
  /** Multiple pitches sounding together as a chord. */
  pitches?: string[]
  duration: Duration
  /**
   * If true, this note is tied to the next note. The tie is rendered as a
   * curve and audio plays the combined duration once on the first note.
   */
  tied?: boolean
  /**
   * Tuplet metadata. When set, this note's effective duration is
   * `duration × normal/actual`. e.g. for triplet eighths actual=3 normal=2,
   * each eighth occupies the time of 2/3 of an eighth (= a third of a
   * quarter beat). Notes with the same tuplet object reference (or matching
   * actual/normal) and adjacent in a voice's measure are rendered as one
   * tuplet group with a number above the beam.
   */
  tuplet?: { actual: number; normal: number }
  /**
   * Engraver-specified stem direction. Overrides voice stemPolicy and the
   * automatic average-position rule. Used to honour `<stem>` directives
   * carried in MusicXML.
   */
  forceStem?: 'up' | 'down'
  /**
   * Slur boundary. 'start' begins a slur at this note; 'stop' ends one.
   * Multiple overlapping slurs in the same voice are not yet supported
   * (only one open slur at a time).
   */
  slur?: 'start' | 'stop'
  /** Articulation marks attached to this note (rendered above or below
   *  depending on stem direction). */
  articulations?: Articulation[]
  /** Ornament marks attached above the note. */
  ornaments?: Ornament[]
  /** True if this is a grace note (rendered smaller, no rhythmic time). */
  grace?: boolean
}

/** Articulation glyphs supported by the renderer. */
export type Articulation =
  | 'staccato'
  | 'accent'
  | 'tenuto'
  | 'marcato'
  | 'fermata'
  | 'staccatissimo'

/** Ornament glyphs supported by the renderer. */
export type Ornament =
  | 'trill'
  | 'mordent'
  | 'invertedMordent'
  | 'turn'

/** Dynamic marking attached to a beat in a voice. */
export type DynamicLevel =
  | 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'sfz' | 'fz'

export interface MusicalRest {
  type: 'rest'
  duration: Duration
  /** Tuplet metadata — same semantics as MusicalNote.tuplet. */
  tuplet?: { actual: number; normal: number }
}

export type MusicalElement = MusicalNote | MusicalRest

export interface TimeSignature {
  numerator: number
  denominator: number
}

export type AnnotationType = 'bracket' | 'label' | 'cadence' | 'section'
export type AnnotationPosition = 'above' | 'below'

export interface MusicalAnnotation {
  type: AnnotationType
  /** Element index range this annotation spans (inclusive). For point
   *  annotations (e.g. a cadence label) set startIdx === endIdx.
   *  In v2, indices refer to the first stave / first voice's elements
   *  (the legacy "primary line"). */
  startIdx: number
  endIdx: number
  label: string
  /** Vertical placement relative to the staff. Default 'above'. */
  position?: AnnotationPosition
  /** Smaller secondary label (e.g. "(question)" beneath "Antecedent"). */
  sublabel?: string
}

/* ── v2 multi-voice / multi-staff data model ──────────────────────────── */

/** A clef code accepted by the renderer. */
export type ClefName = 'treble' | 'bass'

/**
 * One voice on a staff. Voices on the same staff share a time grid; the
 * renderer aligns elements with the same `beatStart` across voices.
 */
export interface Voice {
  elements: MusicalElement[]
  /**
   * Stem-direction policy for this voice.
   *   'auto' → per-note rule (avg position above middle line → down, else up)
   *   'up' / 'down' → force every stem in the voice to that direction
   *
   * Multi-voice convention: V1 = 'up', V2 = 'down'. For single-voice staves
   * leave 'auto'.
   */
  stemPolicy?: 'auto' | 'up' | 'down'
  /**
   * Dynamic markings (pp, p, mf, f, sfz, …) anchored to a beat position.
   * Rendered as Bravura glyphs below the staff (treble) or above (bass).
   * `modifier` adds an italic word after the glyph (e.g. 'subito', 'molto').
   */
  dynamics?: DynamicMark[]
  /**
   * Crescendo / decrescendo wedges spanning a beat range. Anchored to the
   * same baseline as `dynamics`, so a `p < f` pattern aligns visually.
   * Cross-system spans split into per-system segments mirroring slurs.
   */
  hairpins?: Hairpin[]
  /**
   * Pedal markings (sustain pedal). Typically only on the bass-clef voice
   * for piano music. 'text' style renders Ped./✱ glyphs at the endpoints;
   * 'bracket' style draws a continuous bracket below the staff.
   */
  pedalMarks?: PedalMark[]
}

export interface DynamicMark {
  /** Beat position from the start of the voice (beat 0 = downbeat of measure 1). */
  beat: number
  level: DynamicLevel
  /** Optional italic word rendered immediately after the glyph. */
  modifier?: string
}

export interface Hairpin {
  startBeat: number
  endBeat: number
  direction: 'cresc' | 'decresc'
  /** Default: 'below' for treble, 'above' for bass. */
  placement?: 'above' | 'below'
}

export interface PedalMark {
  startBeat: number
  endBeat: number
  /** 'text' = Ped. + ✱ at endpoints; 'bracket' = continuous bracket. Default 'text'. */
  style?: 'text' | 'bracket'
}

/** One stave (treble or bass) carrying one or more voices. */
export interface Stave {
  /** Initial clef at the start of the score. */
  clef: ClefName
  voices: Voice[]
  /**
   * Mid-score clef changes. `measureIdx` is 0-indexed within the score's
   * total measure list (i.e. relative to the first measure of the excerpt).
   * The new clef takes effect at the START of that measure and persists
   * until the next change.
   */
  clefChanges?: Array<{ measureIdx: number; clef: ClefName }>
}

/**
 * A full multi-stave score. Staves render top-to-bottom in the order given;
 * a 2-stave score with treble + bass renders as a grand staff with a brace.
 * Time signature and key signature apply to the whole score; mid-piece
 * changes are tracked via `keyChanges` and `timeChanges`.
 */
export interface Score {
  staves: Stave[]
  timeSignature: TimeSignature
  /** Number of sharps (positive) or flats (negative). Default 0. */
  keySignature?: number
  /** Per-measure markings: which measures begin or end with a repeat
   *  barline, and any volta brackets. */
  measureMarks?: MeasureMark[]
  /** Mid-score key signature changes. measureIdx is 0-indexed. */
  keyChanges?: Array<{ measureIdx: number; fifths: number }>
  /** Mid-score time signature changes. */
  timeChanges?: Array<{ measureIdx: number; timeSignature: TimeSignature }>
  /**
   * Tempo markings rendered above the top staff. Each marking can carry
   * a text label (e.g. 'Allegro'), a metronome equation (e.g. ♩ = 120),
   * or both. `style: 'change-with-line'` adds a dashed continuation line
   * spanning measureIdx → endMeasureIdx for rit. / accel. passages.
   */
  tempoMarkings?: TempoMarking[]
}

export interface TempoMarking {
  /** 0-indexed within the score's measure list. */
  measureIdx: number
  /** Beat within the measure. Default 0 (downbeat). */
  beat?: number
  /** Display text. E.g. 'Allegro', 'a tempo', 'Andante con moto'. */
  text?: string
  /** Metronome equation (♩ = N). */
  metronome?: { beatNote: Duration; bpm: number }
  /**
   * 'normal' (default): bold serif, prominent at start of measure.
   * 'change': italic, smaller, used for rit. / accel. / a tempo.
   * 'change-with-line': italic + dashed line spanning to endMeasureIdx.
   */
  style?: 'normal' | 'change' | 'change-with-line'
  /** End measure for 'change-with-line'. */
  endMeasureIdx?: number
}

/**
 * Per-measure repeat / volta metadata. measureIdx is 0-indexed within the
 * Score's measure list. A measure can carry both startRepeat/endRepeat
 * AND a volta range (e.g. "1." or "2." brackets above).
 */
export interface MeasureMark {
  measureIdx: number
  /** True if this measure begins with a repeat-start bar line. */
  startRepeat?: boolean
  /** True if this measure ends with a repeat-end bar line. */
  endRepeat?: boolean
  /** Volta number (1, 2, ...) — if set, a bracket spans this measure
   *  with the number above the staff. */
  voltaNumber?: number
  /** Whether the volta bracket should "close" on the right (final ending). */
  voltaCloseRight?: boolean
}
