/**
 * Minimal MusicXML 4.0 partwise parser. Extracts a single-staff/single-voice
 * melody from a MusicXML document and converts it into the
 * `MusicalElement[]` shape consumed by `<MusicalExample>`. Designed for the
 * Mozart K. 265 use case: 32-bar piano score, melody on staff 1 / voice 1.
 *
 * v1 limitations (mirroring `<MusicalExample>`):
 *   - Single staff only; left-hand staff is silently skipped.
 *   - Chord follow-up notes (<chord/>) are skipped — only the first member
 *     of any chord is taken so the result stays a single melodic line.
 *   - Grace notes are skipped.
 *   - Triplets / tuplets are skipped (the underlying primitive doesn't
 *     render them yet).
 *   - Slurs, ornaments, articulations, dynamics: all dropped — visual
 *     primitive doesn't support them.
 *
 * Returns the active time signature, key signature, and clef as resolved at
 * the start of the requested measure range — meaning a key change at the
 * Variation VIII boundary (m.25, fifths = −3 in K. 265) is honoured when
 * the caller asks for that range.
 */

import type {
  Duration,
  MusicalElement,
  MusicalNote,
  TimeSignature,
  Score,
  Stave,
  Voice,
  ClefName,
  Articulation,
  Ornament,
  MeasureMark,
} from '@/lib/learn/visuals/notation-types'
import type { Clef } from '@/lib/learn/visuals/pitch'
import { durationToBeats as durationToBeatsLocal } from '@/lib/learn/visuals/notation-helpers'

/** Map MusicXML articulation tag names to our Articulation codes. */
const ARTICULATION_MAP: Record<string, Articulation> = {
  staccato: 'staccato',
  accent: 'accent',
  tenuto: 'tenuto',
  'strong-accent': 'marcato',
  staccatissimo: 'staccatissimo',
}
/** Map MusicXML ornament tag names to our Ornament codes. */
const ORNAMENT_MAP: Record<string, Ornament> = {
  'trill-mark': 'trill',
  mordent: 'mordent',
  'inverted-mordent': 'invertedMordent',
  'turn': 'turn',
}

function readArticulations(noteEl: Element): Articulation[] | undefined {
  const out: Articulation[] = []
  const arts = noteEl.querySelectorAll('notations articulations > *')
  arts.forEach(a => {
    const tag = a.tagName
    const m = ARTICULATION_MAP[tag]
    if (m && !out.includes(m)) out.push(m)
  })
  // <fermata> sits at notations level (not under articulations).
  if (noteEl.querySelector('notations fermata')) {
    if (!out.includes('fermata')) out.push('fermata')
  }
  return out.length > 0 ? out : undefined
}
function readOrnaments(noteEl: Element): Ornament[] | undefined {
  const out: Ornament[] = []
  const orns = noteEl.querySelectorAll('notations ornaments > *')
  orns.forEach(o => {
    const m = ORNAMENT_MAP[o.tagName]
    if (m && !out.includes(m)) out.push(m)
  })
  return out.length > 0 ? out : undefined
}

export interface ParsedMelody {
  elements: MusicalElement[]
  timeSignature: TimeSignature
  keySignature: number
  clef: Clef
  /** Diagnostics: triplet/tuplet notes encountered and skipped. */
  skippedTuplets: number
}

export interface ParseOptions {
  /** First measure to include (1-indexed, inclusive). */
  measureFrom: number
  /** Last measure to include (1-indexed, inclusive). */
  measureTo: number
  /** Which staff to extract. 1 = top (treble for piano), 2 = bottom (bass). Default 1. */
  staff?: number
  /** Which voice to extract. Default 1 (primary upper-staff voice). */
  voice?: number
}

const TYPE_TO_DURATION: Record<string, 'w' | 'h' | 'q' | 'e' | 's'> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: 'e',
  '16th': 's',
}

