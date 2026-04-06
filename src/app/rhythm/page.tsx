'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RhythmExercise, RhythmNote } from '@/lib/parseMXL'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const BRAVURA = {
  quarterRest:  String.fromCodePoint(0xE4E5),
  halfRest:     String.fromCodePoint(0xE4E4),
  wholeRest:    String.fromCodePoint(0xE4E3),
  eighthRest:   String.fromCodePoint(0xE4E6),
  sixteenthRest:String.fromCodePoint(0xE4E7),
}

const STAFF_Y = 52
const STEM_H = 36

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#E1F5EE', 2: '#E8EEF9', 3: '#FEF3E2', 4: '#F9EEE8', 5: '#F3E8F9'
}
const DIFFICULTY_TEXT: Record<number, string> = {
  1: '#0F6E56', 2: '#3A5A9B', 3: '#BA7517', 4: '#8A4A1A', 5: '#7A3A9B'
}
const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert'
}

function buildLayout(exercise: RhythmExercise, svgW: number, rowMeasures: typeof exercise.measures) {
  const beatsPerMeasure = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)  // in quarter note units
  const allNotes = rowMeasures.flatMap(m => m.notes)
  const smallestDuration = allNotes.reduce((min, n) => Math.min(min, n.durationBeats), 1)
  const MIN_SLOT_W = 32
  const slotsPerMeasure = beatsPerMeasure / smallestDuration
  const minMeasureW = slotsPerMeasure * MIN_SLOT_W
  const usableW = svgW - 96
  const naturalMeasureW = usableW / rowMeasures.length
  const measureW = Math.max(naturalMeasureW, minMeasureW)
  const noteW = measureW / beatsPerMeasure
  return { measureW, noteW, beatsPerMeasure }
}

// Bravura note glyphs (SMuFL U+E1D0 range)
const BRAVURA_NOTE: Record<string, string> = {
  whole:     String.fromCodePoint(0xE1D2),  // noteWhole
  half:      String.fromCodePoint(0xE1D3),  // noteHalfUp
  quarter:   String.fromCodePoint(0xE1D5),  // noteQuarterUp
  eighth:    String.fromCodePoint(0xE1D7),  // note8thUp
  sixteenth: String.fromCodePoint(0xE1D9),  // note16thUp
}
const BRAVURA_NOTE_SIZE = 44  // font-size for note glyphs

function BravuraNote({ x, y, type, color }: { x: number; y: number; type: string; color: string }) {
  const glyph = BRAVURA_NOTE[type] ?? BRAVURA_NOTE.quarter
  return (
    <text
      x={x} y={y}
      fontSize={BRAVURA_NOTE_SIZE}
      fontFamily="Bravura, serif"
      fill={color}
      textAnchor="middle"
      dominantBaseline="auto"
    >{glyph}</text>
  )
}

function RestSymbol({ x, type, dot }: { x: number; type: string; dot?: boolean }) {
  const glyph =
    type === 'whole'      ? BRAVURA.wholeRest :
    type === 'half'       ? BRAVURA.halfRest :
    type === 'eighth'     ? BRAVURA.eighthRest :
    type === 'sixteenth'  ? BRAVURA.sixteenthRest :
    BRAVURA.quarterRest
  // Position rests centered on the staff line
  // whole/half rests sit above/below the line; quarter/eighth/sixteenth centered
  const y =
    type === 'whole'      ? STAFF_Y :
    type === 'half'       ? STAFF_Y - 0.5 :
    STAFF_Y
  return <g>
    <text x={x} y={y} fontSize={44} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">{glyph}</text>
    {dot && <circle cx={x + 14} cy={y - 4} r={2.5} fill="#1A1A18" />}
  </g>
}

function Dot({ x, color }: { x: number; color: string }) {
  return <circle cx={x + 10} cy={STAFF_Y - 3} r={2} fill={color} />
}

function TieCurve({ x1, x2 }: { x1: number; x2: number }) {
  const y = STAFF_Y + 10
  const h = Math.min(8, Math.max(4, (x2 - x1) * 0.12))
  const cp1x = x1 + (x2-x1)*0.25; const cp2x = x2 - (x2-x1)*0.25
  const outer = `M ${x1} ${y} C ${cp1x} ${y+h} ${cp2x} ${y+h} ${x2} ${y}`
  const inner = `C ${cp2x} ${y+h-2} ${cp1x} ${y+h-2} ${x1} ${y}`
  return <path d={outer + ' ' + inner + ' Z'} fill="#1A1A18" opacity={0.85} />
}



// Bravura text-style note glyphs for beaming (E1F0 range)
const B = {
  blackShort:   String.fromCodePoint(0xE1F0),  // black note short stem
  blackLong:    String.fromCodePoint(0xE1F1),  // black note long stem
  frac8Short:   String.fromCodePoint(0xE1F2),  // frac 8th beam short stem
  frac8Long:    String.fromCodePoint(0xE1F3),  // frac 8th beam long stem
  frac16Short:  String.fromCodePoint(0xE1F4),  // frac 16th beam short stem
  frac16Long:   String.fromCodePoint(0xE1F5),  // frac 16th beam long stem
  cont8Short:   String.fromCodePoint(0xE1F7),  // continuing 8th beam short stem
  cont8Long:    String.fromCodePoint(0xE1F8),  // continuing 8th beam long stem
  cont16Short:  String.fromCodePoint(0xE1F9),  // continuing 16th beam short stem
  cont16Long:   String.fromCodePoint(0xE1FA),  // continuing 16th beam long stem
  dot:          String.fromCodePoint(0xE1FC),  // augmentation dot
}
const BEAM_FONT_SIZE = 44

// ── Beaming ───────────────────────────────────────────────────────────────────
// Group consecutive beamable notes (eighth, sixteenth) within each beat
interface BeamGroup {
  noteIndices: number[]
  xs: number[]
  type: 'eighth' | 'sixteenth'
}

function computeBeamGroups(
  notes: RhythmNote[], mx: number, noteW: number, beatsPerMeasure: number
): BeamGroup[] {
  const groups: BeamGroup[] = []
  let i = 0
  let beatPos = 0

  while (i < notes.length) {
    const note = notes[i]
    const isBeamable = (note.type === 'eighth' || note.type === 'sixteenth') && !note.rest

    if (!isBeamable) {
      beatPos += note.durationBeats
      i++
      continue
    }

    // Collect consecutive beamable notes within the same beat group
    const beatStart = Math.floor(beatPos + 0.001)
    const beatEnd = beatStart + 1
    const group: number[] = []
    const xs: number[] = []
    let pos = beatPos
    let j = i

    while (j < notes.length) {
      const n = notes[j]
      const isB = (n.type === 'eighth' || n.type === 'sixteenth') && !n.rest
      if (!isB) break
      // Don't cross beat boundary
      if (pos >= beatEnd - 0.001 && group.length > 0) break
      group.push(j)
      xs.push(mx + pos * noteW + n.durationBeats * noteW * 0.5)
      pos += n.durationBeats
      j++
    }

    if (group.length >= 2) {
      // Determine beam type — use finest subdivision in group
      const hasEighth = group.some(idx => notes[idx].type === 'eighth')
      groups.push({ noteIndices: group, xs, type: hasEighth ? 'eighth' : 'sixteenth' })
      beatPos = pos
      i = j
    } else {
      beatPos += note.durationBeats
      i++
    }
  }
  return groups
}

function BeamBar({ x1, x2, y, thickness = 5 }: { x1: number; x2: number; y: number; thickness?: number }) {
  return <rect x={x1 - 1} y={y - thickness} width={x2 - x1 + 2} height={thickness} fill="#1A1A18" rx={1} />
}

const STEM_TOP = STAFF_Y - STEM_H  // y coordinate of stem tops
const BEAM_GAP = 6  // gap between double beams

