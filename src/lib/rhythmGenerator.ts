// ── Rhythm Generator ──────────────────────────────────────────────────────────
// Generates musically valid rhythms as RhythmExercise objects
// and exports them as MusicXML strings

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export type TupletType = 'triplet' | 'quintuplet' | null

export interface GeneratorOptions {
  timeSignature: { beats: number; beatType: number }
  measures: number
  notePool: NoteValue[]
  allowRests: boolean
  restProbability: number
  allowDots: boolean
  dotPool?: NoteValue[]
  dotProbability: number
  allowTies: boolean
  tieProbability: number
  allowTuplets: boolean
  tupletType: TupletType
  hands: 1 | 2
  seed?: number
}

export interface GeneratedNote {
  type: NoteValue
  rest: boolean
  dot: boolean
  tieStart: boolean
  tieStop: boolean
  tuplet?: TupletType
  durationBeats: number
}

export interface GeneratedMeasure {
  notes: GeneratedNote[]
}

export interface GeneratedExercise {
  title: string
  timeSignature: { beats: number; beatType: number }
  measures: GeneratedMeasure[]
  hands: 1 | 2
}

const NOTE_BEATS: Record<NoteValue, number> = {
  whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25
}

function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function r16(n: number) { return Math.round(n * 16) / 16 }

// ── Beat boundary logic ────────────────────────────────────────────────────────
// beatUnit = quarter note = 1 in our system (beatTypeFactor applied externally)
// Strong beats in 4/4: beats 1 and 3 (positions 0 and 2)
// Any note that crosses a beat boundary must be split with a tie
// Any rest must not cross a beat boundary

function beatBoundariesCrossed(startPos: number, duration: number, beatUnit: number): number[] {
  const boundaries: number[] = []
  const end = r16(startPos + duration)
  let b = Math.ceil(r16(startPos / beatUnit) + 0.001) * beatUnit
  while (r16(b) < r16(end) - 0.001) {
    boundaries.push(r16(b))
    b = r16(b + beatUnit)
  }
  return boundaries
}

// Split a note/rest that crosses beat boundaries into tied pieces
function splitAtBeatBoundaries(
  type: NoteValue,
  isRest: boolean,
  dot: boolean,
  totalBeats: number,
  startPos: number,
  beatUnit: number,
  validDurations: { type: NoteValue; beats: number; dot: boolean }[]
): GeneratedNote[] {
  const boundaries = beatBoundariesCrossed(startPos, totalBeats, beatUnit)
  if (boundaries.length === 0) {
    return [{ type, rest: isRest, dot, tieStart: false, tieStop: false, tuplet: null, durationBeats: totalBeats }]
  }

  const pieces: GeneratedNote[] = []
  let remaining = r16(totalBeats)
  let pos = r16(startPos)
  let isFirst = true

  while (remaining > 0.001) {
    // Find next boundary
    const nextBoundary = r16(Math.ceil(r16(pos / beatUnit) + 0.001) * beatUnit)
    const spaceToNext = r16(nextBoundary - pos)
    const pieceBeats = r16(Math.min(remaining, spaceToNext > 0.001 ? spaceToNext : remaining))

    // Find the best note type for this piece duration
    const match = validDurations
      .filter(d => Math.abs(d.beats - pieceBeats) < 0.001)
      .sort((a, b) => (a.dot ? 0 : 1) - (b.dot ? 0 : 1))[0]

    const pieceType = match?.type ?? type
    const pieceDot = match?.dot ?? false

    const note: GeneratedNote = {
      type: pieceType,
      rest: isRest,
      dot: pieceDot,
      tieStart: false,
      tieStop: !isFirst && !isRest,
      tuplet: null,
      durationBeats: pieceBeats,
    }
    pieces.push(note)

    if (!isFirst && pieces.length >= 2) {
      pieces[pieces.length - 2].tieStart = !isRest
    }

    remaining = r16(remaining - pieceBeats)
    pos = r16(pos + pieceBeats)
    isFirst = false
  }

  // Mark last piece tieStart = false, first piece tieStop = false
  if (pieces.length > 0) {
    pieces[0].tieStop = false
    pieces[pieces.length - 1].tieStart = false
  }

  return pieces
}

