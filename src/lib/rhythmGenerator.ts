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
  dotPool?: NoteValue[]           // which note values can be dotted (default: all in notePool)
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
  // When dots are enabled, automatically include complement notes for filling
  // e.g. dotted quarter needs eighth to fill; dotted half needs quarter (already in pool)
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
    const b = Math.round(NOTE_BEATS[nv] * beatTypeFactor * 16) / 16
    // Only add dotted version for notes in dotPool (or original pool if dotPool not set)
    const allowedDotPool = opts.dotPool ?? opts.notePool
    const inOriginalPool = allowedDotPool.includes(nv)
    validDurations.push({ type: nv, beats: b, dot: false })
    if (opts.allowDots && inOriginalPool) {
      const bd = Math.round(b * 1.5 * 16) / 16
      validDurations.push({ type: nv, beats: bd, dot: true })
    }
  }

  let safetyCounter = 0
  while (remaining > 0.001 && safetyCounter++ < 64) {
    // Current beat position within the measure
    const currentBeatPos = Math.round((beatsPerMeasure - remaining) * 16) / 16
    const beatUnit = beatTypeFactor

    const fitting = validDurations.filter(d => {
      if (d.beats > remaining + 0.001) return false
      const rem = Math.round((remaining - d.beats) * 16) / 16

      // For dotted notes: check they don't obscure a main beat
      if (d.dot) {
        const noteEnd = Math.round((currentBeatPos + d.beats) * 16) / 16
        const onMainBeat = Math.abs(currentBeatPos % beatUnit) < 0.001
        if (!onMainBeat) {
          // Not starting on a main beat — reject dotted note
          // (too complex to handle correctly without ties)
          return false
        }
        // Starting on a main beat — dotted note is OK only if the dot remainder
        // (half the undotted value) can be filled by a note in the pool
        const undottedBeats = Math.round(d.beats / 1.5 * 16) / 16
        const dotRemainder = Math.round(undottedBeats * 0.5 * 16) / 16
        const canFillDotRemainder = validDurations.some(d2 => !d2.dot && Math.abs(d2.beats - dotRemainder) < 0.001)
        if (!canFillDotRemainder) return false
      }

      // If starting off-beat, note must not cross the next beat boundary
      const offBeat = Math.abs(Math.round(currentBeatPos % beatUnit * 16) / 16) > 0.001
      if (offBeat) {
        const nextBeat = Math.round(Math.ceil(Math.round(currentBeatPos / beatUnit * 16) / 16 + 0.001) * beatUnit * 16) / 16
        const spaceToNextBeat = Math.round((nextBeat - currentBeatPos) * 16) / 16
        if (d.beats > spaceToNextBeat + 0.001) return false
      }

      if (rem < 0.001) return true  // fills exactly
      const smallestNonDot = validDurations
        .filter(d2 => !d2.dot)
        .reduce((min, d2) => d2.beats < min ? d2.beats : min, Infinity)
      return smallestNonDot <= rem + 0.001
    })

    if (fitting.length === 0) {
      // Fallback: use smallest non-dotted note that fits
      const fallback = effectivePool
        .map(nv => ({ type: nv, beats: Math.round(NOTE_BEATS[nv] * beatTypeFactor * 16) / 16, dot: false }))
        .filter(d => d.beats <= remaining + 0.001)
        .sort((a, b) => b.beats - a.beats)[0]
      if (!fallback) break
      notes.push({ type: fallback.type, rest: false, dot: false, tieStart: false, tieStop: false, tuplet: null, durationBeats: fallback.beats })
      remaining = Math.round((remaining - fallback.beats) * 16) / 16
      continue
    }


    // Separate dotted and plain pools
    const dottedPool = fitting.filter(d => d.dot)
    const plainPool = fitting.filter(d => !d.dot)

    // Use dotted if allowed, probability fires, and dotted options exist
    const useDot = opts.allowDots && dottedPool.length > 0 && rng() < opts.dotProbability
    const pool = useDot ? dottedPool : (plainPool.length > 0 ? plainPool : fitting)

    const chosen = pickRandom(pool, rng)
    const isRest = opts.allowRests && rng() < opts.restProbability && notes.length > 0

    const noteCountBefore = notes.length
    if (isRest) {
      // Replace with properly-sized rest(s) that don't cross beat boundaries
      const NOTE_ORDER: NoteValue[] = ['whole','half','quarter','eighth','sixteenth']
      const RBEATS: Record<NoteValue,number> = {whole:4,half:2,quarter:1,eighth:0.5,sixteenth:0.25}
      let restRemaining = chosen.beats
      let restPos = Math.round((beatsPerMeasure - remaining) * 16) / 16
      // Consolidate: if starting on a beat, use largest single rest that fills complete beats
      {
        const onBeat = Math.abs(Math.round(restPos % beatTypeFactor * 16) / 16) < 0.001
        if (onBeat && restRemaining >= beatTypeFactor - 0.001) {
          const completeBeats = Math.floor(Math.round(restRemaining / beatTypeFactor * 16) / 16)
          const totalW = Math.round(completeBeats * beatTypeFactor * 16) / 16
          const nv = NOTE_ORDER.find(n => Math.abs(Math.round(RBEATS[n] * beatTypeFactor * 16) / 16 - totalW) < 0.001)
          if (nv) {
            notes.push({ type: nv, rest: true, dot: false, tieStart: false, tieStop: false, tuplet: null, durationBeats: totalW })
            restRemaining = Math.round((restRemaining - totalW) * 16) / 16
            restPos = Math.round((restPos + totalW) * 16) / 16
          }
        }
      }
      while (restRemaining > 0.001) {
        // Space from current position to next beat boundary
        const nextBeat = Math.round(Math.ceil(Math.round(restPos / beatTypeFactor * 16) / 16 + 0.001) * beatTypeFactor * 16) / 16
        const spaceToNextBeat = Math.round((nextBeat - restPos) * 16) / 16
        // Max fill = space to next beat (never cross beat boundary)
        // If exactly on a beat, fill up to beatTypeFactor
        const maxFill = spaceToNextBeat > 0.001
          ? Math.round(Math.min(restRemaining, spaceToNextBeat) * 16) / 16
          : Math.round(Math.min(restRemaining, beatTypeFactor) * 16) / 16
        // Find largest rest <= maxFill (prefer dotted if on beat)
        let bestBeats = Math.round(RBEATS['sixteenth'] * beatTypeFactor * 16) / 16
        let bestType: NoteValue = 'sixteenth'
        let bestDot = false
        const onBeat = Math.abs(Math.round(restPos % beatTypeFactor * 16) / 16) < 0.001
        for (const nv of NOTE_ORDER) {
          const b = Math.round(RBEATS[nv] * beatTypeFactor * 16) / 16
          if (b <= maxFill + 0.001 && b > bestBeats) { bestBeats = b; bestType = nv; bestDot = false }
          // Dotted rests only on beat positions
          if (opts.allowDots && onBeat) {
            const bd = Math.round(b * 1.5 * 16) / 16
            if (bd <= maxFill + 0.001 && bd > bestBeats) { bestBeats = bd; bestType = nv; bestDot = true }
          }
        }
        notes.push({ type: bestType, rest: true, dot: bestDot, tieStart: false, tieStop: false, tuplet: null, durationBeats: bestBeats })
        restRemaining = Math.round((restRemaining - bestBeats) * 16) / 16
        restPos = Math.round((restPos + bestBeats) * 16) / 16
      }
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
    // Decrement by what was actually placed
    if (isRest) {
      const actualRestBeats = notes.slice(noteCountBefore).reduce((s, n) => s + n.durationBeats, 0)
      remaining = Math.round((remaining - actualRestBeats) * 16) / 16
    } else {
      remaining = Math.round((remaining - chosen.beats) * 16) / 16
    }
  }

  return applyTies(enforceBeatBoundaries(notes, beatTypeFactor), opts, rng)
}