/** Walk a MusicXML document and pull a single melodic line. */
export function parseMusicXmlMelody(
  xml: string,
  opts: ParseOptions,
): ParsedMelody {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const part = doc.querySelector('part')
  if (!part) throw new Error('MusicXML: no <part> found')

  const targetStaff = opts.staff ?? 1
  const targetVoice = opts.voice ?? 1

  // Walk measures in document order, tracking active state. We resolve the
  // time signature, key signature, and clef as they stand AT the start of
  // measureFrom — a later attribute change (e.g. C major → C minor at m.25)
  // becomes the active state when the caller asks for that range.
  let activeBeats = 4
  let activeBeatType = 4
  let activeFifths = 0
  let activeClef: Clef = 'treble'

  const elements: MusicalElement[] = []
  let skippedTuplets = 0

  const measures = part.querySelectorAll('measure')
  for (const measure of Array.from(measures)) {
    const num = parseInt(measure.getAttribute('number') ?? '0', 10)

    // Update active attributes from <attributes> blocks ONLY for measures
    // up to and including measureFrom. The goal is to resolve the active
    // state AT THE START of the requested excerpt — later attribute changes
    // (e.g. K. 265's key change to C minor at m.25) must not leak into an
    // excerpt that doesn't include them. Without this guard, asking for
    // mm. 1–8 (Theme, C major) would still inherit the −3 key signature
    // set later at m.25.
    if (num <= opts.measureFrom) {
      const attrs = measure.querySelector('attributes')
      if (attrs) {
        const beats = attrs.querySelector('time beats')?.textContent
        const beatType = attrs.querySelector('time beat-type')?.textContent
        if (beats) activeBeats = parseInt(beats, 10)
        if (beatType) activeBeatType = parseInt(beatType, 10)

        const fifths = attrs.querySelector('key fifths')?.textContent
        if (fifths) activeFifths = parseInt(fifths, 10)

        // Clef element specific to the requested staff (number=...).
        const clefEls = attrs.querySelectorAll('clef')
        for (const clefEl of Array.from(clefEls)) {
          const clefStaff = parseInt(clefEl.getAttribute('number') ?? '1', 10)
          if (clefStaff !== targetStaff) continue
          const sign = clefEl.querySelector('sign')?.textContent
          if (sign === 'F') activeClef = 'bass'
          else if (sign === 'G') activeClef = 'treble'
        }
      }
    }

    // Skip measures outside the requested range. Attribute updates above
    // are gated to ≤ measureFrom so cross-section state stays correct.
    if (num < opts.measureFrom || num > opts.measureTo) continue

    // Walk children IN ORDER so <backup> (which moves the cursor back to
    // the start of the measure for the next staff/voice) doesn't confuse us:
    // we filter by staff+voice, so backup is irrelevant — we just don't
    // include those notes.
    for (const child of Array.from(measure.children)) {
      if (child.tagName !== 'note') continue

      const staffEl = child.querySelector('staff')
      const noteStaff = parseInt(staffEl?.textContent ?? '1', 10)
      if (noteStaff !== targetStaff) continue

      const voiceEl = child.querySelector('voice')
      const noteVoice = parseInt(voiceEl?.textContent ?? '1', 10)
      if (noteVoice !== targetVoice) continue

      // A <chord/> tag means this note is a chord member of the previous
      // note. For a single melodic line we drop these; <MusicalExample>
      // could express them via the `pitches` array but we keep it simple
      // here.
      if (child.querySelector('chord')) continue

      const isGrace = child.querySelector('grace') !== null

      // Tuplets — read <time-modification>'s actual + normal so the note
      // renders at scaled duration with a tuplet number above its beam.
      const timeMod = child.querySelector('time-modification')
      let tuplet: { actual: number; normal: number } | undefined
      if (timeMod) {
        const a = parseInt(timeMod.querySelector('actual-notes')?.textContent ?? '0', 10)
        const n = parseInt(timeMod.querySelector('normal-notes')?.textContent ?? '0', 10)
        if (a > 0 && n > 0) tuplet = { actual: a, normal: n }
        else skippedTuplets++
      }

      const isRest = child.querySelector('rest') !== null
      const typeText = child.querySelector('type')?.textContent ?? ''
      const dotted = child.querySelector('dot') !== null
      const dur = mapDuration(typeText, dotted)
      if (!dur) continue

      if (isRest) {
        const r: MusicalElement = tuplet
          ? { type: 'rest', duration: dur, tuplet }
          : { type: 'rest', duration: dur }
        elements.push(r)
        continue
      }

      const step = child.querySelector('pitch step')?.textContent ?? 'C'
      const octave = child.querySelector('pitch octave')?.textContent ?? '4'
      const alterEl = child.querySelector('pitch alter')
      const alter = alterEl?.textContent ? parseInt(alterEl.textContent, 10) : 0
      const accidental = alterToCode(alter)
      const pitch = `${step}${accidental}${octave}`

      // Tie start ⇒ this note is tied to the next.
      const tied = child.querySelector('tie[type="start"]') !== null

      const note: MusicalNote = { type: 'note', pitch, duration: dur }
      if (tied) note.tied = true
      if (tuplet) note.tuplet = tuplet
      const stemText = child.querySelector('stem')?.textContent
      if (stemText === 'up' || stemText === 'down') note.forceStem = stemText
      const slurEl = child.querySelector('notations slur[type="start"], notations slur[type="stop"]')
      if (slurEl) {
        const t = slurEl.getAttribute('type')
        if (t === 'start' || t === 'stop') note.slur = t
      }
      const arts = readArticulations(child)
      if (arts) note.articulations = arts
      const orns = readOrnaments(child)
      if (orns) note.ornaments = orns
      if (isGrace) note.grace = true
      elements.push(note)
    }
  }

  return {
    elements,
    timeSignature: { numerator: activeBeats, denominator: activeBeatType },
    keySignature: activeFifths,
    clef: activeClef,
    skippedTuplets,
  }
}