// Best rest notation for a duration starting at pos, within beat constraints
// Returns array of rest notes (may be multiple to show beats clearly)
function buildRests(
  totalBeats: number,
  startPos: number,
  beatUnit: number,
  validDurations: { type: NoteValue; beats: number; dot: boolean }[],
  allowDots: boolean
): GeneratedNote[] {
  const rests: GeneratedNote[] = []
  let remaining = r16(totalBeats)
  let pos = r16(startPos)

  while (remaining > 0.001) {
    // Space until next beat boundary
    const nextBeat = r16(Math.ceil(r16(pos / beatUnit) + 0.001) * beatUnit)
    const spaceToNext = r16(nextBeat - pos)
    // If exactly on a beat, space to next beat = beatUnit
    const effectiveSpace = spaceToNext > 0.001 ? spaceToNext : beatUnit

    // Find largest rest that fits within remaining AND respects beat structure
    // Plain rests: must fit within current beat segment
    // Dotted rests: allowed if starting on a beat AND total <= remaining
    const candidates = validDurations
      .filter(d => {
        if (d.beats > r16(remaining) + 0.001) return false
        if (d.dot && !allowDots) return false
        if (d.dot) {
          // Dotted rest valid only when starting exactly on a beat
          const onBeat = Math.abs(r16(pos % beatUnit)) < 0.001
          if (!onBeat) return false
          // And must not cross a beat two levels up (e.g. in 4/4, can't cross beat 3)
          // Simple rule: dotted rest <= 1.5 beats is fine starting on any beat
          return true
        }
        // Plain rest: must fit within current beat segment
        return d.beats <= r16(effectiveSpace) + 0.001
      })
      .sort((a, b) => b.beats - a.beats)  // prefer largest

    if (candidates.length === 0) {
      // Force smallest available
      const fallback = validDurations
        .filter(d => !d.dot && d.beats <= r16(remaining) + 0.001)
        .sort((a, b) => a.beats - b.beats)[0]
      if (!fallback) break
      rests.push({ type: fallback.type, rest: true, dot: false, tieStart: false, tieStop: false, tuplet: null, durationBeats: fallback.beats })
      remaining = r16(remaining - fallback.beats)
      pos = r16(pos + fallback.beats)
    } else {
      const chosen = candidates[0]
      rests.push({ type: chosen.type, rest: true, dot: chosen.dot, tieStart: false, tieStop: false, tuplet: null, durationBeats: chosen.beats })
      remaining = r16(remaining - chosen.beats)
      pos = r16(pos + chosen.beats)
    }
  }

  return rests
}