// Validate that no note crosses a beat boundary
// If it does, split it at the boundary
function enforceBeatBoundaries(
  notes: GeneratedNote[],
  beatUnit: number
): GeneratedNote[] {
  const NOTE_ORDER: NoteValue[] = ['whole','half','quarter','eighth','sixteenth']
  const BEATS: Record<NoteValue,number> = {whole:4,half:2,quarter:1,eighth:0.5,sixteenth:0.25}
  
  function r16(n: number) { return Math.round(n * 16) / 16 }
  
  function findType(beats: number, btf: number): [NoteValue, boolean] {
    for (const nv of NOTE_ORDER) {
      if (Math.abs(BEATS[nv] * btf - beats) < 0.001) return [nv, false]
      if (Math.abs(BEATS[nv] * btf * 1.5 - beats) < 0.001) return [nv, true]
    }
    return ['sixteenth', false]
  }

  const result: GeneratedNote[] = []
  let pos = 0

  for (const note of notes) {
    const end = r16(pos + note.durationBeats)
    const nextBeat = r16(Math.ceil(r16(pos / beatUnit) + 0.001) * beatUnit)
    
    // Does this note cross a beat boundary?
    if (!note.rest && nextBeat < end - 0.001 && r16(pos % beatUnit) > 0.001) {
      // Split at beat boundary
      const piece1 = r16(nextBeat - pos)
      const piece2 = r16(note.durationBeats - piece1)
      const [t1, d1] = findType(piece1, 1)
      const [t2, d2] = findType(piece2, 1)
      result.push({ ...note, type: t1, dot: d1, durationBeats: piece1, tieStart: true, tieStop: note.tieStop })
      result.push({ ...note, type: t2, dot: d2, durationBeats: piece2, tieStart: false, tieStop: true })
    } else {
      result.push(note)
    }
    pos = r16(pos + note.durationBeats)
  }

  return result
}