function mapDuration(type: string, dotted: boolean): Duration | null {
  const base = TYPE_TO_DURATION[type]
  if (!base) return null
  // Dotted whole isn't in our v1 set; treat as plain whole for safety.
  if (base === 'w' && dotted) return 'w'
  return (dotted ? `${base}.` : base) as Duration
}

function alterToCode(alter: number): string {
  if (alter === 1) return '#'
  if (alter === -1) return 'b'
  if (alter === 2) return '##'
  if (alter === -2) return 'bb'
  return ''
}

/* ── parseMusicXmlScore (v2) ──────────────────────────────────────────── */

export interface ParsedScore {
  score: Score
  /**
   * Suggested system break positions, derived from `<print new-system="yes"/>`
   * directives in the MusicXML. measureIdx values are 0-indexed within the
   * requested range. The caller (e.g. <MusicXmlScore>) can pass these as
   * `systemBreaks` to <MusicalExample> when the user doesn't supply their own.
   */
  systemBreaks: number[]
  /** Diagnostics: triplet/tuplet notes encountered and skipped. */
  skippedTuplets: number
  /** Diagnostics: grace notes skipped. */
  skippedGrace: number
}

export interface ParseScoreOptions {
  /** First measure to include (1-indexed, inclusive). Default: first found. */
  measureFrom?: number
  /** Last measure to include (1-indexed, inclusive). Default: last found. */
  measureTo?: number
}

interface VoiceKey {
  staff: number
  voice: number
}

/**
 * Full multi-staff / multi-voice parser. Emits a `Score` ready for
 * <MusicalExample score={...}>. Compared to parseMusicXmlMelody this:
 *   - extracts ALL staves (typically 2 for piano)
 *   - extracts ALL voices on each staff
 *   - merges chord follow-up notes (`<chord/>`) into the previous note's
 *     `pitches` array
 *
 * Still skipped (deferred to later Phase work):
 *   - grace notes
 *   - tuplets / triplets (`<time-modification>`)
 *   - slurs, articulations, dynamics, ornaments, pedal markings
 */