function fillMeasure(
  beatsPerMeasure: number,
  opts: GeneratorOptions,
  rng: () => number
): GeneratedNote[] {
  const notes: GeneratedNote[] = []
  let remaining = r16(beatsPerMeasure)
  const beatTypeFactor = 4 / opts.timeSignature.beatType
  const beatUnit = beatTypeFactor  // one beat in our system

  // Build valid note/rest durations
  const effectivePool = [...opts.notePool]
  if (opts.allowDots) {
    const complementMap: Record<string, NoteValue> = {
      whole: 'half', half: 'quarter', quarter: 'eighth', eighth: 'sixteenth'
    }
    opts.notePool.forEach(nv => {
      const comp = complementMap[nv] as NoteValue | undefined
      if (comp && !effectivePool.includes(comp)) effectivePool.push(comp)
    })
  }

  const validDurations: { type: NoteValue; beats: number; dot: boolean }[] = []
  for (const nv of effectivePool) {
    const b = r16(NOTE_BEATS[nv] * beatTypeFactor)
    validDurations.push({ type: nv, beats: b, dot: false })
    const allowedDotPool = (opts.dotPool && opts.dotPool.length > 0) ? opts.dotPool : opts.notePool
    if (opts.allowDots && allowedDotPool.includes(nv)) {
      const bd = r16(b * 1.5)
      validDurations.push({ type: nv, beats: bd, dot: true })
    }
  }

  // Rest pool: always include ALL standard durations so rests can properly fill beats
  // This is independent of the note pool — rests have their own notation rules
  const ALL_NOTE_VALUES: NoteValue[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth']
  const restDurations: { type: NoteValue; beats: number; dot: boolean }[] = []
  for (const nv of ALL_NOTE_VALUES) {
    const b = r16(NOTE_BEATS[nv] * beatTypeFactor)
    if (b > r16(beatsPerMeasure) + 0.001) continue  // skip if larger than measure
    restDurations.push({ type: nv, beats: b, dot: false })
    if (opts.allowDots) {
      restDurations.push({ type: nv, beats: r16(b * 1.5), dot: true })
    }
  }

  let safetyCounter = 0
  while (remaining > 0.001 && safetyCounter++ < 128) {
    const currentPos = r16(beatsPerMeasure - remaining)

    // Find notes that fit
    const fitting = validDurations.filter(d => {
      if (d.beats > r16(remaining) + 0.001) return false
      const rem = r16(remaining - d.beats)

      // Dotted notes: only if starting on a beat and don't cross a strong midpoint
      if (d.dot) {
        const onBeat = Math.abs(currentPos % beatUnit) < 0.001
        if (!onBeat) return false
        // Check the note doesn't cross any beat boundary (unless ties handle it)
        // For generator simplicity: allow dotted notes but they'll be tied if crossing
        // Actually for cleanliness: reject if crossing boundary and no tie opt
        const crossings = beatBoundariesCrossed(currentPos, d.beats, beatUnit)
        if (crossings.length > 0 && !opts.allowTies) return false
      }

      if (rem < 0.001) return true
      const smallestNonDot = validDurations
        .filter(d2 => !d2.dot)
        .reduce((min, d2) => d2.beats < min ? d2.beats : min, Infinity)
      return smallestNonDot <= r16(rem) + 0.001
    })

    if (fitting.length === 0) {
      const fallback = effectivePool
        .map(nv => ({ type: nv, beats: r16(NOTE_BEATS[nv] * beatTypeFactor), dot: false }))
        .filter(d => d.beats <= r16(remaining) + 0.001)
        .sort((a, b) => b.beats - a.beats)[0]
      if (!fallback) break
      const pieces = splitAtBeatBoundaries(fallback.type, false, false, fallback.beats, currentPos, beatUnit, validDurations)
      notes.push(...pieces)
      remaining = r16(remaining - fallback.beats)
      continue
    }

    const dottedPool = fitting.filter(d => d.dot)
    const plainPool = fitting.filter(d => !d.dot)
    const useDot = opts.allowDots && dottedPool.length > 0 && rng() < opts.dotProbability
    const pool = useDot ? dottedPool : (plainPool.length > 0 ? plainPool : fitting)
    const chosen = pickRandom(pool, rng)

    const isRest = opts.allowRests && rng() < opts.restProbability && notes.length > 0

    if (isRest) {
      // Build properly notated rests that respect beat boundaries
      const restPieces = buildRests(chosen.beats, currentPos, beatUnit, restDurations, opts.allowDots)
      notes.push(...restPieces)
    } else {
      // Check if note crosses a beat boundary — if so, split with ties
      const crossings = beatBoundariesCrossed(currentPos, chosen.beats, beatUnit)
      if (crossings.length > 0 && opts.allowTies) {
        const pieces = splitAtBeatBoundaries(chosen.type, false, chosen.dot, chosen.beats, currentPos, beatUnit, validDurations)
        notes.push(...pieces)
      } else {
        notes.push({
          type: chosen.type,
          rest: false,
          dot: chosen.dot,
          tieStart: false,
          tieStop: false,
          tuplet: null,
          durationBeats: chosen.beats,
        })
      }
    }

    remaining = r16(remaining - chosen.beats)
  }

  return notes
}

function applyTies(notes: GeneratedNote[], opts: GeneratorOptions, rng: () => number): GeneratedNote[] {
  if (!opts.allowTies) return notes
  for (let i = 0; i < notes.length - 1; i++) {
    if (!notes[i].rest && !notes[i+1].rest && !notes[i].tieStart && !notes[i+1].tieStop && rng() < opts.tieProbability) {
      notes[i].tieStart = true
      notes[i+1].tieStop = true
    }
  }
  return notes
}

export function generateExercise(opts: GeneratorOptions): GeneratedExercise {
  const rng = makeRng(opts.seed ?? Math.floor(Math.random() * 999999))
  const beatsPerMeasure = opts.timeSignature.beats * (4 / opts.timeSignature.beatType)

  const measures: GeneratedMeasure[] = Array.from({ length: opts.measures }, () => ({
    notes: fillMeasure(beatsPerMeasure, opts, rng)
  }))

  return {
    title: '',
    timeSignature: opts.timeSignature,
    measures,
    hands: opts.hands,
  }
}

const DIVISIONS = 16  // divisions per quarter note

function noteDivisions(note: GeneratedNote, beatType: number): number {
  const quarterBeats = note.durationBeats * (beatType / 4)
  return Math.round(quarterBeats * DIVISIONS)
}

function noteTypeXml(type: NoteValue): string {
  return type
}

export function generateMusicXML(ex: GeneratedExercise, title: string): string {
  const { beats, beatType } = ex.timeSignature
  const fifths = 0  // C major / no key sig for rhythm exercises

  const measuresXml = ex.measures.map((m, mIdx) => {
    const notesXml = m.notes.map(n => {
      const div = noteDivisions(n, beatType)
      const tieStart = n.tieStart ? '<tie type="start"/>' : ''
      const tieStop = n.tieStop ? '<tie type="stop"/>' : ''
      const tieNotations = [
        n.tieStop ? '<tied type="stop"/>' : '',
        n.tieStart ? '<tied type="start"/>' : '',
      ].filter(Boolean).join('')
      const notations = tieNotations ? `<notations>${tieNotations}</notations>` : ''
      const dot = n.dot ? '<dot/>' : ''

      if (n.rest) {
        return `
      <note>
        <rest/>
        <duration>${div}</duration>
        <voice>1</voice>
        <type>${noteTypeXml(n.type)}</type>
        ${dot}
      </note>`
      }

      return `
      <note>
        <unpitched>
          <display-step>E</display-step>
          <display-octave>4</display-octave>
        </unpitched>
        <duration>${div}</duration>
        ${tieStop}${tieStart}
        <voice>1</voice>
        <type>${noteTypeXml(n.type)}</type>
        ${dot}
        <stem>up</stem>
        ${notations}
      </note>`
    }).join('')

    const attributes = mIdx === 0 ? `
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key><fifths>${fifths}</fifths></key>
        <time>
          <beats>${beats}</beats>
          <beat-type>${beatType}</beat-type>
        </time>
        <clef><sign>percussion</sign></clef>
        <staff-details><staff-lines>1</staff-lines></staff-details>
      </attributes>` : ''

    const finalBarline = mIdx === ex.measures.length - 1
      ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>'
      : ''

    return `
    <measure number="${mIdx + 1}">
      ${attributes}
      ${notesXml}
      ${finalBarline}
    </measure>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${title}</work-title></work>
  <identification>
    <encoding>
      <software>NoteLab Rhythm Generator</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Rhythm</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    ${measuresXml}
  </part>
</score-partwise>`
}

// Convert MusicXML string to MXL (zipped) ArrayBuffer
export async function xmlToMxlBuffer(xmlString: string): Promise<ArrayBuffer> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml"/>
  </rootfiles>
</container>`)
  zip.file('score.xml', xmlString)
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
}

