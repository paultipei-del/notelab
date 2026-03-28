// ── Rhythm Generator ──────────────────────────────────────────────────────────
// Generates musically valid rhythms as RhythmExercise objects
// and exports them as MusicXML strings

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export type TupletType = 'triplet' | 'quintuplet' | null

export interface GeneratorOptions {
  timeSignature: { beats: number; beatType: number }
  measures: number
  notePool: NoteValue[]          // which note values to use
  allowRests: boolean
  restProbability: number        // 0-1, how often rests appear
  allowDots: boolean
  dotProbability: number         // 0-1
  allowTies: boolean
  tieProbability: number         // 0-1
  allowTuplets: boolean
  tupletType: TupletType
  hands: 1 | 2                  // single line or grand staff
  seed?: number                 // for reproducibility
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

// Note duration in quarter note beats
const NOTE_BEATS: Record<NoteValue, number> = {
  whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25
}

// Simple seeded random
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

function fillMeasure(
  beatsPerMeasure: number,
  opts: GeneratorOptions,
  rng: () => number
): GeneratedNote[] {
  const notes: GeneratedNote[] = []
  let remaining = Math.round(beatsPerMeasure * 16) / 16  // work in 16ths to avoid float errors
  const beatTypeFactor = 4 / opts.timeSignature.beatType

  // Build valid note durations in beats (quarter = 1 beat unit)
  const validDurations: { type: NoteValue; beats: number; dot: boolean }[] = []
  for (const nv of opts.notePool) {
    const b = Math.round(NOTE_BEATS[nv] * beatTypeFactor * 16) / 16
    validDurations.push({ type: nv, beats: b, dot: false })
    if (opts.allowDots) {
      const bd = Math.round(b * 1.5 * 16) / 16
      validDurations.push({ type: nv, beats: bd, dot: true })
    }
  }

  let safetyCounter = 0
  while (remaining > 0.001 && safetyCounter++ < 64) {
    // Filter to only durations that fit exactly or leave a fillable remainder
    const fitting = validDurations.filter(d => {
      if (d.beats > remaining + 0.001) return false
      const rem = Math.round((remaining - d.beats) * 16) / 16
      if (rem < 0.001) return true  // fills exactly
      // Check remainder can be filled by at least one note in pool
      return validDurations.some(d2 => !d2.dot && d2.beats <= rem + 0.001)
    })

    if (fitting.length === 0) {
      // Fallback: use smallest non-dotted note that fits
      const fallback = opts.notePool
        .map(nv => ({ type: nv, beats: Math.round(NOTE_BEATS[nv] * beatTypeFactor * 16) / 16, dot: false }))
        .filter(d => d.beats <= remaining + 0.001)
        .sort((a, b) => b.beats - a.beats)[0]
      if (!fallback) break
      notes.push({ type: fallback.type, rest: false, dot: false, tieStart: false, tieStop: false, tuplet: null, durationBeats: fallback.beats })
      remaining = Math.round((remaining - fallback.beats) * 16) / 16
      continue
    }

    // Prefer non-dotted unless dot probability fires
    const useDot = opts.allowDots && rng() < opts.dotProbability
    const pool = fitting.filter(d => d.dot === useDot).length > 0
      ? fitting.filter(d => d.dot === useDot)
      : fitting.filter(d => !d.dot)

    const chosen = pickRandom(pool.length > 0 ? pool : fitting, rng)
    const isRest = opts.allowRests && rng() < opts.restProbability && notes.length > 0

    notes.push({
      type: chosen.type,
      rest: isRest,
      dot: chosen.dot,
      tieStart: false,
      tieStop: false,
      tuplet: null,
      durationBeats: chosen.beats,
    })
    remaining = Math.round((remaining - chosen.beats) * 16) / 16
  }

  // ── Notation convention: rewrite beats that cross beat boundaries ──────────
  // In simple meter, beats must be clearly visible
  // e.g. dotted quarter starting on beat 2 in 4/4 crosses beat 3 — rewrite as
  // dotted quarter + eighth tied to next note
  if (opts.timeSignature.beatType === 4 || opts.timeSignature.beatType === 2) {
    const beatUnit = beatTypeFactor  // 1 beat in quarter-note units
    const rewritten: GeneratedNote[] = []
    let pos = 0

    for (const note of notes) {
      if (note.rest || !note.dot) {
        rewritten.push(note)
        pos = Math.round((pos + note.durationBeats) * 16) / 16
        continue
      }

      // Check if dotted note crosses a beat boundary
      const noteEnd = Math.round((pos + note.durationBeats) * 16) / 16
      const nextBeat = Math.ceil(pos / beatUnit + 0.001) * beatUnit
      const crossesBeat = nextBeat < noteEnd - 0.001

      if (!crossesBeat) {
        rewritten.push(note)
        pos = noteEnd
        continue
      }

      // Split: undotted note + tied remainder
      const undottedBeats = Math.round(note.durationBeats / 1.5 * 16) / 16
      const remainderBeats = Math.round((note.durationBeats - undottedBeats) * 16) / 16

      // Find type for remainder
      const remType = opts.notePool.find(nv =>
        Math.abs(NOTE_BEATS[nv] * beatTypeFactor - remainderBeats) < 0.01
      ) ?? note.type

      rewritten.push({
        ...note,
        dot: false,
        durationBeats: undottedBeats,
        tieStart: true,
      })
      rewritten.push({
        type: remType,
        rest: false,
        dot: false,
        tieStart: false,
        tieStop: true,
        tuplet: null,
        durationBeats: remainderBeats,
      })
      pos = noteEnd
    }

    return applyTies(rewritten, opts, rng)
  }

  return applyTies(notes, opts, rng)
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

  return { title: '', timeSignature: opts.timeSignature, measures, hands: opts.hands }
}

// ── MusicXML export ───────────────────────────────────────────────────────────
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
