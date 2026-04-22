import JSZip from 'jszip'

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

export interface RhythmNote {
  type: NoteValue
  rest: boolean
  dot: boolean
  tieStart: boolean
  tieStop: boolean
  durationBeats: number  // in quarter note units
  staff: number          // 1 for treble, 2 for bass on a grand staff; 1 when unspecified
}

export interface RhythmMeasure {
  notes: RhythmNote[]
}

export interface RhythmExercise {
  title: string
  timeSignature: { beats: number; beatType: number }
  hands: 1 | 2
  measures: RhythmMeasure[]
}

const DURATION_MAP: Record<string, number> = {
  whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25,
}

function normalizeNoteType(raw: string): NoteValue {
  // MusicXML commonly uses "8th" / "16th" strings.
  if (raw === '8th') return 'eighth'
  if (raw === '16th') return 'sixteenth'
  // Fall back to expected NoteValue literals.
  return (raw as NoteValue) ?? 'quarter'
}

function inferNoteTypeFromDuration(durationBeats: number, dot: boolean): NoteValue {
  // durationBeats is in quarter-note units.
  // If dotted, normalize back to the base note value.
  const base = dot ? durationBeats / 1.5 : durationBeats
  const candidates: { type: NoteValue; beats: number }[] = [
    { type: 'whole', beats: 4 },
    { type: 'half', beats: 2 },
    { type: 'quarter', beats: 1 },
    { type: 'eighth', beats: 0.5 },
    { type: 'sixteenth', beats: 0.25 },
  ]
  let best = candidates[2] // quarter
  let bestDist = Infinity
  for (const c of candidates) {
    const dist = Math.abs(c.beats - base)
    if (dist < bestDist) { best = c; bestDist = dist }
  }
  return best.type
}

export async function parseMXL(buffer: ArrayBuffer): Promise<RhythmExercise> {
  const zip = await JSZip.loadAsync(buffer)
  
  // Find the score XML
  const container = await zip.file('META-INF/container.xml')!.async('text')
  const rootfileMatch = container.match(/full-path="([^"]+)"/)
  const scorePath = rootfileMatch ? rootfileMatch[1] : 'score.xml'
  
  const scoreXml = await zip.file(scorePath)!.async('text')
  const parser = new DOMParser()
  const doc = parser.parseFromString(scoreXml, 'text/xml')

  const title = doc.querySelector('work-title')?.textContent || 'Untitled'
  const beats = parseInt(doc.querySelector('beats')?.textContent || '4')
  const beatType = parseInt(doc.querySelector('beat-type')?.textContent || '4')
  const divisions = parseInt(doc.querySelector('divisions')?.textContent || '1')
  
  // Count staves to determine hands
  const staves = doc.querySelectorAll('staves')
  const hands = staves.length > 0 ? Math.min(parseInt(staves[0].textContent || '1'), 2) as 1 | 2 : 1

  const measures: RhythmMeasure[] = []
  
  doc.querySelectorAll('measure').forEach(measure => {
    const notes: RhythmNote[] = []
    measure.querySelectorAll('note').forEach(note => {
      const rawType = note.querySelector('type')?.textContent || ''
      const duration = parseInt(note.querySelector('duration')?.textContent || '1')
      const rest = !!note.querySelector('rest')
      const dot = !!note.querySelector('dot')
      const ties = Array.from(note.querySelectorAll('tie'))
      const tieStart = ties.some(t => t.getAttribute('type') === 'start')
      const tieStop = ties.some(t => t.getAttribute('type') === 'stop')
      const durationBeats = (duration / divisions) * (4 / beatType)
      const normalizedType = rawType ? normalizeNoteType(rawType) : 'quarter'
      // Some sources omit or mislabel <type>. Use duration as a fallback to keep rendering correct (e.g. 16th beams).
      const type: NoteValue = (rawType && DURATION_MAP[normalizedType] !== undefined)
        ? normalizedType
        : inferNoteTypeFromDuration(durationBeats, dot)
      const staff = parseInt(note.querySelector('staff')?.textContent || '1')
      notes.push({ type, rest, dot, tieStart, tieStop, durationBeats, staff })
    })
    if (notes.length > 0) measures.push({ notes })
  })

  return { title, timeSignature: { beats, beatType }, hands, measures }
}