export function parseMusicXmlScore(
  xml: string,
  opts: ParseScoreOptions = {},
): ParsedScore {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const part = doc.querySelector('part')
  if (!part) throw new Error('MusicXML: no <part> found')

  const measureEls = Array.from(part.querySelectorAll('measure'))
  if (measureEls.length === 0) throw new Error('MusicXML: no measures')

  const firstNum = parseInt(measureEls[0].getAttribute('number') ?? '1', 10)
  const lastNum = parseInt(
    measureEls[measureEls.length - 1].getAttribute('number') ?? `${measureEls.length}`,
    10,
  )
  const measureFrom = opts.measureFrom ?? firstNum
  const measureTo = opts.measureTo ?? lastNum

  // Active state at the start of measureFrom. Time/key signature are
  // frozen at that point; clef changes within the range are emitted as
  // per-stave clefChanges.
  let activeBeats = 4
  let activeBeatType = 4
  let activeFifths = 0
  // Per-staff active clef as it stands at measureFrom (the "initial" clef
  // emitted on the Stave). Clef changes WITHIN the range are tracked
  // separately in `clefChangesByStaff` below.
  const staffClefs = new Map<number, ClefName>()

  // Per (staff, voice) per-measure element accumulator. Outer key is the
  // 1-indexed measure number; inner key is the voice key. This lets us
  // back-fill voices that don't appear in some measures with measure rests.
  const buf = new Map<number, Map<string, MusicalElement[]>>()
  const voicesPerStaff = new Map<number, Set<number>>()
  // Mid-range clef changes: staff → array of { measureIdx, clef }, with
  // measureIdx 0-indexed relative to measureFrom.
  const clefChangesByStaff = new Map<number, Array<{ measureIdx: number; clef: ClefName }>>()
  // System break suggestions from <print new-system="yes"/>.
  const systemBreaks: number[] = []
  // Per-measure marks (repeats + voltas).
  const measureMarks: MeasureMark[] = []
  // Measures explicitly flagged as anacruses (<measure implicit="yes">).
  const implicitMeasures = new Set<number>()
  function ensureMark(arr: MeasureMark[], measureIdx: number): MeasureMark {
    let m = arr.find(x => x.measureIdx === measureIdx)
    if (!m) {
      m = { measureIdx }
      arr.push(m)
    }
    return m
  }

  let skippedTuplets = 0
  let skippedGrace = 0

  function voiceKey(staff: number, voice: number): string {
    return `s${staff}-v${voice}`
  }
  function bufFor(measureNum: number): Map<string, MusicalElement[]> {
    let inner = buf.get(measureNum)
    if (!inner) {
      inner = new Map()
      buf.set(measureNum, inner)
    }
    return inner
  }
  function pushElement(measureNum: number, staff: number, voice: number, el: MusicalElement) {
    const key = voiceKey(staff, voice)
    const inner = bufFor(measureNum)
    if (!inner.has(key)) inner.set(key, [])
    inner.get(key)!.push(el)
    if (!voicesPerStaff.has(staff)) voicesPerStaff.set(staff, new Set())
    voicesPerStaff.get(staff)!.add(voice)
  }

  for (const measure of measureEls) {
    const num = parseInt(measure.getAttribute('number') ?? '0', 10)
    const inRange = num >= measureFrom && num <= measureTo
    if (measure.getAttribute('implicit') === 'yes') implicitMeasures.add(num)

    const attrs = measure.querySelector('attributes')
    if (attrs) {
      // Time + key signature: only resolve at or before measureFrom (Phase 1
      // doesn't render mid-piece time/key changes).
      if (num <= measureFrom) {
        const beats = attrs.querySelector('time beats')?.textContent
        const beatType = attrs.querySelector('time beat-type')?.textContent
        if (beats) activeBeats = parseInt(beats, 10)
        if (beatType) activeBeatType = parseInt(beatType, 10)

        const fifths = attrs.querySelector('key fifths')?.textContent
        if (fifths) activeFifths = parseInt(fifths, 10)
      }

      // Clef changes: track per staff. If at/before measureFrom, this is
      // the "initial" clef. If after, emit as a clefChanges entry.
      const clefEls = attrs.querySelectorAll('clef')
      for (const clefEl of Array.from(clefEls)) {
        const clefStaff = parseInt(clefEl.getAttribute('number') ?? '1', 10)
        const sign = clefEl.querySelector('sign')?.textContent
        let clef: ClefName | null = null
        if (sign === 'F') clef = 'bass'
        else if (sign === 'G') clef = 'treble'
        if (!clef) continue

        if (num <= measureFrom) {
          staffClefs.set(clefStaff, clef)
        } else if (inRange) {
          // Mid-range clef change: emit relative to measureFrom.
          const measureIdx = num - measureFrom
          if (!clefChangesByStaff.has(clefStaff)) clefChangesByStaff.set(clefStaff, [])
          clefChangesByStaff.get(clefStaff)!.push({ measureIdx, clef })
        }
      }
    }

    if (!inRange) continue

    // Detect repeat barlines + voltas at this measure.
    const measureIdx = num - measureFrom

    // <print new-system="yes"/> at the start of a measure → emit a system
    // break BEFORE this measure (i.e. previous measures stay on the prior
    // system, this measure begins a fresh one). Skip the very first
    // measure since there's no previous system.
    const printEl = measure.querySelector('print')
    if (printEl?.getAttribute('new-system') === 'yes' && measureIdx > 0) {
      if (!systemBreaks.includes(measureIdx)) systemBreaks.push(measureIdx)
    }
    const barlineEls = measure.querySelectorAll('barline')
    barlineEls.forEach(bl => {
      const location = bl.getAttribute('location') // 'left' | 'right' | 'middle'
      const repeatEl = bl.querySelector('repeat')
      if (repeatEl) {
        const dir = repeatEl.getAttribute('direction')
        const mark = ensureMark(measureMarks, measureIdx)
        if (dir === 'forward') mark.startRepeat = true
        if (dir === 'backward') mark.endRepeat = true
      }
      const ending = bl.querySelector('ending')
      if (ending) {
        const number = ending.getAttribute('number')
        const type = ending.getAttribute('type')
        const n = parseInt(number?.split(',')[0] ?? '0', 10)
        if (n > 0) {
          const mark = ensureMark(measureMarks, measureIdx)
          if (type === 'start' || (!type && location !== 'right')) {
            mark.voltaNumber = n
          }
          if (type === 'stop' || type === 'discontinue') {
            mark.voltaCloseRight = true
          }
        }
      }
    })

    for (const child of Array.from(measure.children)) {
      if (child.tagName !== 'note') continue

      const staffEl = child.querySelector('staff')
      const noteStaff = parseInt(staffEl?.textContent ?? '1', 10)
      const voiceEl = child.querySelector('voice')
      const noteVoice = parseInt(voiceEl?.textContent ?? '1', 10)

      // Chord follow-up: merge this note's pitch into the prior note in the
      // same voice's CURRENT measure buffer.
      const isChord = child.querySelector('chord') !== null
      if (isChord) {
        const inner = bufFor(num)
        const arr = inner.get(voiceKey(noteStaff, noteVoice))
        if (!arr || arr.length === 0) continue
        const prior = arr[arr.length - 1]
        if (prior.type !== 'note') continue

        const stepText = child.querySelector('pitch step')?.textContent ?? 'C'
        const octave = child.querySelector('pitch octave')?.textContent ?? '4'
        const alterEl = child.querySelector('pitch alter')
        const alter = alterEl?.textContent ? parseInt(alterEl.textContent, 10) : 0
        const accidental = alterToCode(alter)
        const pitchStr = `${stepText}${accidental}${octave}`

        if (!prior.pitches) {
          prior.pitches = prior.pitch ? [prior.pitch] : []
          prior.pitch = undefined
        }
        prior.pitches.push(pitchStr)
        continue
      }

      // Grace notes are emitted with `grace: true`; they consume no
      // rhythmic time but render at a smaller scale.
      const isGrace = child.querySelector('grace') !== null
      // Tuplets — read <time-modification>'s actual + normal so the note
      // is rendered at the scaled duration with a tuplet number above the
      // beam. Only `actual:normal` (the simplest form) is read here.
      const timeMod = child.querySelector('time-modification')
      let tuplet: { actual: number; normal: number } | undefined
      if (timeMod) {
        const a = parseInt(timeMod.querySelector('actual-notes')?.textContent ?? '0', 10)
        const n = parseInt(timeMod.querySelector('normal-notes')?.textContent ?? '0', 10)
        if (a > 0 && n > 0) {
          tuplet = { actual: a, normal: n }
        } else {
          skippedTuplets++
        }
      }

      const restEl = child.querySelector('rest')
      const isRest = restEl !== null
      // <rest measure="yes"/> = full-measure rest; emit a single rest of
      // the time-signature's full-measure duration, tagged so the renderer
      // draws the conventional whole-rest glyph hanging from line 4. The
      // <type> element is typically absent on these.
      if (isRest && restEl?.getAttribute('measure') === 'yes') {
        const dur = fullMeasureDuration({ numerator: activeBeats, denominator: activeBeatType })
        pushElement(num, noteStaff, noteVoice, { type: 'rest', duration: dur, wholeMeasureRest: true })
        // Make sure this voice is now known on its staff so the back-fill
        // logic below treats subsequent missing measures as gaps to fill.
        if (!voicesPerStaff.has(noteStaff)) voicesPerStaff.set(noteStaff, new Set())
        voicesPerStaff.get(noteStaff)!.add(noteVoice)
        continue
      }

      const typeText = child.querySelector('type')?.textContent ?? ''
      const dotted = child.querySelector('dot') !== null
      const dur = mapDuration(typeText, dotted)
      if (!dur) continue

      if (isRest) {
        const rest: MusicalElement = tuplet
          ? { type: 'rest', duration: dur, tuplet }
          : { type: 'rest', duration: dur }
        pushElement(num, noteStaff, noteVoice, rest)
        continue
      }

      const stepText = child.querySelector('pitch step')?.textContent ?? 'C'
      const octave = child.querySelector('pitch octave')?.textContent ?? '4'
      const alterEl = child.querySelector('pitch alter')
      const alter = alterEl?.textContent ? parseInt(alterEl.textContent, 10) : 0
      const accidental = alterToCode(alter)
      const pitchStr = `${stepText}${accidental}${octave}`
      const tied = child.querySelector('tie[type="start"]') !== null

      const note: MusicalNote = { type: 'note', pitch: pitchStr, duration: dur }
      if (tied) note.tied = true
      if (tuplet) note.tuplet = tuplet
      const stemText = child.querySelector('stem')?.textContent
      if (stemText === 'up' || stemText === 'down') note.forceStem = stemText
      const slurEl = child.querySelector('notations slur[type="start"], notations slur[type="stop"]')
      if (slurEl) {
        const t = slurEl.getAttribute('type')
        if (t === 'start' || t === 'stop') note.slur = t
      }
      const arts = readArticulations(child)
      if (arts) note.articulations = arts
      const orns = readOrnaments(child)
      if (orns) note.ornaments = orns
      if (isGrace) note.grace = true
      pushElement(num, noteStaff, noteVoice, note)
    }
  }

  // Resolve missing-voice gaps: for every staff+voice that appears in ANY
  // measure of the requested range, ensure each measure has at least one
  // element. Empty measures get a measure rest (rendered as a whole-rest
  // glyph hanging from line 4, per Gould).
  const ts: TimeSignature = { numerator: activeBeats, denominator: activeBeatType }
  const fullRestDur = fullMeasureDuration(ts)
  const finalVoiceMap = new Map<string, MusicalElement[]>()
  for (let n = measureFrom; n <= measureTo; n++) {
    const inner = buf.get(n) ?? new Map<string, MusicalElement[]>()
    for (const [staff, voices] of voicesPerStaff.entries()) {
      for (const voice of voices) {
        const key = voiceKey(staff, voice)
        const measureElements = inner.get(key)
          ?? [{ type: 'rest', duration: fullRestDur, wholeMeasureRest: true } as MusicalElement]
        if (!finalVoiceMap.has(key)) finalVoiceMap.set(key, [])
        for (const el of measureElements) finalVoiceMap.get(key)!.push(el)
      }
    }
  }

  // Pickup detection: if the first in-range measure is marked `implicit="yes"`
  // (anacrusis), measure its actual beat-content and emit `pickupBeats` so
  // the renderer can carve it off as a partial first bar followed by a
  // proper barline, rather than merging it with measure 1.
  let pickupBeats: number | undefined
  if (implicitMeasures.has(measureFrom)) {
    const firstBuf = buf.get(measureFrom)
    if (firstBuf) {
      let maxBeats = 0
      for (const els of firstBuf.values()) {
        const total = els.reduce(
          (sum, el) => sum + durationToBeatsLocal(el.duration, ts, el.tuplet),
          0,
        )
        if (total > maxBeats) maxBeats = total
      }
      if (maxBeats > 0 && maxBeats < ts.numerator - 1e-6) {
        pickupBeats = maxBeats
      }
    }
  }

  // Build Score: group voices by staff, ordered by staff number then voice.
  const staveIdsSorted = Array.from(voicesPerStaff.keys()).sort((a, b) => a - b)
  const staves: Stave[] = staveIdsSorted.map(staffNum => {
    const clef: ClefName = staffClefs.get(staffNum)
      ?? (staffNum === 1 ? 'treble' : 'bass')
    const voiceIds = Array.from(voicesPerStaff.get(staffNum) ?? []).sort((a, b) => a - b)
    const voices: Voice[] = voiceIds.map((vNum, idx) => {
      const elements = finalVoiceMap.get(voiceKey(staffNum, vNum)) ?? []
      const stemPolicy: 'auto' | 'up' | 'down' =
        voiceIds.length > 1
          ? (idx === 0 ? 'up' : 'down')
          : 'auto'
      return { elements, stemPolicy }
    })
    const clefChanges = clefChangesByStaff.get(staffNum)
    return clefChanges && clefChanges.length > 0
      ? { clef, voices, clefChanges }
      : { clef, voices }
  })

  if (staves.length === 0) {
    throw new Error(`MusicXML: no notes found in measure range ${measureFrom}–${measureTo}`)
  }

  return {
    score: {
      staves,
      timeSignature: ts,
      keySignature: activeFifths,
      ...(measureMarks.length > 0 ? { measureMarks } : {}),
      ...(pickupBeats !== undefined ? { pickupBeats } : {}),
    },
    systemBreaks: systemBreaks.slice().sort((a, b) => a - b),
    skippedTuplets,
    skippedGrace,
  }
}

/** Duration code that fills exactly one measure of the given time signature. */
function fullMeasureDuration(ts: TimeSignature): Duration {
  const totalQuarters = (ts.numerator * 4) / ts.denominator
  if (Math.abs(totalQuarters - 4) < 1e-6) return 'w'
  if (Math.abs(totalQuarters - 3) < 1e-6) return 'h.'
  if (Math.abs(totalQuarters - 2) < 1e-6) return 'h'
  if (Math.abs(totalQuarters - 1.5) < 1e-6) return 'q.'
  if (Math.abs(totalQuarters - 1) < 1e-6) return 'q'
  // 6/8 → 3 quarter notes' worth, beat-unit eighth: dotted half is closest.
  if (Math.abs(totalQuarters - 3) < 1e-6) return 'h.'
  // Fallback for irregular meters.
  return 'h'
}