function renderMeasure(
  notes: RhythmNote[], mx: number, noteW: number,
  tapResult: ('hit'|'miss'|'none')[],
  beatsPerMeasure: number,
  beatUnit: number = 1
) {
  const els: React.ReactElement[] = []

  // ── Pre-compute beam groups ───────────────────────────────────────────────
  // Rules:
  // 1. Beam within a single beat only (beat = 1 quarter note in simple time)
  // 2. Never beam across the midpoint of the measure (e.g. beats 2-3 in 4/4)
  // 3. 16th notes group in groups of 4 (one beat), 8ths in groups of 2 or 4
  // 4. Dotted 8th + 16th beam together as one beat unit
  // 5. Rests do NOT break a beam group if within the same beat

  interface NoteInfo { idx: number; beatPos: number; x: number }
  const noteInfos: NoteInfo[] = []
  let bp = 0
  notes.forEach((n, i) => {
    noteInfos.push({ idx: i, beatPos: bp, x: mx + bp * noteW })
    bp += n.durationBeats
  })

  // Determine beat size (1 quarter = 1 beat in simple time)
  const beatSize = beatUnit

  // Group beamable notes by beat — beam group = all beamable notes within same beat
  const beamGroups: number[][] = []
  
  // For each beat, collect beamable notes
  const totalBeats = beatsPerMeasure
  for (let beat = 0; beat < totalBeats; beat++) {
    const beatStart = beat * beatSize
    const beatEnd = beatStart + beatSize
    // Build beam subgroups — break at any quarter+ note within the beat
    const beatNotes = noteInfos.filter(({ beatPos }) =>
      beatPos >= beatStart - 0.001 && beatPos < beatEnd - 0.001
    )
    const subGroups: number[][] = []
    let currentSub: number[] = []
    beatNotes.forEach(({ idx: ni }) => {
      const n = notes[ni]
      const beamable = (n.type === 'eighth' || n.type === 'sixteenth')
      if (beamable) {
        currentSub.push(ni)
      } else {
        if (currentSub.length >= 2) subGroups.push([...currentSub])
        currentSub = []
      }
    })
    if (currentSub.length >= 2) subGroups.push(currentSub)
    subGroups.forEach((sg: number[]) => {
      const nonRest = sg.filter((i: number) => !notes[i].rest)
      if (nonRest.length >= 2) beamGroups.push(sg)
    })
  }

  const beamedSet = new Set(beamGroups.flat().filter(i => !notes[i].rest))
  const beamedNonRestSet = beamedSet


  // ── Render each note ──────────────────────────────────────────────────────
  bp = 0
  notes.forEach((note, i) => {
    const x = mx + bp * noteW  // notehead position
    const tr = tapResult[i]
    const noteColor = tr === 'hit' ? '#4CAF50' : tr === 'miss' ? '#E53935' : '#1A1A18'

    // Active beat highlight (driven by playhead — handled outside)

    if (note.rest) {
      els.push(<RestSymbol key={`r-${i}`} x={x} type={note.type} dot={note.dot} />)
    } else if (beamedSet.has(i)) {
      // Beamed note — render as Bravura text glyph (no standalone flag)
      // Use blackLong glyph (notehead + stem, no flag)
      const glyph = String.fromCodePoint(0xE1F1)  // blackLong
      els.push(
        <text key={`n-${i}`} x={x} y={STAFF_Y} fontSize={BEAM_FONT_SIZE}
          fontFamily="Bravura, serif" fill={noteColor}
          textAnchor="middle" dominantBaseline="auto">{glyph}</text>
      )
      if (note.dot) {
        els.push(<circle key={`d-${i}`} cx={x + 14} cy={STAFF_Y - 4} r={2.5} fill={noteColor} />)
      }
    } else {
      // Standalone note — use precomposed glyph with stem+flag
      els.push(<BravuraNote key={`n-${i}`} x={x} y={STAFF_Y} type={note.type} color={noteColor} />)
      if (note.dot) {
        els.push(<circle key={`d-${i}`} cx={x + 14} cy={STAFF_Y - 4} r={2.5} fill={noteColor} />)
      }
    }

    // Tie curve
    if (note.tieStart && i < notes.length - 1) {
      const nextBp = bp + note.durationBeats
      const nextX = mx + nextBp * noteW
      els.push(<TieCurve key={`tie-${i}`} x1={x} x2={nextX} />)
    }

    bp += note.durationBeats
  })

  // ── Draw SVG beams between beamed groups ──────────────────────────────────
  beamGroups.forEach((group, gi) => {
    const allXs = group.map(idx => { let pos = 0; for (let k = 0; k < idx; k++) pos += notes[k].durationBeats; return mx + pos * noteW + 14 })
    const nonRestIndices = group.filter(i => !notes[i].rest)
    if (nonRestIndices.length < 2) return
    const xs = nonRestIndices.map(idx => { let pos = 0; for (let k = 0; k < idx; k++) pos += notes[k].durationBeats; return mx + pos * noteW })
    if (xs.length < 2) return
    if (!isFinite(xs[0]) || !isFinite(xs[xs.length-1])) return
    const x1 = xs[0] + 7
    const x2 = xs[xs.length - 1] + 7
    const beamY = STAFF_Y - 39  // tuned to Bravura E1F1 stem top at fontSize=44

    // Primary beam (always for 8th+)
    if (isFinite(x1) && isFinite(x2) && x2 > x1) els.push(<rect key={`bm1-${gi}`} x={x1} y={beamY} width={x2 - x1} height={5} fill="#1A1A18" rx={1} />)

    // Secondary beam for sixteenth pairs
    for (let k = 0; k < group.length - 1; k++) {
      // legacy loop kept for reference
    }
    // Secondary beams using nonRestIndices for correct alignment
    const STUB = 12
    for (let k = 0; k < nonRestIndices.length; k++) {
      const ni = nonRestIndices[k]
      if (notes[ni].type !== 'sixteenth') continue
      const prevIs16 = k > 0 && notes[nonRestIndices[k-1]].type === 'sixteenth'
      const nextIs16 = k < nonRestIndices.length - 1 && notes[nonRestIndices[k+1]].type === 'sixteenth'
      if (nextIs16) {
        if (xs[k+1] !== undefined && isFinite(xs[k]) && isFinite(xs[k+1]))
          els.push(<rect key={'bm2-'+gi+'-f-'+k} x={xs[k]+7} y={beamY+7} width={xs[k+1]-xs[k]} height={5} fill="#1A1A18" rx={1} />)
      } else if (!prevIs16) {
        if (isFinite(xs[k]))
          els.push(<rect key={'bm2-'+gi+'-s-'+k} x={xs[k]+7} y={beamY+7} width={STUB} height={5} fill="#1A1A18" rx={1} />)
      }
    }
  })

  return els
}