function mergeConsecutiveRests(
  notes: GeneratedNote[],
  beatUnit: number
): GeneratedNote[] {
  function r16(n: number) { return Math.round(n * 16) / 16 }
  const BEATS: Record<NoteValue, number> = {whole:4,half:2,quarter:1,eighth:0.5,sixteenth:0.25}
  const NOTE_ORDER: NoteValue[] = ['whole','half','quarter','eighth','sixteenth']

  function findRestType(beats: number): [NoteValue, boolean] {
    for (const nv of NOTE_ORDER) {
      if (Math.abs(BEATS[nv] - beats) < 0.001) return [nv, false]
      if (Math.abs(BEATS[nv] * 1.5 - beats) < 0.001) return [nv, true]
    }
    return ['sixteenth', false]
  }

  const result: GeneratedNote[] = []
  let pos = 0
  let i = 0

  while (i < notes.length) {
    const note = notes[i]
    if (!note.rest) {
      result.push(note)
      pos = r16(pos + note.durationBeats)
      i++
      continue
    }

    // Accumulate consecutive rests within the same beat
    const beatStart = r16(Math.floor(r16(pos / beatUnit)) * beatUnit)
    const beatEnd = r16(beatStart + beatUnit)
    let totalRest = 0
    let j = i

    while (j < notes.length && notes[j].rest) {
      const endPos = r16(pos + totalRest + notes[j].durationBeats)
      if (endPos > beatEnd + 0.001) break  // would cross beat boundary
      totalRest = r16(totalRest + notes[j].durationBeats)
      j++
    }

    if (j > i + 1) {
      // Multiple consecutive rests in same beat — merge into largest possible
      const [type, dot] = findRestType(totalRest)
      result.push({ ...note, type, dot, durationBeats: totalRest })
    } else {
      result.push(note)
    }

    pos = r16(pos + totalRest || note.durationBeats)
    i = j > i + 1 ? j : i + 1
  }

  return result
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

  measures.forEach((m, i) => {
    const sum = m.notes.reduce((acc, n) => acc + n.durationBeats, 0)
    const expected = opts.timeSignature.beats * (4 / opts.timeSignature.beatType)
    if (Math.abs(sum - expected) > 0.01) console.error(`Measure ${i+1}: WRONG sum=${sum.toFixed(3)} expected=${expected}`, m.notes.map(n => `${n.rest?'R':''}${n.dot?'d':''}${n.type}(${n.durationBeats})`).join(' '))
  })
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
