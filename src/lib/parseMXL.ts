import JSZip from 'jszip'

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

export interface RhythmNote {
  type: NoteValue
  rest: boolean
  dot: boolean
  tieStart: boolean
  tieStop: boolean
  durationBeats: number  // in quarter note units
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
      const type = (note.querySelector('type')?.textContent || 'quarter') as NoteValue
      const duration = parseInt(note.querySelector('duration')?.textContent || '1')
      const rest = !!note.querySelector('rest')
      const dot = !!note.querySelector('dot')
      const ties = Array.from(note.querySelectorAll('tie'))
      const tieStart = ties.some(t => t.getAttribute('type') === 'start')
      const tieStop = ties.some(t => t.getAttribute('type') === 'stop')
      const durationBeats = (duration / divisions) * (4 / beatType)
      notes.push({ type, rest, dot, tieStart, tieStop, durationBeats })
    })
    if (notes.length > 0) measures.push({ notes })
  })

  return { title, timeSignature: { beats, beatType }, hands, measures }
}