// ── Library panel ─────────────────────────────────────────────────────────────
function LibraryPanel({
  onSelect, onDrop, dragOver, setDragOver, progress, currentId, userId, onProgressReset
}: {
  onSelect: (meta: RhythmExerciseMeta) => void
  onDrop: (e: React.DragEvent) => void
  dragOver: boolean
  setDragOver: (v: boolean) => void
  progress: Record<string, RhythmProgress>
  currentId?: string
  userId?: string | null
  onProgressReset?: () => void
}) {
  const [library, setLibrary] = useState<Record<string, RhythmExerciseMeta[]>>({})
  const [loading, setLoading] = useState(true)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const flatList: RhythmExerciseMeta[] = Object.values(library).flat()
  const currentIdx = currentId ? flatList.findIndex(e => e.id === currentId) : -1
  const canPrev = currentIdx > 0
  const canNext = currentIdx >= 0 && currentIdx < flatList.length - 1

  useEffect(() => {
    import('@/lib/rhythmLibrary').then(({ fetchExercisesByCategory }) => {
      fetchExercisesByCategory().then(data => {
        setLibrary(data)
        const first = Object.keys(data)[0]
        if (first) setOpenCategory(first)
        setLoading(false)
      })
    })
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Library */}
      <div>
        {currentId && (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => canPrev && onSelect(flatList[currentIdx - 1])} disabled={!canPrev}
          style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #D3D1C7', background: canPrev ? 'white' : '#F5F2EC', color: canPrev ? '#1A1A18' : '#D3D1C7', fontFamily: F, fontSize: '12px', cursor: canPrev ? 'pointer' : 'default' }}>
          ← Previous
        </button>
        <button onClick={() => canNext && onSelect(flatList[currentIdx + 1])} disabled={!canNext}
          style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #D3D1C7', background: canNext ? '#1A1A18' : '#F5F2EC', color: canNext ? 'white' : '#D3D1C7', fontFamily: F, fontSize: '12px', cursor: canNext ? 'pointer' : 'default' }}>
          Next →
        </button>
      </div>
    )}
    <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Exercises</p>
        {loading && <p style={{ fontFamily: F, fontSize: '13px', color: '#888780' }}>Loading…</p>}
        {!loading && Object.keys(library).length === 0 && (
          <p style={{ fontFamily: F, fontSize: '13px', color: '#888780' }}>No exercises yet — upload .mxl files to Supabase storage.</p>
        )}
        {Object.entries(library).map(([category, exercises]) => (
          <div key={category} style={{ marginBottom: '8px' }}>
            <button onClick={() => setOpenCategory(openCategory === category ? null : category)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', border: '1px solid #D3D1C7', background: openCategory === category ? '#1A1A18' : 'white', color: openCategory === category ? 'white' : '#1A1A18', fontFamily: SERIF, fontSize: '16px', fontWeight: 300, cursor: 'pointer', textAlign: 'left' as const }}>
              <span>{category}</span>
              <span style={{ fontFamily: F, fontSize: '11px', color: openCategory === category ? 'rgba(255,255,255,0.5)' : '#888780' }}>{exercises.length}</span>
            </button>
            {openCategory === category && (
              <div style={{ paddingTop: '4px', display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
                {exercises.map((ex, exIdx) => {
                  // Exercise is unlocked if: first in category, OR previous exercise completed
                  const prevEx = exIdx > 0 ? exercises[exIdx - 1] : null
                  const isUnlocked = exIdx === 0 || (prevEx ? (progress[prevEx.id]?.completed ?? false) : true)
                  const p = progress[ex.id]
                  const isCurrent = ex.id === currentId
                  return (
                    <button key={ex.id}
                      onClick={() => isUnlocked && onSelect(ex)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: '1px solid ' + (isCurrent ? '#BA7517' : '#D3D1C7'), background: isCurrent ? '#FEF3E2' : isUnlocked ? 'white' : '#F5F2EC', cursor: isUnlocked ? 'pointer' : 'default', textAlign: 'left' as const, transition: 'all 0.15s', opacity: isUnlocked ? 1 : 0.6 }}
                      onMouseEnter={e => { if (isUnlocked) e.currentTarget.style.borderColor = '#BA7517' }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.borderColor = '#D3D1C7' }}>
                      <span style={{ fontFamily: F, fontSize: '10px', color: '#D3D1C7', width: '16px' }}>{exIdx + 1}</span>
                      <span style={{ fontFamily: SERIF, fontSize: '15px', color: isUnlocked ? '#1A1A18' : '#888780', flex: 1 }}>{ex.title}</span>
                      <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 400, padding: '2px 8px', borderRadius: '20px', background: DIFFICULTY_COLORS[ex.difficulty], color: DIFFICULTY_TEXT[ex.difficulty] }}>
                        {DIFFICULTY_LABEL[ex.difficulty]}
                      </span>
                      <span style={{ fontFamily: F, fontSize: '11px', color: '#888780' }}>{ex.beats}/{ex.beat_type}</span>
                      {!isUnlocked && <span style={{ fontSize: '12px' }}>🔒</span>}
                      {isUnlocked && p && (
                        <span style={{ fontFamily: F, fontSize: '10px', color: p.completed ? '#4CAF50' : '#BA7517' }}>
                          {p.completed ? '✓' : `${p.best_timing}%`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div>
        <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Or load your own</p>
        <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          style={{ border: `2px dashed ${dragOver ? '#BA7517' : '#D3D1C7'}`, borderRadius: '16px', padding: '48px 24px', textAlign: 'center' as const, background: dragOver ? '#FEF3E2' : 'white', transition: 'all 0.2s', height: '200px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 300, color: '#888780', marginBottom: '6px' }}>Drop .mxl here</p>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#D3D1C7' }}>Export from MuseScore</p>
        </div>
        <button onClick={async () => { const { resetProgress } = await import('@/lib/rhythmLibrary'); await resetProgress(userId ?? null); onProgressReset?.() }}
          style={{ marginTop: '12px', width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '11px', cursor: 'pointer' }}>
          Reset all progress
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RhythmPage() {
  const [exercise, setExercise] = useState<RhythmExercise | null>(null)
  const [currentMeta, setCurrentMeta] = useState<RhythmExerciseMeta | null>(null)
  const [view, setView] = useState<'notation' | 'grid'>('notation')
  const [bpm, setBpm] = useState(72)
  const [playing, setPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [tapReady, setTapReady] = useState(false)
  const tapReadyRef = useRef(false)
  const tapBtnRef = useRef<HTMLButtonElement>(null)
  const [playhead, setPlayhead] = useState<number | null>(null)  // absolute beat position (float)
  const [taps, setTaps] = useState<number[]>([])
  const [tapDurations, setTapDurations] = useState<number[]>([])  // ms held per tap
  const keyDownTimeRef = useRef<number | null>(null)
  const pointerDownTimeRef = useRef<number | null>(null)
  const [tapResults, setTapResults] = useState<('hit'|'miss'|'none')[][]>([])
  const [liveFeedback, setLiveFeedback] = useState<'hit'|'miss'|null>(null)
  const trailRef = useRef<{ beat: number; color: string }[]>([])
  const [trail, setTrail] = useState<{ beat: number; color: string }[]>([])
  const isPressedRef = useRef(false)
  const [diagLog, setDiagLog] = useState<string[]>([])
  const [showDiag, setShowDiag] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  const [metroVol, setMetroVol] = useState(0.7)
  const metroVolRef = useRef(0.7)
  useEffect(() => { metroVolRef.current = metroVol; if (metroGainRef.current) metroGainRef.current.gain.value = metroVol }, [metroVol])
  const [pianoVol, setPianoVol] = useState(0.8)
  const pianoVolRef = useRef(0.8)
  useEffect(() => { pianoVolRef.current = pianoVol; if (pianoGainRef.current) pianoGainRef.current.gain.value = pianoVol }, [pianoVol])

  const tapNoteRef = useRef<string | null>(null)
  const pianoBufferRef = useRef<AudioBuffer | null>(null)

  // Prevent iOS selection bubble on tap button
  useEffect(() => {
    const btn = tapBtnRef.current
    if (!btn) return
    const prevent = (e: TouchEvent) => e.preventDefault()
    btn.addEventListener('touchstart', prevent, { passive: false })
    return () => btn.removeEventListener('touchstart', prevent)
  }, [])

  const initSampler = useCallback(() => {}, [])
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [score, setScore] = useState<{ hits: number; total: number; durationHits: number; durationTotal: number; restTaps: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loadingExercise, setLoadingExercise] = useState(false)
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [allExercises, setAllExercises] = useState<RhythmExerciseMeta[]>([])
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const landscapeContainerRef = useRef<HTMLDivElement>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [svgWidth, setSvgWidth] = useState(800)

  const ctxRef = useRef<AudioContext | null>(null)
  const metroGainRef = useRef<GainNode | null>(null)
  const pianoGainRef = useRef<GainNode | null>(null)
  const rafRef = useRef(0)
  const startTimeRef = useRef(0)

  const beatDuration = 60 / bpm
  const totalBeats = exercise ? exercise.timeSignature.beats * exercise.measures.length : 0

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  // Load all exercises for next/prev navigation
  useEffect(() => {
    import('@/lib/rhythmLibrary').then(({ fetchExercisesByCategory }) => {
      fetchExercisesByCategory().then(data => {
        const flat = Object.values(data).flat()
        setAllExercises(flat)
      })
    })
  }, [])

  // Load progress
  useEffect(() => {
    import('@/lib/rhythmLibrary').then(({ fetchProgress }) => {
      fetchProgress(user?.id ?? null).then(setProgress)
    })
  }, [user])

  useEffect(() => {
    const el = isPortrait ? containerRef.current : landscapeContainerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => setSvgWidth(entries[0].contentRect.width - 48))
    obs.observe(el)
    return () => obs.disconnect()
  }, [exercise, isPortrait])

  const getCtx = () => {
    if (!ctxRef.current) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      ctxRef.current = new AudioCtx()
      // Load piano sample
      fetch('/samples/piano-g4.wav')
        .then(r => r.arrayBuffer())
        .then(buf => ctxRef.current?.decodeAudioData(buf))
        .then(decoded => { if (decoded) pianoBufferRef.current = decoded })
        .catch(() => {})
    }
    if (!metroGainRef.current && ctxRef.current) {
      const ctx = ctxRef.current
      metroGainRef.current = ctx.createGain()
      pianoGainRef.current = ctx.createGain()
      metroGainRef.current.gain.value = metroVolRef.current
      pianoGainRef.current.gain.value = pianoVolRef.current
      metroGainRef.current.connect(ctx.destination)
      pianoGainRef.current.connect(ctx.destination)
    }
    return ctxRef.current!
  }

  const playClick = (time: number, accent: boolean) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const dest = metroGainRef.current ?? ctx.destination
    osc.connect(gain); gain.connect(dest)
    osc.frequency.value = accent ? 1000 : 700
    gain.gain.setValueAtTime(accent ? 0.5 : 0.2, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time); osc.stop(time + 0.06)
  }

  const loadExercise = async (meta: RhythmExerciseMeta) => {
    setLoadingExercise(true)
    try {
      const { fetchExerciseFile } = await import('@/lib/rhythmLibrary')
      const { parseMXL } = await import('@/lib/parseMXL')
      const buffer = await fetchExerciseFile(meta.id)
      const ex = await parseMXL(buffer)
      setExercise(ex); setCurrentMeta(meta)
      setScore(null); setTaps([]); setTapResults([]); setTrail([]); trailRef.current = []; setDiagLog([])
      setBpm(72)
    } finally {
      setLoadingExercise(false)
    }
  }

  const start = useCallback(async () => {
    if (!exercise) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    initSampler()  // load piano on first gesture
    setTaps([]); setScore(null); setTapResults([]); setTapDurations([]); trailRef.current = []; setTrail([]); setDiagLog([])
    setTapReady(false)
    tapReadyRef.current = false
    setPlaying(true)

    const beatsPerMeasure = exercise.timeSignature.beats
    const countdownBeats = beatsPerMeasure
    const now = ctx.currentTime + 0.1
    startTimeRef.current = now + countdownBeats * beatDuration

    for (let i = 0; i < countdownBeats; i++) playClick(now + i * beatDuration, i === 0)
    for (let i = 0; i < totalBeats; i++) playClick(startTimeRef.current + i * beatDuration, i % beatsPerMeasure === 0)

    const countdownStart = now
    const tick = () => {
      const ctx2 = ctxRef.current; if (!ctx2) return
      const countdownElapsed = ctx2.currentTime - countdownStart
      if (countdownElapsed < countdownBeats * beatDuration) {
        const countBeat = Math.floor(countdownElapsed / beatDuration) + 1
        setCountdown(countBeat)
        // Start playhead moving during last countdown beat
        const timeToStart = startTimeRef.current - ctx2.currentTime
        // Show playhead from 2 beats before downbeat
        if (timeToStart <= beatDuration) {
          setPlayhead(-timeToStart / beatDuration)
        }
        // Enable tap during last beat only
        if (timeToStart <= beatDuration) {
          tapReadyRef.current = true
          setTapReady(true)
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setCountdown(null)
      const elapsed = ctx2.currentTime - startTimeRef.current
      // Start playhead slightly early so it arrives at first note on beat 0
      const beatFloat = elapsed / beatDuration
      // Show playhead from -0.5 beats so student can anticipate
      setPlayhead(beatFloat)
      // Paint trail — green if pressing near a note, red if pressing on rest, gray if not pressing
      let trailColor = '#D3D1C7'
      if (isPressedRef.current && exercise) {
        // First check: is beatFloat near ANY note onset? (takes priority over rest)
        let posT = 0
        let nearNote = false
        for (const m of exercise.measures) {
          for (const n of m.notes) {
            if (!n.rest && Math.abs(posT - beatFloat) <= 0.75) { nearNote = true; break }
            posT += n.durationBeats
          }
          if (nearNote) break
        }
        if (nearNote) {
          trailColor = '#4CAF50'
        } else {
          // Second check: is beatFloat strictly inside a rest?
          let posR = 0
          let strictlyOnRest = false
          outerR: for (const m of exercise.measures) {
            for (const n of m.notes) {
              if (n.rest && beatFloat >= posR && beatFloat < posR + n.durationBeats) {
                strictlyOnRest = true; break outerR
              }
              posR += n.durationBeats
            }
          }
          trailColor = strictlyOnRest ? '#E53935' : '#4CAF50'
        }
      }
      trailRef.current.push({ beat: beatFloat, color: trailColor })
      if (trailRef.current.length % 3 === 0) setTrail([...trailRef.current])
      if (beatFloat >= totalBeats) {
        setPlayhead(null); setPlaying(false); setLiveFeedback(null)
        tapNoteRef.current = null
        // Close AudioContext to cancel any remaining scheduled clicks
        if (ctxRef.current) {
          ctxRef.current.close()
          ctxRef.current = null
          metroGainRef.current = null
          pianoGainRef.current = null
        }
        return
      }
      setPlayhead(beatFloat)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [exercise, totalBeats, beatDuration])

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    setTapReady(false)
    tapReadyRef.current = false
    // Close audio context to cancel all scheduled clicks
    if (ctxRef.current) {
      ctxRef.current.close()
      ctxRef.current = null
      metroGainRef.current = null
      pianoGainRef.current = null
    }
    setPlaying(false); setPlayhead(null); setCountdown(null); setLiveFeedback(null)
    tapNoteRef.current = null  // sound auto-decays
  }

  // Prevent space from scrolling or triggering buttons always when exercise loaded
  useEffect(() => {
    if (!exercise) return
    const preventSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space') e.preventDefault()
    }
    window.addEventListener('keydown', preventSpace)
    return () => window.removeEventListener('keydown', preventSpace)
  }, [exercise])

  useEffect(() => {
    if (!playing || !exercise) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      // Block taps until last countdown beat
      if (!tapReadyRef.current && countdown !== null) return
      keyDownTimeRef.current = performance.now()
      isPressedRef.current = true
      const ctx = ctxRef.current; if (!ctx) return
      // Start tap tone via Tone.js sampler
      if (soundEnabledRef.current) {
        const ctx2 = ctxRef.current
        if (ctx2) {
          if (ctx2.state === 'suspended') void ctx2.resume()
          if (pianoBufferRef.current) {
            const source = ctx2.createBufferSource()
            const gain = ctx2.createGain()
            source.buffer = pianoBufferRef.current
            source.playbackRate.value = 261.63 / 392  // G4 sample → C4
            const dest = pianoGainRef.current ?? ctx2.destination
            source.connect(gain); gain.connect(dest)
            gain.gain.setValueAtTime(1.0, ctx2.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 2)
            source.start(); source.stop(ctx2.currentTime + 2)
          } else {
            const osc1 = ctx2.createOscillator()
            const osc2 = ctx2.createOscillator()
            const gain = ctx2.createGain()
            const dest = pianoGainRef.current ?? ctx2.destination
            osc1.connect(gain); osc2.connect(gain); gain.connect(dest)
            osc1.frequency.value = 261.63
            osc2.frequency.value = 523.25
            osc1.type = 'triangle'; osc2.type = 'sine'
            gain.gain.setValueAtTime(0.4, ctx2.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 1.5)
            osc1.start(); osc2.start()
            osc1.stop(ctx2.currentTime + 1.5); osc2.stop(ctx2.currentTime + 1.5)
          }
        }
      }
      const kbElapsed = ctx.currentTime - startTimeRef.current
      if (kbElapsed < -beatDuration * 1.5) return
      const beatFloat2 = kbElapsed < 0 ? 0 : kbElapsed / beatDuration
      const beat = Math.round(beatFloat2)
      const clampedBeat = Math.max(0, Math.min(beatFloat2, totalBeats))
      console.log('KB TAP: beatFloat='+beatFloat2.toFixed(3)+' clampedBeat='+clampedBeat.toFixed(3))
      setTaps(prev => [...prev, clampedBeat])
      // Live feedback
      const expected: number[] = []
      let pos = 0
      exercise.measures.forEach(m => m.notes.forEach(n => {
        if (!n.rest && !n.tieStop) expected.push(pos)
        pos += n.durationBeats
      }))
      const isHit = expected.some(e => Math.abs(e - clampedBeat) <= 0.75)
      // Live feedback for keyboard
      const onRestFB = (() => { let p = 0; for (const m of exercise.measures) { for (const n of m.notes) { if (n.rest && clampedBeat >= p && clampedBeat < p + n.durationBeats - 0.75) return true; p += n.durationBeats; } } return false })()
      if (isHit && !onRestFB) setLiveFeedback('hit')
      else if (!isHit && onRestFB) setLiveFeedback('miss')
      // Real-time note coloring
      if (exercise) {
        const TOL = 0.4
        let pos = 0
        let nearest = { mi: -1, ni: -1, dist: Infinity }
        exercise.measures.forEach((m, mi) => {
          m.notes.forEach((n, ni) => {
            if (!n.rest && !n.tieStop) {
              const d = Math.abs(pos - clampedBeat)
              if (d < nearest.dist) nearest = { mi, ni, dist: d }
            }
            pos += n.durationBeats
          })
        })
        if (nearest.mi >= 0 && nearest.dist <= TOL) {
          const onRestKB = (() => { let p = 0; for (const m of exercise.measures) { for (const n of m.notes) { if (n.rest && clampedBeat >= p - 0.15 && clampedBeat < p + n.durationBeats) return true; p += n.durationBeats; } } return false })()
          // Color note if tap contains it OR if near note onset
          const nearOnsetKB = (() => {
            let posNN = 0
            for (const m of exercise.measures) {
              for (const n of m.notes) {
                if (!n.rest && Math.abs(posNN - clampedBeat) <= 0.75) return true
                posNN += n.durationBeats
              }
            }
            return false
          })()
          if (nearOnsetKB && !onRestKB || (!onRestKB && nearest.dist <= TOL)) {
            const result: 'hit'|'miss' = nearest.dist <= TOL ? 'hit' : 'miss'
            setTapResults(prev => {
              const newResults = exercise.measures.map((m, mi) => prev[mi] ? [...prev[mi]] : m.notes.map(() => 'none' as const))
              newResults[nearest.mi][nearest.ni] = result
              return newResults
            })
          } else if (nearOnsetKB && onRestKB) {
            // Find the actual note near this beat
            let posNR = 0
            for (let miNR = 0; miNR < exercise.measures.length; miNR++) {
              for (let niNR = 0; niNR < exercise.measures[miNR].notes.length; niNR++) {
                const nNR = exercise.measures[miNR].notes[niNR]
                if (!nNR.rest && Math.abs(posNR - clampedBeat) <= 0.75) {
                  setTapResults(prev => {
                    const newResults = exercise.measures.map((m, mi) => prev[mi] ? [...prev[mi]] : m.notes.map(() => 'none' as const))
                    newResults[miNR][niNR] = 'hit'
                    return newResults
                  })
                  break
                }
                posNR += nNR.durationBeats
              }
            }
          }
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      isPressedRef.current = false
      setLiveFeedback(null)
      // Stop tap tone
      tapNoteRef.current = null  // sound auto-decays
      if (keyDownTimeRef.current !== null) {
        const duration = performance.now() - keyDownTimeRef.current
        setTapDurations(prev => [...prev, duration])
        keyDownTimeRef.current = null
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [playing, countdown, beatDuration, totalBeats, exercise])

  useEffect(() => {
    if (playing || !exercise || taps.length === 0) return
    const expected: number[] = []
    let pos = 0
    exercise.measures.forEach(m => m.notes.forEach(n => {
      if (!n.rest && !n.tieStop) expected.push(pos)
      pos += n.durationBeats
    }))
    // Build rest ranges for filtering taps
    const restRangesForScoring: { start: number; end: number }[] = []
    let rPosS = 0
    exercise.measures.forEach(m => m.notes.forEach(n => {
      if (n.rest) restRangesForScoring.push({ start: rPosS, end: rPosS + n.durationBeats })
      rPosS += n.durationBeats
    }))
    // Only use taps that are NOT on a rest for note matching
    const noteTaps = taps.filter(t => {
      const nearNoteOnset = expected.some(e => Math.abs(t - e) <= 0.75)
      if (nearNoteOnset) return true
      return !restRangesForScoring.some(r => t >= r.start - 0.15 && t < r.end)
    })
    // One-to-one matching with tolerance
    const SCORE_TOL = 0.4
    const usedTaps = new Set<number>()
    const hits = expected.filter(e => {
      let bestIdx = -1; let bestDist = SCORE_TOL
      noteTaps.forEach((t, i) => {
        if (!usedTaps.has(i) && Math.abs(t - e) <= bestDist) { bestDist = Math.abs(t - e); bestIdx = i }
      })
      if (bestIdx >= 0) { usedTaps.add(bestIdx); return true }
      return false
    }).length

    // Build rest ranges for silence detection
    const restRanges: { start: number; end: number }[] = []
    let rPos = 0
    exercise.measures.forEach(m => m.notes.forEach(n => {
      if (n.rest) restRanges.push({ start: rPos, end: rPos + n.durationBeats })
      rPos += n.durationBeats
    }))
    // Count taps that fall within rest ranges
    const restTaps = taps.filter(t => restRanges.some(r => t >= r.start && t < r.end) && !expected.some(e => Math.abs(e - t) <= 0.75)).length

    // Build note ranges for extra-tap detection
    const noteRanges: { start: number; end: number; isNote: boolean }[] = []
    let posR = 0
    exercise.measures.forEach(m => m.notes.forEach(n => {
      noteRanges.push({ start: posR, end: posR + n.durationBeats, isNote: !n.rest && !n.tieStop })
      posR += n.durationBeats
    }))

    // Count extra taps: taps that don't match an expected onset
    const extraTaps = taps.filter(t => !expected.includes(t))

    let pos2 = 0
    const PMTOL = 0.4
    const usedTapsPM = new Set<number>()
    const perMeasure = exercise.measures.map(m => m.notes.map(n => {
      const notePos = pos2
      pos2 += n.durationBeats
      if (n.rest || n.tieStop) return 'none' as const
      // Find closest unused NOTE tap within tolerance (exclude rest taps)
      let bestIdx = -1; let bestDist = PMTOL
      noteTaps.forEach((t, i) => {
        if (!usedTapsPM.has(i) && Math.abs(t - notePos) <= bestDist) {
          bestDist = Math.abs(t - notePos); bestIdx = i
        }
      })
      if (bestIdx < 0) return 'miss' as const
      usedTapsPM.add(bestIdx)
      return 'hit' as const
    }))

    // Adjust hits to account for extra taps within notes
    const adjustedHits = perMeasure.flat().filter(r => r === 'hit').length
    // Merge: keep real-time hits, fill remaining 'none' with scoring result
    setTapResults(prev => {
      return perMeasure.map((row, mi) =>
        row.map((val, ni) => {
          const rt = prev[mi]?.[ni]
          if (rt === 'hit') return 'hit'  // keep real-time hit
          return val  // use scoring result for missed/none
        })
      )
    })

    // Save progress
    if (currentMeta) {
      const timingPct = expected.length > 0 ? Math.round(adjustedHits / expected.length * 100) : 0
      import('@/lib/rhythmLibrary').then(({ saveProgress, fetchProgress }) => {
        saveProgress(user?.id ?? null, currentMeta.id, timingPct, 0).then(() =>
          fetchProgress(user?.id ?? null).then(setProgress)
        )
      })
    }

    // Duration scoring — compare each tap duration to expected note duration
    const expectedDurations = expected.map(beatIdx => {
      let dur = beatDuration * 1000  // default quarter note
      let pos3 = 0
      for (const m of exercise.measures) {
        for (const n of m.notes) {
          if (Math.round(pos3) === beatIdx) { dur = n.durationBeats * beatDuration * 1000; break }
          pos3 += n.durationBeats
        }
      }
      return dur
    })
    const durationHits = tapDurations.slice(0, expectedDurations.length).filter((d, i) => {
      const exp = expectedDurations[i]
      if (!exp) return false
      const ratio = d / exp
      return ratio >= 0.15 && ratio <= 2.0  // hold at least 15% of note value, not more than 200%
    }).length
    const durationTotal = Math.min(tapDurations.length, expectedDurations.length)

    const finalScore = { hits: adjustedHits, total: expected.length, durationHits, durationTotal, restTaps }
    setScore(finalScore)
    setDiagLog(prev => {
      const trailSummary = trailRef.current.filter((_, i) => i % 10 === 0).map(t => `${t.beat.toFixed(2)}:${t.color === '#4CAF50' ? 'G' : t.color === '#E53935' ? 'R' : '_'}`).join(' ')
      return [...prev, `SCORE hits=${finalScore.hits}/${finalScore.total} restTaps=${restTaps} noteTaps=[${noteTaps.map(t=>t.toFixed(2)).join(',')}] taps=[${taps.map(t=>t.toFixed(2)).join(',')}] expected=[${expected.map(e=>e.toFixed(1)).join(',')}]`, `TRAIL(every10): ${trailSummary}`]
    })
  }, [playing])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (!file) return
    const { parseMXL } = await import('@/lib/parseMXL')
    const ex = await parseMXL(await file.arrayBuffer())
    setExercise(ex); setCurrentMeta(null)
    setScore(null); setTaps([]); setTapResults([])
  }, [])

  const handlePointerDown = useCallback(() => {
    isPressedRef.current = true
    initSampler()
    if (!playing) return
    if (countdown !== null && !tapReadyRef.current) return
    pointerDownTimeRef.current = performance.now()
    const ctx = getCtx(); if (!ctx) return
    void ctx.resume()
    console.log('TAP: state='+ctx.state+' pianoBuffer='+!!pianoBufferRef.current+' pianoGain='+!!pianoGainRef.current)
    if (soundEnabledRef.current) {
      if (pianoBufferRef.current) {
        // Real piano sample
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        source.buffer = pianoBufferRef.current
        source.playbackRate.value = 261.63 / 392  // G4 sample → C4
        const pianoDest = pianoGainRef.current ?? ctx.destination
        source.connect(gain); gain.connect(pianoDest)
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
        source.start()
        source.stop(ctx.currentTime + 2)
      } else {
        // Fallback: piano-like synthesis
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
        osc1.frequency.value = 261.63
        osc2.frequency.value = 523.25
        osc1.type = 'triangle'; osc2.type = 'sine'
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
        osc1.start(); osc2.start()
        osc1.stop(ctx.currentTime + 1.5); osc2.stop(ctx.currentTime + 1.5)
      }
    }
    const elapsed = ctx.currentTime - startTimeRef.current
    if (elapsed < -beatDuration * 1.5) return
    const beatFloatP = elapsed < 0 ? 0 : elapsed / beatDuration
    const beat = Math.round(beatFloatP)
    const clampedBeat = Math.max(0, Math.min(beatFloatP, totalBeats))
    setTaps(prev => [...prev, clampedBeat])
    if (exercise) {
      const expected: number[] = []
      let pos = 0
      exercise.measures.forEach(m => m.notes.forEach(n => {
        if (!n.rest && !n.tieStop) expected.push(pos)
        pos += n.durationBeats
      }))
      const isHit = expected.some(e => Math.abs(e - clampedBeat) <= 0.75)
      // Find containing note/rest for diag
      let diagCP = 0; let diagFound = 'unknown'
      for (const m of exercise.measures) {
        for (const n of m.notes) {
          const endTolD = n.rest ? -0.75 : 0.3
          if (clampedBeat >= diagCP - 0.5 && clampedBeat < diagCP + n.durationBeats + endTolD) {
            diagFound = n.rest ? 'REST' : 'NOTE'
            break
          }
          diagCP += n.durationBeats
        }
        if (diagFound !== 'unknown') break
      }
      setDiagLog(prev => [...prev, `TOUCH beat=${clampedBeat.toFixed(3)} on=${diagFound} isHit=${isHit} expected=[${expected.map(e=>e.toFixed(1)).join(',')}]`])
      const nearOnsetP = expected.some(e => Math.abs(e - clampedBeat) <= 0.75)
      const effectiveIsHit = isHit && (diagFound !== 'REST' || nearOnsetP)
      if (effectiveIsHit) setLiveFeedback('hit')
      else if (diagFound === 'REST' || expected.every(e => Math.abs(e - clampedBeat) > 0.3)) setLiveFeedback('miss')
    }
    // Real-time note coloring — only color if tap falls within a note (not rest)
    if (exercise) {
      let cpC = 0
      let cn: { mi: number; ni: number; isRest: boolean; beatPos: number } | null = null
      outerC: for (let miC = 0; miC < exercise.measures.length; miC++) {
        for (let niC = 0; niC < exercise.measures[miC].notes.length; niC++) {
          const nC = exercise.measures[miC].notes[niC]
          const endTol = nC.rest ? 0 : 0.1  // no forward tolerance for rests
          if (clampedBeat >= cpC - 0.25 && clampedBeat < cpC + nC.durationBeats + endTol) {
            let bpC = 0
            exercise.measures[miC].notes.slice(0, niC).forEach(nn => bpC += nn.durationBeats)
            cn = { mi: miC, ni: niC, isRest: !!nC.rest, beatPos: miC * (exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)) + bpC }
            break outerC
          }
          cpC += nC.durationBeats
        }
      }
      const expectedC: number[] = []
      let posEC = 0
      exercise.measures.forEach(m => m.notes.forEach(n => {
        if (!n.rest && !n.tieStop) expectedC.push(posEC)
        posEC += n.durationBeats
      }))
      const nearOnsetC = expectedC.some(e => Math.abs(e - clampedBeat) <= 0.75)
      // If on rest but near note onset, find the actual note
      if (cn && cn.isRest && nearOnsetC) {
        let cpN = 0
        outerN: for (let miN = 0; miN < exercise.measures.length; miN++) {
          for (let niN = 0; niN < exercise.measures[miN].notes.length; niN++) {
            const nN = exercise.measures[miN].notes[niN]
            if (!nN.rest && expectedC.some(e => Math.abs(e - cpN) <= 0.01) && Math.abs(cpN - clampedBeat) <= 0.5) {
              let bpN = 0
              exercise.measures[miN].notes.slice(0, niN).forEach(nn => bpN += nn.durationBeats)
              cn = { mi: miN, ni: niN, isRest: false, beatPos: miN * (exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)) + bpN }
              break outerN
            }
            cpN += nN.durationBeats
          }
        }
      }
      if (cn && !cn.isRest) {
        const result = Math.abs(cn.beatPos - clampedBeat) <= 0.4 ? 'hit' : 'miss'
        setTapResults(prev => {
          const newResults = exercise.measures.map((m, mi) => prev[mi] ? [...prev[mi]] : m.notes.map(() => 'none' as const))
          newResults[cn!.mi][cn!.ni] = result
          return newResults
        })
      }
    }
  }, [playing, countdown, beatDuration, totalBeats, exercise])

  const handlePointerUp = useCallback(() => {
    isPressedRef.current = false
    setLiveFeedback(null)
    tapNoteRef.current = null  // sound auto-decays
    if (pointerDownTimeRef.current !== null) {
      const duration = performance.now() - pointerDownTimeRef.current
      setTapDurations(prev => [...prev, duration])
      pointerDownTimeRef.current = null
    }
  }, [])

    const MEASURES_PER_ROW = (() => {
    if (!exercise) return 4
    const total = exercise.measures.length
    const qBpm = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
    const allN = exercise.measures.flatMap(m => m.notes)
    const smallest = allN.reduce((min, n) => Math.min(min, n.durationBeats), 1)
    const slotsPerMeasure = qBpm / smallest
    const minMeasureW = slotsPerMeasure * 32
    const cardW = svgWidth || 700
    for (const candidate of [4, 2, 1]) {
      if (candidate !== 1 && total % candidate !== 0) continue
      if (minMeasureW * candidate + 96 <= cardW) return candidate
    }
    return 1
  })()
  const SVG_H = 130
  const rows = exercise
    ? Array.from({ length: Math.ceil(exercise.measures.length / MEASURES_PER_ROW) },
        (_, i) => exercise.measures.slice(i * MEASURES_PER_ROW, (i + 1) * MEASURES_PER_ROW))
    : []
  const pct = score && score.total > 0 ? Math.round(score.hits / score.total * 100) : 0
  const currentExIdx = currentMeta ? allExercises.findIndex(e => e.id === currentMeta.id) : -1
  const prevEx = currentExIdx > 0 ? allExercises[currentExIdx - 1] : null
  const nextEx = currentExIdx >= 0 && currentExIdx < allExercises.length - 1 ? allExercises[currentExIdx + 1] : null
  const durationPct = score && score.durationTotal > 0 ? Math.round(score.durationHits / score.durationTotal * 100) : 0


  // ── PORTRAIT / MOBILE LAYOUT ─────────────────────────────────────────────
  if (isPortrait) {
    const tapBtnStyle: React.CSSProperties = {
      width: '100%', height: '80px', borderRadius: '16px',
      border: liveFeedback === 'hit' ? '2px solid #4CAF50' : liveFeedback === 'miss' ? '2px solid #E53935' : '2px solid #D3D1C7',
      background: liveFeedback === 'hit' ? '#4CAF50' : liveFeedback === 'miss' ? '#E53935' : (playing && tapReady) ? '#1A1A18' : '#F5F2EC',
      color: liveFeedback ? 'white' : (playing && tapReady) ? 'white' : '#D3D1C7',
      fontFamily: F, fontSize: '18px', fontWeight: 300,
      cursor: 'pointer', transition: 'background 0.1s, border 0.1s',
      userSelect: 'none', WebkitUserSelect: 'none',
      touchAction: 'none', WebkitTouchCallout: 'none',
      letterSpacing: '0.08em', flexShrink: 0,
    }

    return (
      <div style={{ minHeight: '100svh', background: '#F5F2EC', display: 'flex', flexDirection: 'column', padding: '8px 12px 8px', gap: '8px', userSelect: 'none' as const, WebkitUserSelect: 'none' as const, WebkitTouchCallout: 'none' as const }}>

        {/* Top bar: back + title + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {exercise && (
            <button onClick={() => { setExercise(null); setCurrentMeta(null); stop() }}
              style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', background: 'none', border: '1px solid #D3D1C7', borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
              ← Library
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {exercise && currentMeta ? (
              <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {currentMeta.title} · {exercise.timeSignature.beats}/{exercise.timeSignature.beatType} · {bpm} BPM
              </p>
            ) : (
              <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 300, color: '#1A1A18', margin: 0 }}>Rhythm Trainer</p>
            )}
          </div>
          {exercise && currentMeta && (
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button onClick={() => prevEx && loadExercise(prevEx)} disabled={!prevEx}
                style={{ padding: '6px 10px', borderRadius: '20px', border: '1px solid ' + (prevEx ? '#1A1A18' : '#D3D1C7'), background: prevEx ? '#1A1A18' : '#F5F2EC', color: prevEx ? 'white' : '#D3D1C7', fontFamily: F, fontSize: '12px', cursor: prevEx ? 'pointer' : 'default' }}>←</button>
              <button onClick={() => nextEx && loadExercise(nextEx)} disabled={!nextEx}
                style={{ padding: '6px 10px', borderRadius: '20px', border: '1px solid ' + (nextEx ? '#1A1A18' : '#D3D1C7'), background: nextEx ? '#1A1A18' : '#F5F2EC', color: nextEx ? 'white' : '#D3D1C7', fontFamily: F, fontSize: '12px', cursor: nextEx ? 'pointer' : 'default' }}>→</button>
            </div>
          )}
        </div>

        {/* Notation area */}
        {exercise ? (
          <div ref={containerRef} style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', overflow: 'hidden', position: 'relative' as const, flexShrink: 0 }}>
            {/* Fixed playhead */}
            {playing && (countdown === null || (playhead !== null && playhead >= -1)) && (
              <div style={{ position: 'absolute' as const, left: '50%', top: 0, bottom: 0, width: '2px', background: '#BA7517', opacity: 0.6, zIndex: 10, pointerEvents: 'none' as const, transform: 'translateX(-3px)' }} />
            )}
            {view === 'notation' && (() => {
              const qBeatsPerMeasure = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
              const allNotesFlat = exercise.measures.flatMap(m => m.notes)
              const smallestDur = allNotesFlat.reduce((min: number, n: {durationBeats: number}) => Math.min(min, n.durationBeats), 1)
              const NOTE_W_PORTRAIT = Math.max(40, 32 / smallestDur)
              const totalBeatsAll = qBeatsPerMeasure * exercise.measures.length
              const totalW = totalBeatsAll * NOTE_W_PORTRAIT + 160
              const centerX = svgWidth / 2
              // Pre-roll: start 1 beat before beat 0
              const preRoll = 0  // offset handled by mx+18 positioning
              // playhead goes from -countdownBeats to totalBeats
              // at playhead=0, first note (x=56+18) should be at centerX
              // at playhead=0, first notehead (x=74) aligns with center playhead line
              const effectivePlayhead = playhead ?? -1
              const offsetX = centerX - 52 - effectivePlayhead * NOTE_W_PORTRAIT
              return (
                <div style={{ overflow: 'hidden' }}>
                  <svg width={svgWidth} height={160} style={{ display: 'block' }}>
                    <g transform={`translate(${offsetX}, 28)`}>
                      <line x1={0} y1={STAFF_Y} x2={totalW} y2={STAFF_Y} stroke="#1A1A18" strokeWidth={1.2} />
                      <line x1={56} y1={STAFF_Y - 28} x2={56} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />
                      {exercise.measures.map((measure, mIdx) => {
                        const mx = 56 + mIdx * qBeatsPerMeasure * NOTE_W_PORTRAIT + 18
                        const barlineX = 56 + (mIdx + 1) * qBeatsPerMeasure * NOTE_W_PORTRAIT
                        const tapRes: ('hit'|'miss'|'none')[] = tapResults[mIdx] ?? measure.notes.map(() => 'none' as const)
                        const isLast = mIdx === exercise.measures.length - 1
                        const beatUnit = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3
                          ? 3 * (4 / exercise.timeSignature.beatType)
                          : 4 / exercise.timeSignature.beatType
                        return (
                          <g key={mIdx}>
                            {renderMeasure(measure.notes, mx, NOTE_W_PORTRAIT, tapRes, qBeatsPerMeasure, beatUnit)}
                            {!isLast && <line x1={barlineX} y1={STAFF_Y - 28} x2={barlineX} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />}
                            {isLast && <>
                              <line x1={barlineX} y1={STAFF_Y - 28} x2={barlineX} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1.2} />
                              <line x1={barlineX + 7} y1={STAFF_Y - 28} x2={barlineX + 7} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={6} />
                            </>}
                            {mIdx === 0 && (
                              <>
                                <text x={34} y={STAFF_Y - 18} fontSize={40} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">
                                  {String.fromCodePoint(0xE080 + exercise.timeSignature.beats)}
                                </text>
                                <text x={34} y={STAFF_Y + 8} fontSize={40} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">
                                  {String.fromCodePoint(0xE080 + exercise.timeSignature.beatType)}
                                </text>
                              </>
                            )}
                          </g>
                        )
                      })}
{/* Beat markers */}
                      {exercise.measures.map((m, mi) =>
                        Array.from({ length: Math.round(qBeatsPerMeasure) }, (_, bi) => (
                          <line key={'bm'+mi+'-'+bi} x1={56 + 10 + (mi * qBeatsPerMeasure + bi) * NOTE_W_PORTRAIT} y1={STAFF_Y + 20} x2={56 + 10 + (mi * qBeatsPerMeasure + bi) * NOTE_W_PORTRAIT} y2={STAFF_Y + 23} stroke="#D3D1C7" strokeWidth={1} />
                        ))
                      )}
                      {/* Trail */}
                      {trail.map((t, i) => (
                        <rect key={'t'+i} x={56 + 10 + t.beat * NOTE_W_PORTRAIT} y={STAFF_Y + 13} width={Math.max(1, NOTE_W_PORTRAIT / 20)} height={6} fill={t.color} opacity={0.9} />
                      ))}
                    </g>
                  </svg>
                </div>
              )
            })()}
          </div>
        ) : (
          <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryPanel onSelect={loadExercise} onDrop={onDrop} dragOver={dragOver} setDragOver={setDragOver} progress={progress} currentId={currentMeta?.id} userId={user?.id} onProgressReset={() => import('@/lib/rhythmLibrary').then(({fetchProgress}) => fetchProgress(user?.id ?? null).then(setProgress))} />
          </div>
        )}

        {/* Countdown */}
        <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {countdown !== null && (
            <span style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 300, color: '#BA7517', lineHeight: 1 }}>{countdown}</span>
          )}
          {score && !playing && !countdown && (
            <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: pct >= 80 ? '#4CAF50' : '#1A1A18', margin: 0 }}>
              {score.hits}/{score.total} · {pct}% timing · {durationPct}% duration
            </p>
          )}
        </div>

        {/* Bottom controls */}
        {exercise && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setBpm(b => Math.max(40, b - 4))} disabled={playing}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '18px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1, flexShrink: 0 }}>−</button>
            <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', minWidth: '54px', textAlign: 'center' as const }}>{bpm} BPM</span>
            <button onClick={() => setBpm(b => Math.min(200, b + 4))} disabled={playing}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '18px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1, flexShrink: 0 }}>+</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setSoundEnabled(s => !s)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (soundEnabled ? '#1A1A18' : '#D3D1C7'), background: soundEnabled ? '#1A1A18' : 'white', color: soundEnabled ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
              {soundEnabled ? '♪ On' : '♪ Off'}
            </button>
            <button onClick={() => setShowDiag(d => !d)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (showDiag ? '#BA7517' : '#D3D1C7'), background: showDiag ? '#BA7517' : 'white', color: showDiag ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
              🔍 Diag
            </button>
            {!playing ? (
              <button onClick={playing ? stop : start}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                {score ? 'Try Again' : 'Start'}
              </button>
            ) : (
              <button onClick={stop}
                style={{ background: 'none', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '8px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                Stop
              </button>
            )}
          </div>
        )}

        {/* TAP button */}
        {exercise && (
          <button ref={tapBtnRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
            onContextMenu={e => e.preventDefault()} style={tapBtnStyle as React.CSSProperties}>
            {countdown !== null && !tapReady ? String(countdown) : liveFeedback === 'hit' ? '✓' : liveFeedback === 'miss' ? '✗' : playing ? 'TAP' : score ? 'Try Again' : 'Start'}
          </button>
        )}

      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', padding: '32px', userSelect: 'none' as const, WebkitUserSelect: 'none' as const, WebkitTouchCallout: 'none' as const }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#1A1A18', marginBottom: '4px' }}>Rhythm Trainer</h1>
            {exercise && currentMeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, padding: '2px 8px', borderRadius: '20px', background: DIFFICULTY_COLORS[currentMeta.difficulty], color: DIFFICULTY_TEXT[currentMeta.difficulty] }}>
                  {DIFFICULTY_LABEL[currentMeta.difficulty]}
                </span>
                <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>
                  {currentMeta.category} · {exercise.timeSignature.beats}/{exercise.timeSignature.beatType} · {bpm} BPM
                </span>
              </div>
            )}
            {exercise && !currentMeta && (
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>
                {exercise.timeSignature.beats}/{exercise.timeSignature.beatType} · {bpm} BPM
              </p>
            )}
          </div>
          {exercise && currentMeta && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => prevEx && loadExercise(prevEx)} disabled={!prevEx}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #D3D1C7', background: prevEx ? 'white' : '#F5F2EC', color: prevEx ? '#1A1A18' : '#D3D1C7', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: prevEx ? 'pointer' : 'default' }}>
                ←
              </button>
              <button onClick={() => nextEx && loadExercise(nextEx)} disabled={!nextEx}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid ' + (nextEx ? '#1A1A18' : '#D3D1C7'), background: nextEx ? '#1A1A18' : '#F5F2EC', color: nextEx ? 'white' : '#D3D1C7', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: nextEx ? 'pointer' : 'default' }}>
                →
              </button>
            </div>
          )}
          {exercise && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
              <button onClick={() => setSoundEnabled((s: boolean) => !s)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (soundEnabled ? '#1A1A18' : '#D3D1C7'), background: soundEnabled ? '#1A1A18' : 'white', color: soundEnabled ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                {soundEnabled ? '♪ On' : '♪ Off'}
              </button>
              {soundEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: '1px solid #D3D1C7', borderRadius: '20px', padding: '4px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: F, fontSize: '10px', color: '#888780' }}>Metro</span>
                    <input type="range" min={0} max={100} value={Math.round(metroVol * 100)}
                      onChange={e => setMetroVol(Number(e.target.value) / 100)}
                      style={{ width: '60px', accentColor: '#1A1A18' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: F, fontSize: '10px', color: '#888780' }}>Piano</span>
                    <input type="range" min={0} max={100} value={Math.round(pianoVol * 100)}
                      onChange={e => setPianoVol(Number(e.target.value) / 100)}
                      style={{ width: '60px', accentColor: '#1A1A18' }} />
                  </div>

                </div>
              )}
            </div>
          )}
          {exercise && (
            <button onClick={() => { setExercise(null); setCurrentMeta(null); stop() }}
              style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', background: 'none', border: '1px solid #D3D1C7', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer' }}>
              ← Library
            </button>
          )}
        </div>

        {/* Library view */}
        {!exercise && (
          <LibraryPanel
            onSelect={loadExercise}
            onDrop={onDrop}
            dragOver={dragOver}
            setDragOver={setDragOver}
            progress={progress}
            currentId={currentMeta?.id}
            userId={user?.id}
            onProgressReset={() => import('@/lib/rhythmLibrary').then(({fetchProgress}) => fetchProgress(user?.id ?? null).then(setProgress))}
          />
        )}

        {loadingExercise && (
          <div style={{ textAlign: 'center' as const, padding: '64px', color: '#888780', fontFamily: F, fontSize: '13px' }}>Loading…</div>
        )}

        {/* Exercise view */}
        {exercise && !loadingExercise && (
          <>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' as const }}>
              {(['notation', 'grid'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid ' + (view === v ? '#1A1A18' : '#D3D1C7'), background: view === v ? '#1A1A18' : 'white', color: view === v ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                  {v === 'notation' ? '𝄞 Notation' : '⊞ Grid'}
                </button>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                <button onClick={() => setBpm(b => Math.max(40, b - 4))} disabled={playing}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '16px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1 }}>−</button>
                <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', minWidth: '54px', textAlign: 'center' as const }}>{bpm} BPM</span>
                <button onClick={() => setBpm(b => Math.min(200, b + 4))} disabled={playing}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '16px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1 }}>+</button>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {score && !playing && (
                  <div style={{ textAlign: 'right' as const }}>
                    <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: pct === 100 ? '#4CAF50' : '#1A1A18', marginBottom: '2px' }}>
                      {score.hits}/{score.total} · {pct}%
                    </p>
                    {score.durationTotal > 0 && (
                      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780' }}>
                        Duration: {score.durationHits}/{score.durationTotal} · {Math.round(score.durationHits/score.durationTotal*100)}%
                      </p>
                    )}
                    {score.restTaps > 0 && (
                      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#E53935' }}>
                        {score.restTaps} tap{score.restTaps > 1 ? 's' : ''} on rests
                      </p>
                    )}
                  </div>
                )}
                {!playing ? (
                  <button onClick={start}
                    onKeyDown={e => e.code === 'Space' && e.preventDefault()}
                    style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                    {score ? 'Try Again' : 'Start'}
                  </button>
                ) : (
                  <button onClick={stop}
                    onKeyDown={e => e.code === 'Space' && e.preventDefault()}
                    style={{ background: 'none', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Countdown — overlaid on exercise area, no layout shift */}


            {/* Countdown — fixed strip above notation */}
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              {countdown !== null && (
                <span style={{ fontFamily: SERIF, fontSize: '48px', fontWeight: 300, color: '#BA7517', lineHeight: 1 }}>{countdown}</span>
              )}
            </div>

            {/* Notation / Grid */}
            <div style={{ position: 'relative' as const, marginBottom: '20px' }}>
            <div ref={landscapeContainerRef} style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '24px', overflow: 'hidden', position: 'relative' as const }}>

              {/* LANDSCAPE/DESKTOP: row-based notation */}
              {view === 'notation' && !isPortrait && rows.map((rowMeasures, rowIdx) => {
                const { measureW, noteW, beatsPerMeasure: bpm } = buildLayout(exercise, svgWidth, rowMeasures)
                const beatUnit = (() => { const isComp = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3; return isComp ? 3 * (4 / exercise.timeSignature.beatType) : 4 / exercise.timeSignature.beatType })()
                const contentW = 56 + rowMeasures.length * measureW + 7
                const actualSvgW = Math.max(svgWidth, contentW + 20)
                const isLastRow = rowIdx === rows.length - 1
                const lastBarlineX = 56 + rowMeasures.length * measureW
                return (
                  <svg key={rowIdx} width="100%" viewBox={`0 0 ${actualSvgW} ${SVG_H}`} style={{ display: 'block', marginBottom: rowIdx < rows.length - 1 ? '8px' : 0 }} preserveAspectRatio="xMinYMin meet">
                    {rowIdx === 0 && (
                      <>
                        <text x={34} y={STAFF_Y - 18} fontSize={40} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">
                          {String.fromCodePoint(0xE080 + exercise.timeSignature.beats)}
                        </text>
                        <text x={34} y={STAFF_Y + 8} fontSize={40} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">
                          {String.fromCodePoint(0xE080 + exercise.timeSignature.beatType)}
                        </text>
                      </>
                    )}
                    {/* Opening barline */}
                    <line x1={56} y1={STAFF_Y - 28} x2={56} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />
                    {/* Staff line ending at last barline */}
                    <line x1={56} y1={STAFF_Y} x2={lastBarlineX + 7} y2={STAFF_Y} stroke="#1A1A18" strokeWidth={1.2} />
                    {rowMeasures.map((measure, mIdx) => {
                      const mx = 56 + mIdx * measureW + 18
                      const barlineX = 56 + (mIdx + 1) * measureW
                      const globalMeasureIdx = rowIdx * MEASURES_PER_ROW + mIdx
                      const tapRes: ('hit'|'miss'|'none')[] = tapResults[globalMeasureIdx] ?? measure.notes.map(() => 'none' as const)
                      const isLastMeasure = isLastRow && mIdx === rowMeasures.length - 1
                      return (
                        <g key={mIdx}>
                          {renderMeasure(measure.notes, mx, noteW, tapRes, bpm, beatUnit)}
{/* Beat markers */}
                          {Array.from({ length: Math.round(bpm) }, (_, bi) => (
                            <line key={'bm'+bi} x1={mx - 8 + bi * noteW} y1={STAFF_Y + 20} x2={mx - 8 + bi * noteW} y2={STAFF_Y + 23} stroke="#D3D1C7" strokeWidth={1} />
                          ))}
                          {/* Trail */}
                          {trail.filter(t => t.beat >= globalMeasureIdx * bpm && t.beat < (globalMeasureIdx + 1) * bpm).map((t, i) => (
                            <rect key={'t'+i} x={mx - 8 + (t.beat - globalMeasureIdx * bpm) * noteW} y={STAFF_Y + 13} width={Math.max(1, noteW / 20)} height={6} fill={t.color} opacity={0.9} />
                          ))}
                          {!isLastMeasure && (
                            <line x1={barlineX} y1={STAFF_Y - 28} x2={barlineX} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />
                          )}
                          {isLastMeasure && (
                            <>
                              <line x1={barlineX} y1={STAFF_Y - 28} x2={barlineX} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1.2} />
                              <line x1={barlineX + 7} y1={STAFF_Y - 28} x2={barlineX + 7} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={6} />
                            </>
                          )}
                        </g>
                      )
                    })}
                    {/* Playhead */}
                    {(() => {
                      if (playhead === null || (!playing && countdown === null)) return null
                      const rowStartBeat = rowIdx * MEASURES_PER_ROW * bpm
                      const rowEndBeat = rowStartBeat + rowMeasures.length * bpm
                      if (playhead < rowStartBeat - 1 || playhead >= rowEndBeat) return null
                      const beatInRow = playhead - rowStartBeat
                      const x = 56 + 18 + beatInRow * noteW
                      return <line x1={x} y1={STAFF_Y - 32} x2={x} y2={STAFF_Y + 32} stroke="#BA7517" strokeWidth={1.5} opacity={0.7} style={{ pointerEvents: 'none' }} />
                    })()}
                  </svg>
                )
              })}

              {view === 'grid' && !isPortrait && (() => {
                const qBpmG = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
                const CELL_H = 48
                const GRID_ROW_H = CELL_H + 2
                return (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
                    {exercise.measures.map((measure, mIdx) => {
                      const measureStartBeat = mIdx * qBpmG
                      const measureEndBeat = measureStartBeat + qBpmG
                      const playheadInMeasure = playhead !== null && playhead >= measureStartBeat && playhead < measureEndBeat
                      const playheadPct = playheadInMeasure ? (playhead! - measureStartBeat) / qBpmG : null
                      return (
                        <div key={mIdx} style={{ display: 'flex', alignItems: 'stretch', gap: '6px', height: GRID_ROW_H }}>
                          {/* Measure number */}
                          <span style={{ fontFamily: F, fontSize: '10px', color: '#888780', width: '18px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{mIdx + 1}</span>
                          {/* Grid row */}
                          <div style={{ flex: 1, position: 'relative' as const, display: 'flex', gap: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid #D3D1C7' }}>
                            {measure.notes.map((note, nIdx) => {
                              const tr: 'hit'|'miss'|'none' = tapResults[mIdx]?.[nIdx] ?? 'none'
                              // Colors: note=dark, rest=empty/light, hit=green, miss=red
                              let bg = note.rest ? '#F0EDE8' : '#2A2A28'
                              if (tr === 'hit') bg = '#4CAF50'
                              if (tr === 'miss' && !note.rest) bg = '#E53935'
                              // Subdivision lines inside each block
                              const subdivisions = Math.round(note.durationBeats / (4 / exercise.timeSignature.beatType))
                              return (
                                <div key={nIdx} style={{ flex: note.durationBeats, position: 'relative' as const, background: bg, borderRight: nIdx < measure.notes.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', transition: 'background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {/* Subdivision markers */}
                                  {subdivisions > 1 && Array.from({ length: subdivisions - 1 }, (_, si) => (
                                    <div key={si} style={{ position: 'absolute' as const, left: `${((si + 1) / subdivisions) * 100}%`, top: '25%', bottom: '25%', width: '1px', background: note.rest ? '#D3D1C7' : 'rgba(255,255,255,0.15)' }} />
                                  ))}
                                  {/* Rest label */}
                                  {note.rest && tr === 'none' && (
                                    <span style={{ fontFamily: F, fontSize: '9px', color: '#888780', letterSpacing: '0.05em' }}>—</span>
                                  )}
                                </div>
                              )
                            })}
                            {/* Playhead line */}
                            {playheadPct !== null && (
                              <div style={{ position: 'absolute' as const, left: `${playheadPct * 100}%`, top: 0, bottom: 0, width: '2px', background: '#BA7517', opacity: 0.85, zIndex: 10, transform: 'translateX(-1px)', pointerEvents: 'none' as const }} />
                            )}
                            {/* Trail in grid */}
                            {trail.filter(t => t.beat >= measureStartBeat && t.beat < measureEndBeat).map((t, i) => (
                              <div key={i} style={{ position: 'absolute' as const, left: `${((t.beat - measureStartBeat) / qBpmG) * 100}%`, bottom: 0, width: '2px', height: '6px', background: t.color, opacity: 0.9 }} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            </div>

            {/* Diagnostic panel */}
            {showDiag && (
              <div style={{ background: '#1A1A18', borderRadius: '12px', padding: '12px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' as const }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888780', letterSpacing: '0.05em', margin: 0 }}>DIAGNOSTIC LOG</p>
                  <button onClick={() => navigator.clipboard.writeText(diagLog.join('\n'))}
                    style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888780', background: 'none', border: '1px solid #888780', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>Copy</button>
                </div>
                {diagLog.length === 0 && <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888780' }}>No taps yet</p>}
                {diagLog.map((line, i) => (
                  <p key={i} style={{ fontFamily: 'monospace', fontSize: '11px', color: line.includes('REST') ? '#E53935' : line.includes('SCORE') ? '#BA7517' : '#4CAF50', margin: '2px 0' }}>{line}</p>
                ))}
              </div>
            )}

            {/* Mobile tap button */}
            <button
              ref={tapBtnRef}
              onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
              onContextMenu={e => e.preventDefault()}
              className="rhythm-tap-btn"
              disabled={false}
              style={{
                width: '100%', height: '72px', borderRadius: '16px',
                border: liveFeedback === 'hit' ? '2px solid #4CAF50' : liveFeedback === 'miss' ? '2px solid #E53935' : '2px solid #D3D1C7',
                background: liveFeedback === 'hit' ? '#4CAF50' : liveFeedback === 'miss' ? '#E53935' : (playing && (countdown === null || tapReady)) ? '#1A1A18' : '#F5F2EC',
                color: liveFeedback ? 'white' : (playing && (countdown === null || tapReady)) ? 'white' : '#D3D1C7',
                fontFamily: F, fontSize: '15px', fontWeight: 300,
                cursor: (playing && (countdown === null || tapReady)) ? 'pointer' : 'default',
                transition: 'background 0.1s, border 0.1s',
                letterSpacing: '0.08em',
                userSelect: 'none' as const,
                WebkitUserSelect: 'none' as const,
                touchAction: 'none' as const,
                WebkitTouchCallout: 'none' as const
              }}>
              {(countdown !== null && !tapReady) ? String(countdown) : liveFeedback === 'hit' ? '✓' : liveFeedback === 'miss' ? '✗' : playing ? 'TAP' : score ? `${pct}% · dur ${durationPct}%` : '·'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
