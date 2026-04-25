'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CSSProperties } from 'react'
import type { RhythmExercise, RhythmNote } from '@/lib/parseMXL'
import type { RhythmExerciseMeta, RhythmProgress, RhythmProgramNode } from '@/lib/rhythmLibrary'
import { rhythmProgramTitle } from '@/lib/rhythmCatalog'
import { canAccessRhythmProgram, getRhythmProgramEntitlement, rhythmProgramRequiresPurchase } from '@/lib/rhythmPricing'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import AuthModal from '@/components/AuthModal'
import CalibrationModal from '@/components/programs/rhythm/CalibrationModal'
import VisualCalibrationModal from '@/components/programs/rhythm/VisualCalibrationModal'
import { getDeviceKey, getStoredOffsetSec, getVisualLeadSec } from '@/lib/programs/rhythm/calibration'

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

/** Soft layered shadow + top highlight so the card reads like paper on the cream ground. */
const RHYTHM_CARD_SHADOW =
  'inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 1px 1px rgba(26, 24, 20, 0.03), 0 4px 12px rgba(26, 24, 20, 0.05), 0 16px 40px rgba(26, 24, 20, 0.07), 0 32px 72px rgba(26, 24, 20, 0.05)'
const RHYTHM_CARD_BORDER = '1px solid rgba(211, 209, 199, 0.55)'

/** Trail samples in ref; React state throttled for SVG performance. */
const TRAIL_REF_CAP = 5000
const TRAIL_UI_EVERY_N_FRAMES = 4

/** Quarter-note beats before each row/pair boundary to trigger paging scroll (earlier shift; playhead space). */
const NOTATION_PAGE_SCROLL_LEAD_BEATS = 0.5

/** Desktop: schedule metronome clicks slightly later so heard click aligns with playhead/notation. */
const DESKTOP_METRO_CLICK_DELAY_SEC = 0.03

/** Countdown digits switch earlier by up to this many seconds.
 * The JS setCountdown call doesn't paint immediately — it goes through React's commit phase plus the next display vsync,
 * plus the panel's own response time. On observed desktop hardware this lag exceeds the 30ms click-scheduling delay, so
 * the cap that previously clamped this value to clickDelay has been lifted. 50ms compensates for ~3 frames of 60Hz display
 * lag plus typical panel response. The visual digit will fire slightly before the click is even scheduled on the audio
 * thread, but by the time the pixel actually paints it lands on the heard click. */
const COUNTDOWN_DISPLAY_LEAD_SEC = 0.050

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#EDE8DF', 2: '#EDE8DF', 3: '#EDE8DF', 4: '#EDE8DF', 5: '#EDE8DF'
}
const DIFFICULTY_TEXT: Record<number, string> = {
  1: '#7A7060', 2: '#7A7060', 3: '#7A7060', 4: '#7A7060', 5: '#7A7060'
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

/** Pixel distance to scroll so the next pair of SVG rows aligns to the top (matches real layout, not only SVG_H). */
function readPairScrollStridePx(scrollEl: HTMLDivElement | null, svgH: number, gap: number) {
  const fallback = 2 * (svgH + gap)
  if (!scrollEl) return fallback
  const svgs = scrollEl.querySelectorAll(':scope > svg')
  if (svgs.length >= 3) {
    const t0 = (svgs[0] as HTMLElement).offsetTop
    const t2 = (svgs[2] as HTMLElement).offsetTop
    const measured = t2 - t0
    // Bad layout reads (e.g. 0/1px) would freeze paging; stay close to real row geometry.
    return measured >= fallback * 0.4 ? measured : fallback
  }
  if (svgs.length === 2) {
    const t0 = (svgs[0] as HTMLElement).offsetTop
    const t1 = (svgs[1] as HTMLElement).offsetTop
    const step = t1 - t0
    const doubled = step * 2
    return doubled >= fallback * 0.4 ? doubled : fallback
  }
  return fallback
}

/**
 * Poll until AudioContext.currentTime > 0, which may take several frames in Safari after resume().
 * Timeout after 500ms to avoid hanging.
 */
async function waitForCtxClock(ctx: AudioContext): Promise<void> {
  const deadline = performance.now() + 500
  while (ctx.currentTime === 0 && performance.now() < deadline) {
    await new Promise<void>(r => requestAnimationFrame(() => r()))
  }
}

/**
 * Approximate seconds from AudioContext time to when audio is audible at the device output.
 * Safari/WebKit often buffers more than Chrome; `outputLatency` helps align UI and tap feedback.
 */
function getAudioOutputLatencySec(ctx: AudioContext): number {
  // Used only for tap-input scoring offset, NOT for playhead display.
  // outputLatency already includes baseLatency per the Web Audio spec.
  const ex = ctx as AudioContext & { outputLatency?: number }
  const sec = typeof ex.outputLatency === 'number' && Number.isFinite(ex.outputLatency) && ex.outputLatency > 0
    ? ex.outputLatency : 0
  return Math.min(Math.max(0, sec), 0.15)
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
    const noteColor = tr === 'hit' ? '#65C366' : tr === 'miss' ? '#ED6765' : '#1A1A18'

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
  onSelect, onDrop, dragOver, setDragOver, progress, currentId, userId, onProgressReset,
  tree, unlockOrder, loading, isDesktop,
  canAccessProgram = () => true,
  onUnlockCollection,
  checkingOut,
}: {
  onSelect: (meta: RhythmExerciseMeta) => void
  onDrop: (e: React.DragEvent) => void
  dragOver: boolean
  setDragOver: (v: boolean) => void
  progress: Record<string, RhythmProgress>
  currentId?: string
  userId?: string | null
  onProgressReset?: () => void
  tree: RhythmProgramNode[]
  unlockOrder: RhythmExerciseMeta[]
  loading: boolean
  isDesktop?: boolean
  /** Per `program_slug` — paid collections gate exercise list until purchased */
  canAccessProgram?: (programSlug: string) => boolean
  onUnlockCollection?: (programSlug: string) => void
  checkingOut?: boolean
}) {
  const [openProgramSlug, setOpenProgramSlug] = useState<string | null>(null)
  const [openCategoryKey, setOpenCategoryKey] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const unlockIndexMap = useMemo(() => {
    const m = new Map<string, number>()
    unlockOrder.forEach((e, i) => m.set(e.id, i))
    return m
  }, [unlockOrder])

  // Auto-open first accessible program + category when data arrives
  useEffect(() => {
    if (tree.length === 0) return
    const p = tree.find(prog => canAccessProgram(prog.slug)) ?? tree[0]
    setOpenProgramSlug(p.slug)
    const c0 = p.categories[0]
    if (c0 && canAccessProgram(p.slug)) setOpenCategoryKey(`${p.slug}::${c0.name}`)
  }, [tree, canAccessProgram])

  const categoryAccordionBtn = (isOpen: boolean) =>
    ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: isOpen ? '12px 12px 0 0' : '12px',
      border: '1px solid' + (isOpen ? '#1A1A18' : '#DDD8CA'),
      borderBottom: isOpen ? 'none' : '1px solid #DDD8CA',
      background: isOpen ? '#1A1A18' : 'white',
      cursor: 'pointer',
      textAlign: 'left' as const,
    }) satisfies CSSProperties

  const isExerciseUnlocked2 = (ex: RhythmExerciseMeta) => {
    const idx = unlockIndexMap.get(ex.id) ?? -1
    if (idx <= 0) return true
    const prev = unlockOrder[idx - 1]
    return prev ? (progress[prev.id]?.completed ?? false) : true
  }

  const renderExerciseRow = (ex: RhythmExerciseMeta, isLastRow: boolean) => {
    const isUnlocked = isExerciseUnlocked2(ex)
    const p = progress[ex.id]
    const isCurrent = ex.id === currentId
    const gIdx = (unlockIndexMap.get(ex.id) ?? 0) + 1
    return (
      <button key={ex.id} type="button"
        onClick={() => isUnlocked && onSelect(ex)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '11px 16px',
          borderBottom: isLastRow ? 'none' : '1px solid #EDE8DF',
          background: isCurrent ? '#F2EDDF' : isUnlocked ? 'white' : '#FDFAF3',
          cursor: isUnlocked ? 'pointer' : 'default',
          textAlign: 'left' as const, transition: 'background 0.1s', border: 'none',
          borderBottomWidth: isLastRow ? 0 : 1, borderBottomStyle: 'solid' as const, borderBottomColor: '#EDE8DF',
        }}
        onMouseEnter={e => { if (isUnlocked && !isCurrent) e.currentTarget.style.background = '#F2EDDF' }}
        onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? '#F2EDDF' : isUnlocked ? 'white' : '#FDFAF3' }}>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#DDD8CA', width: '24px', flexShrink: 0 }}>{gIdx}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 300, color: isUnlocked ? '#1A1A18' : '#B0AEA8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ex.title}</p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>{ex.beats}/{ex.beat_type} · {DIFFICULTY_LABEL[ex.difficulty]}</p>
        </div>
        {!isUnlocked && <span style={{ fontSize: 'var(--nl-text-meta)', opacity: 0.5 }}>🔒</span>}
        {isUnlocked && p?.completed && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#3B6D11', fontWeight: 500 }}>✓</span>}
        {isUnlocked && p && !p.completed && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B5402A' }}>{p.best_timing}%</span>}
        {isCurrent && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#B5402A', flexShrink: 0 }} />}
      </button>
    )
  }

  const resetBtn = (
    <button onClick={async () => {
      if (!confirm('Reset all progress? This will lock all exercises except the first.')) return
      const { resetProgress } = await import('@/lib/rhythmLibrary')
      await resetProgress(userId ?? null)
      onProgressReset?.()
    }} style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
      Reset progress
    </button>
  )

  const uploadDropzone = (
    <div style={{ marginTop: '16px' }}>
      <button onClick={() => setShowUpload(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: showUpload ? '12px 12px 0 0' : '12px', border: '1px solid #DDD8CA', borderBottom: showUpload ? 'none' : '1px solid #DDD8CA', background: '#FDFAF3', cursor: 'pointer', textAlign: 'left' as const }}>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>Load custom .mxl</span>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA' }}>{showUpload ? '▲' : '▼'}</span>
      </button>
      {showUpload && (
        <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          style={{ border: `1px solid ${dragOver ? '#B5402A' : '#DDD8CA'}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '32px 24px', textAlign: 'center' as const, background: dragOver ? '#F2EDDF' : 'white', transition: 'all 0.2s' }}>
          <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 300, color: '#7A7060', marginBottom: '4px' }}>Drop .mxl here</p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA' }}>Export from MuseScore</p>
        </div>
      )}
    </div>
  )

  // ── Desktop two-panel layout ──────────────────────────────────────────────
  if (isDesktop) {
    const activeProgram = tree.find(p => p.slug === openProgramSlug) ?? tree[0]
    const activeCat = activeProgram?.categories.find(c => `${activeProgram.slug}::${c.name}` === openCategoryKey)
      ?? activeProgram?.categories[0]

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#2A2318', margin: 0 }}>Exercises</h2>
          {resetBtn}
        </div>

        {loading && <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>Loading…</p>}

        {!loading && tree.length > 0 && (
          <div style={{ display: 'flex', gap: '0', background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', overflow: 'hidden', minHeight: '400px' }}>
            {/* Left nav */}
            <div style={{ width: '200px', flexShrink: 0, borderRight: '1px solid #EDE8DF', background: '#FDFAF3', display: 'flex', flexDirection: 'column' }}>
              {tree.map(program => {
                const locked = !canAccessProgram(program.slug)
                return (
                  <div key={program.slug}>
                    <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #EDE8DF' }}>
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#7A7060', margin: 0 }}>{rhythmProgramTitle(program.slug)}</p>
                    </div>
                    {locked ? (
                      <div style={{ padding: '12px 16px 16px', borderBottom: '1px solid #EDE8DF' }}>
                        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 10px', lineHeight: 1.4 }}>Sold separately — unlock to browse exercises.</p>
                        <button
                          type="button"
                          disabled={checkingOut}
                          onClick={() => onUnlockCollection?.(program.slug)}
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #1A1A18',
                            background: '#1A1A18', color: 'white', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: checkingOut ? 'default' : 'pointer',
                          }}
                        >
                          {checkingOut ? '…' : 'Unlock collection'}
                        </button>
                      </div>
                    ) : (
                      program.categories.map(cat => {
                        const catKey = `${program.slug}::${cat.name}`
                        const isActive = openCategoryKey === catKey
                        const catDone = cat.levels.reduce((a, l) => a + l.exercises.filter(e => progress[e.id]?.completed).length, 0)
                        const catTotal = cat.levels.reduce((a, l) => a + l.exercises.length, 0)
                        return (
                          <button key={catKey} type="button"
                            onClick={() => { setOpenProgramSlug(program.slug); setOpenCategoryKey(catKey) }}
                            style={{
                              width: '100%', textAlign: 'left' as const, padding: '10px 16px',
                              background: isActive ? '#1A1A18' : 'transparent',
                              border: 'none', borderBottom: '1px solid #EDE8DF',
                              cursor: 'pointer', transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#EDE8DF' }}
                            onMouseLeave={e => { e.currentTarget.style.background = isActive ? '#1A1A18' : 'transparent' }}>
                            <p style={{ fontFamily: SERIF, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: isActive ? 'white' : '#1A1A18', margin: '0 0 2px' }}>{cat.name}</p>
                            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: isActive ? 'rgba(255,255,255,0.5)' : '#B0AEA8', margin: 0 }}>{catDone}/{catTotal}</p>
                          </button>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>

            {/* Right content */}
            <div className="nl-hide-scrollbar" style={{ flex: 1, overflowY: 'auto' as const }}>
              {activeProgram && !canAccessProgram(activeProgram.slug) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', minHeight: '280px' }}>
                  <p style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: '#2A2318', margin: '0 0 8px' }}>{rhythmProgramTitle(activeProgram.slug)}</p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', margin: '0 0 20px', maxWidth: '360px', lineHeight: 1.5 }}>
                    This collection is available as a separate purchase. Unlock it to practice these exercises.
                  </p>
                  <button
                    type="button"
                    disabled={checkingOut}
                    onClick={() => onUnlockCollection?.(activeProgram.slug)}
                    style={{
                      padding: '10px 22px', borderRadius: '10px', border: '1px solid #1A1A18', background: '#1A1A18', color: 'white',
                      fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: checkingOut ? 'default' : 'pointer',
                    }}
                  >
                    {checkingOut ? '…' : 'Unlock collection'}
                  </button>
                </div>
              ) : activeCat ? activeCat.levels.map((levelNode, levelIdx) => {
                const isLastLevel = levelIdx === activeCat.levels.length - 1
                return (
                  <div key={levelNode.level}>
                    <div style={{ padding: '8px 16px 6px', background: '#FDFAF3', borderBottom: '1px solid #EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#7A7060' }}>Level {levelNode.level}</span>
                      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0AEA8' }}>{levelNode.exercises.filter(e => progress[e.id]?.completed).length}/{levelNode.exercises.length}</span>
                    </div>
                    {levelNode.exercises.map((ex, exIdx) => {
                      const isLastRow = isLastLevel && exIdx === levelNode.exercises.length - 1
                      return renderExerciseRow(ex, isLastRow)
                    })}
                  </div>
                )
              }) : null}
            </div>
          </div>
        )}

        {uploadDropzone}
      </div>
    )
  }

  // ── Mobile accordion layout ───────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: '560px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h2 style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#2A2318', margin: 0 }}>Exercises</h2>
        {resetBtn}
      </div>
      {!loading && tree.length === 1 && (
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 20px' }}>{rhythmProgramTitle(tree[0].slug)}</p>
      )}

      {loading && <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>Loading…</p>}

      {!loading && tree.map(program => {
        const multiProgram = tree.length > 1
        const programOpen = !multiProgram || openProgramSlug === program.slug
        const programTotal = program.categories.reduce(
          (acc, c) => acc + c.levels.reduce((a, l) => a + l.exercises.length, 0),
          0
        )
        const programDone = program.categories.reduce(
          (acc, c) => acc + c.levels.reduce(
            (a, l) => a + l.exercises.filter(e => progress[e.id]?.completed).length,
            0
          ),
          0
        )

        return (
          <div key={program.slug} style={{ marginBottom: multiProgram ? '12px' : '0' }}>
            {multiProgram && (
              <button
                type="button"
                onClick={() => setOpenProgramSlug(programOpen ? null : program.slug)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  marginBottom: '6px',
                  borderRadius: programOpen ? '12px 12px 0 0' : '12px',
                  border: '1px solid' + (programOpen ? '#1A1A18' : '#DDD8CA'),
                  borderBottom: programOpen ? 'none' : '1px solid #DDD8CA',
                  background: programOpen ? '#1A1A18' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <span style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 300, color: programOpen ? 'white' : '#1A1A18', flex: 1 }}>
                  {rhythmProgramTitle(program.slug)}
                </span>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: programOpen ? 'rgba(255,255,255,0.5)' : '#7A7060' }}>
                  {programDone}/{programTotal}
                </span>
                <div style={{ width: '48px', height: '3px', background: programOpen ? 'rgba(255,255,255,0.2)' : '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${programTotal ? (programDone / programTotal) * 100 : 0}%`, height: '100%', background: '#B5402A', borderRadius: '2px' }} />
                </div>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: programOpen ? 'rgba(255,255,255,0.6)' : '#7A7060' }}>{programOpen ? '▲' : '▼'}</span>
              </button>
            )}

            {programOpen && !canAccessProgram(program.slug) && (
              <div style={{ marginBottom: '12px', marginLeft: multiProgram ? '8px' : 0, padding: '16px', border: '1px solid #DDD8CA', borderRadius: '12px', background: 'white' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', margin: '0 0 12px', lineHeight: 1.45 }}>
                  Purchase <strong style={{ fontWeight: 500, color: '#2A2318' }}>{rhythmProgramTitle(program.slug)}</strong> to access these exercises.
                </p>
                <button
                  type="button"
                  disabled={checkingOut}
                  onClick={() => onUnlockCollection?.(program.slug)}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: '10px', border: '1px solid #1A1A18', background: '#1A1A18', color: 'white',
                    fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: checkingOut ? 'default' : 'pointer',
                  }}
                >
                  {checkingOut ? '…' : 'Unlock collection'}
                </button>
              </div>
            )}

            {programOpen && canAccessProgram(program.slug) && program.categories.map(cat => {
              const catKey = `${program.slug}::${cat.name}`
              const isCatOpen = openCategoryKey === catKey
              const catTotal = cat.levels.reduce((a, l) => a + l.exercises.length, 0)
              const catDone = cat.levels.reduce(
                (a, l) => a + l.exercises.filter(e => progress[e.id]?.completed).length,
                0
              )

              return (
                <div key={catKey} style={{ marginBottom: '6px', marginLeft: multiProgram ? '8px' : 0 }}>
                  <button type="button" onClick={() => setOpenCategoryKey(isCatOpen ? null : catKey)} style={categoryAccordionBtn(isCatOpen)}>
                    <span style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 300, color: isCatOpen ? 'white' : '#1A1A18', flex: 1 }}>{cat.name}</span>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: isCatOpen ? 'rgba(255,255,255,0.5)' : '#7A7060' }}>
                      {catDone}/{catTotal}
                    </span>
                    <div style={{ width: '48px', height: '3px', background: isCatOpen ? 'rgba(255,255,255,0.2)' : '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${catTotal ? (catDone / catTotal) * 100 : 0}%`, height: '100%', background: '#B5402A', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: isCatOpen ? 'rgba(255,255,255,0.6)' : '#7A7060' }}>{isCatOpen ? '▲' : '▼'}</span>
                  </button>

                  {isCatOpen && (
                    <div style={{ border: '1px solid #1A1A18', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                      {cat.levels.map((levelNode, levelIdx) => {
                        const levelTotal = levelNode.exercises.length
                        const levelDone = levelNode.exercises.filter(e => progress[e.id]?.completed).length
                        const isLastLevel = levelIdx === cat.levels.length - 1
                        return (
                          <div key={levelNode.level}>
                            <div
                              style={{
                                padding: '8px 16px 6px',
                                background: '#FDFAF3',
                                borderBottom: '1px solid #EDE8DF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7060' }}>
                                Level {levelNode.level}
                              </span>
                              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0AEA8' }}>{levelDone}/{levelTotal}</span>
                            </div>
                            {levelNode.exercises.map((ex, exIdx) => {
                              const isLastRow = isLastLevel && exIdx === levelNode.exercises.length - 1
                              return renderExerciseRow(ex, isLastRow)
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {uploadDropzone}

    </div>
  )
}


// ── Main page ─────────────────────────────────────────────────────────────────
export default function RhythmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const programExerciseId = searchParams.get('exercise')
  const returnTo = searchParams.get('returnTo')
  const [exercise, setExercise] = useState<RhythmExercise | null>(null)
  const [currentMeta, setCurrentMeta] = useState<RhythmExerciseMeta | null>(null)
  const [view, setView] = useState<'notation' | 'grid'>('notation')
  const [bpm, setBpm] = useState(72)
  const [playing, setPlaying] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownOverlayOpacity, setCountdownOverlayOpacity] = useState(1)
  const [tapReady, setTapReady] = useState(false)
  const tapReadyRef = useRef(false)
  const tapBtnRef = useRef<HTMLButtonElement>(null)
  const [playhead, setPlayhead] = useState<number | null>(null)  // absolute beat position (float)
  const [frozenScrollLeft, setFrozenScrollLeft] = useState<number | null>(null)
  const [taps, setTaps] = useState<number[]>([])
  const [tapDurations, setTapDurations] = useState<number[]>([])  // ms held per tap
  const keyDownTimeRef = useRef<number | null>(null)
  const pointerDownTimeRef = useRef<number | null>(null)
  const [tapResults, setTapResults] = useState<('hit'|'miss'|'none')[][]>([])
  const [liveFeedback, setLiveFeedback] = useState<'hit'|'miss'|null>(null)
  const trailRef = useRef<{ beat: number; color: string }[]>([])
  const trailUiTickRef = useRef(0)
  const [trail, setTrail] = useState<{ beat: number; color: string }[]>([])
  const isPressedRef = useRef(false)
  const effectiveBeatDurationRef = useRef(60 / 72)  // updated on start
  const [diagLog, setDiagLog] = useState<string[]>([])
  const DEBUG_TAPS = false
  const [showDiag, setShowDiag] = useState(false)
  // Audio is always enabled in Rhythm Trainer (volumes control the mix).
  const soundEnabledRef = useRef(true)
  const [showMixer, setShowMixer] = useState(false)
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
  const [libraryTree, setLibraryTree] = useState<RhythmProgramNode[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [showAuthRhythm, setShowAuthRhythm] = useState(false)
  const [checkingOutRhythm, setCheckingOutRhythm] = useState(false)
  const { user } = useAuth()
  const { hasPurchased, hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)

  const canAccessProgram = useCallback(
    (programSlug: string) => {
      if (purchasesLoading && rhythmProgramRequiresPurchase(programSlug)) return false
      return canAccessRhythmProgram(programSlug, { hasPurchased, hasSubscription })
    },
    [hasPurchased, hasSubscription, purchasesLoading]
  )

  const accessibleUnlockOrder = useMemo(
    () => allExercises.filter(ex => canAccessProgram(ex.program_slug)),
    [allExercises, canAccessProgram]
  )

  async function handleUnlockRhythmCollection(programSlug: string) {
    const { stripePriceId } = getRhythmProgramEntitlement(programSlug)
    if (!stripePriceId) return
    if (!user) {
      setShowAuthRhythm(true)
      return
    }
    setCheckingOutRhythm(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: stripePriceId,
          userId: user.id,
          userEmail: user.email,
          productType: `rhythm_${programSlug}`,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url as string
    } catch (e) {
      console.error(e)
      setCheckingOutRhythm(false)
    }
  }
  const containerRef = useRef<HTMLDivElement>(null)
  const landscapeContainerRef = useRef<HTMLDivElement>(null)
  /** Scrollable notation stack (desktop two-up); not used when fewer than 4 systems. */
  const notationScrollRef = useRef<HTMLDivElement>(null)
  const lastNotationPairScrollIdxRef = useRef(-1)
  const [isPortrait, setIsPortrait] = useState(false)
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [svgWidth, setSvgWidth] = useState(800)
  /** Content-box height of the desktop notation card (from ResizeObserver); drives SVG_H so the staff fits the slot. */
  const [desktopNotationContentH, setDesktopNotationContentH] = useState(0)
  /** Content-box height of the mobile notation card; used to size the single-staff SVG (mobile landscape can be very short). */
  const [mobileNotationCardH, setMobileNotationCardH] = useState(0)

  const useMobileLayout = isPortrait || isMobileLandscape

  const ctxRef = useRef<AudioContext | null>(null)
  const metroGainRef = useRef<GainNode | null>(null)
  const pianoGainRef = useRef<GainNode | null>(null)
  const rafRef = useRef(0)
  const startTimeRef = useRef(0)
  /** Subtracted from ctx.currentTime when driving playhead / tap beat so UI matches heard output (Safari). */
  const audioOutLatencyRef = useRef(0)
  /** User-specific timing offset (seconds) from CalibrationModal — covers Bluetooth latency, NMA, etc. */
  const userOffsetRef = useRef(0)
  /** Per-device visual lead in seconds — how much the JS state change leads the heard click to absorb display + render lag. */
  const visualLeadRef = useRef(0)
  const [showCalibration, setShowCalibration] = useState(false)
  const [showVisualCal, setShowVisualCal] = useState(false)

  const beatDuration = 60 / bpm
  const totalBeats = exercise ? exercise.timeSignature.beats * exercise.measures.length : 0

  const MEASURES_PER_ROW = (() => {
    if (!exercise) return 4
    const total = exercise.measures.length
    const qBpm = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
    const allN = exercise.measures.flatMap(m => m.notes)
    const smallest = allN.reduce((min, n) => Math.min(min, n.durationBeats), 1)
    const slotsPerMeasure = qBpm / smallest
    const minMeasureW = slotsPerMeasure * 32
    const cardW = svgWidth || 700
    // Desktop + exactly 4 measures: prefer 2 measures per staff row (2 rows) so we can show 2 measures at a time and page smoothly.
    // Keep this preference only if 4 measures would be cramped.
    if (!useMobileLayout && total === 4 && !(minMeasureW * 4 + 96 <= cardW) && (minMeasureW * 2 + 96 <= cardW)) return 2
    for (const candidate of [4, 2, 1]) {
      if (minMeasureW * candidate + 96 <= cardW) return candidate
    }
    return 1
  })()
  const numRows = exercise ? Math.ceil(exercise.measures.length / MEASURES_PER_ROW) : 1
  const availableH = typeof window !== 'undefined' ? Math.max(200, window.innerHeight - 440) : 300
  /** Prefer measured card height on desktop so notation fits the flex slot without page scroll. */
  const heightBudgetForSvg =
    !useMobileLayout && exercise
      ? (desktopNotationContentH > 0 ? Math.max(60, desktopNotationContentH) : availableH)
      : availableH
  const rowGap = 8
  const minStaffPx = 60
  const maxStaffPx = 240
  /** Four+ staff systems: show two systems at a time, smooth-scroll to the next pair when the playhead crosses. */
  const notationTwoRowPairPaging = Boolean(
    exercise && !useMobileLayout && view === 'notation' && numRows >= 4
  )
  /** Exactly two staff rows (e.g. four measures, two per row): page one system at a time — two measures visible. */
  const notationSingleRowPaging = Boolean(
    exercise &&
      !useMobileLayout &&
      view === 'notation' &&
      !notationTwoRowPairPaging &&
      numRows === 2 &&
      MEASURES_PER_ROW === 2 &&
      // If the card is tall enough to show both systems, don't page one-at-a-time.
      heightBudgetForSvg < (2 * minStaffPx + rowGap)
  )
  let SVG_H: number
  let pairViewportPx: number
  if (notationTwoRowPairPaging) {
    // Fill the notation card: two equal staves + one gap; pairViewportPx must not exceed measured card height.
    const maxPair = 2 * maxStaffPx + rowGap
    const budget = Math.floor(heightBudgetForSvg)
    const targetPair = Math.min(Math.max(0, budget), maxPair)
    const rawH = Math.floor((targetPair - rowGap) / 2)
    SVG_H =
      rawH < minStaffPx
        ? Math.max(40, rawH)
        : Math.min(maxStaffPx, rawH)
    pairViewportPx = 2 * SVG_H + rowGap
  } else if (notationSingleRowPaging) {
    const budget = Math.floor(heightBudgetForSvg)
    const target = Math.min(Math.max(0, budget), maxStaffPx)
    SVG_H = target < minStaffPx ? Math.max(40, target) : Math.min(maxStaffPx, Math.max(minStaffPx, target))
    pairViewportPx = SVG_H
  } else {
    SVG_H = Math.min(130, Math.max(minStaffPx, Math.floor((heightBudgetForSvg - rowGap * Math.max(0, numRows - 1)) / Math.max(1, numRows))))
    pairViewportPx = 2 * SVG_H + rowGap
  }
  const rows = exercise
    ? Array.from({ length: Math.ceil(exercise.measures.length / MEASURES_PER_ROW) },
        (_, i) => exercise.measures.slice(i * MEASURES_PER_ROW, (i + 1) * MEASURES_PER_ROW))
    : []
  /** Only used for the paging scroll wrapper: fixed height so content overflows; flex:1+maxHeight lets min-height:auto match full content and scroll never engages. */
  const notationDesktopScrollStyle: CSSProperties = {
    overflowX: 'hidden',
    // Do not set scrollBehavior here — with `smooth`, some browsers couple it to programmatic scroll and animations stall mid-way.
    flex: 'none' as const,
    flexShrink: 0,
    height: pairViewportPx,
    minHeight: pairViewportPx,
    maxHeight: pairViewportPx,
    // `overflow: hidden` during play can prevent or clamp scrollTop on some engines; keep a real scrollport (bar hidden via .nl-notation-scroll).
    overflowY: 'auto',
  }

  const resetNotationScroll = useCallback(() => {
    lastNotationPairScrollIdxRef.current = -1
    queueMicrotask(() => {
      const el = notationScrollRef.current
      if (el) el.scrollTop = 0
    })
  }, [])

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const portrait = h > w
      setIsPortrait(portrait)
      // Mobile landscape should mimic the portrait UI (not the desktop paging layout).
      const mobileLandscape = !portrait && (Math.min(w, h) <= 520) && (Math.max(w, h) <= 980)
      setIsMobileLandscape(mobileLandscape)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  // Load library + progress in parallel (library is cached after first fetch)
  useEffect(() => {
    import('@/lib/rhythmLibrary').then(({ fetchExerciseLibrary, fetchProgress }) => {
      Promise.all([fetchExerciseLibrary(), fetchProgress(user?.id ?? null)]).then(([lib, prog]) => {
        setAllExercises(lib.unlockOrder)
        setLibraryTree(lib.tree)
        setLibraryLoading(false)
        setProgress(prog)
        // Auto-load exercise from ?exercise= query param (deep link from programs)
        if (programExerciseId) {
          const meta = lib.unlockOrder.find(e => e.id === programExerciseId)
          if (meta) {
            import('@/lib/rhythmLibrary').then(({ fetchExerciseFile }) =>
              import('@/lib/parseMXL').then(({ parseMXL }) =>
                fetchExerciseFile(meta.id).then(buf => parseMXL(buf)).then(ex => {
                  setExercise(ex); setCurrentMeta(meta)
                })
              )
            )
          }
        }
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const el = useMobileLayout ? containerRef.current : landscapeContainerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const cr = entries[0].contentRect
      // Content box is already inside card padding; do not subtract again or viewBox is narrower than the real slot and staff sits left (xMin meet letterboxing).
      setSvgWidth(Math.max(0, cr.width))
      if (useMobileLayout) setMobileNotationCardH(cr.height)
      else setDesktopNotationContentH(cr.height)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [exercise, useMobileLayout])

  useEffect(() => {
    if (!exercise) {
      setDesktopNotationContentH(0)
      setMobileNotationCardH(0)
    }
  }, [exercise])

  // Desktop notation: smooth-scroll when playhead crosses row or row-pair boundaries.
  useEffect(() => {
    const paging = notationSingleRowPaging || notationTwoRowPairPaging
    if (!paging || playhead === null) return
    if (!playing && !previewing) return
    const el = notationScrollRef.current
    if (!el || !exercise) return
    const qBpm = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)

    if (notationTwoRowPairPaging) {
      // Playhead advances on the same qBpm grid as single-row paging; pair index must match that grid (not summed note durations).
      const beatsPerPair = 2 * MEASURES_PER_ROW * qBpm
      if (beatsPerPair <= 0) return
      const maxPairIdx = Math.max(0, Math.ceil(numRows / 2) - 1)
      const shifted = Math.max(0, playhead) + NOTATION_PAGE_SCROLL_LEAD_BEATS
      const pairIndex = Math.min(
        Math.max(0, Math.floor(shifted / beatsPerPair)),
        maxPairIdx,
      )
      if (pairIndex === lastNotationPairScrollIdxRef.current) return
      lastNotationPairScrollIdxRef.current = pairIndex
      const pairStridePx = readPairScrollStridePx(el, SVG_H, rowGap)
      el.scrollTo({ top: pairIndex * pairStridePx, behavior: 'smooth' })
      return
    }

    if (notationSingleRowPaging) {
      const beatsPerRow = MEASURES_PER_ROW * qBpm
      if (beatsPerRow <= 0) return
      const shifted = Math.max(0, playhead) + NOTATION_PAGE_SCROLL_LEAD_BEATS
      const idx = Math.floor(shifted / beatsPerRow)
      const maxIdx = Math.max(0, numRows - 1)
      const rowIndex = Math.min(idx, maxIdx)
      if (rowIndex === lastNotationPairScrollIdxRef.current) return
      lastNotationPairScrollIdxRef.current = rowIndex
      el.scrollTo({ top: rowIndex * (SVG_H + rowGap), behavior: 'smooth' })
    }
  }, [
    notationSingleRowPaging,
    notationTwoRowPairPaging,
    playhead,
    playing,
    previewing,
    exercise,
    MEASURES_PER_ROW,
    numRows,
    SVG_H,
    rowGap,
  ])

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
    const t = time + (!useMobileLayout ? DESKTOP_METRO_CLICK_DELAY_SEC : 0)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const dest = metroGainRef.current ?? ctx.destination
    osc.connect(gain); gain.connect(dest)
    osc.frequency.value = accent ? 1000 : 700
    gain.gain.setValueAtTime(accent ? 0.5 : 0.2, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc.start(t); osc.stop(t + 0.06)
  }

  const loadExercise = async (meta: RhythmExerciseMeta) => {
    if (purchasesLoading && rhythmProgramRequiresPurchase(meta.program_slug)) return
    if (!canAccessProgram(meta.program_slug)) return
    setLoadingExercise(true)
    try {
      const { fetchExerciseFile } = await import('@/lib/rhythmLibrary')
      const { parseMXL } = await import('@/lib/parseMXL')
      const buffer = await fetchExerciseFile(meta.id)
      const ex = await parseMXL(buffer)
      setExercise(ex); setCurrentMeta(meta)
      setScore(null); setTaps([]); setTapResults([]); setTrail([]); trailRef.current = []; trailUiTickRef.current = 0; setDiagLog([])
      resetNotationScroll()
    } finally {
      setLoadingExercise(false)
    }
  }

  const start = useCallback(async () => {
    if (!exercise) return
    cancelAnimationFrame(rafRef.current)
    setPreviewing(false)
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    // Safari: currentTime may remain 0 for many frames after resume() resolves.
    // Poll until the clock is actually ticking before reading currentTime.
    await waitForCtxClock(ctx)
    audioOutLatencyRef.current = getAudioOutputLatencySec(ctx)
    {
      const k = getDeviceKey(ctx)
      userOffsetRef.current = getStoredOffsetSec(k)
      visualLeadRef.current = getVisualLeadSec(k)
    }
    initSampler()  // load piano on first gesture
    setTaps([]); setScore(null); setTapResults([]); setTapDurations([]); trailRef.current = []; trailUiTickRef.current = 0; setTrail([]); setDiagLog([])
    setTapReady(false)
    tapReadyRef.current = false
    setCountdownOverlayOpacity(1)
    resetNotationScroll()
    setFrozenScrollLeft(null)
    setPlaying(true)

    const beatsPerMeasure = exercise.timeSignature.beats
    const isCompound = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3
    // Felt beats: compound meters feel in groups of 3 eighth notes
    const feltBeats = isCompound ? exercise.timeSignature.beats / 3 : exercise.timeSignature.beats
    // For compound: bpm = dotted-quarter BPM, so feltBeatDuration = 60/bpm
    // For simple: bpm = quarter BPM, so beatDuration = 60/bpm
    const feltBeatDuration = isCompound ? 60 / bpm : beatDuration
    const compoundBeatDuration = isCompound ? feltBeatDuration / 3 : beatDuration  // eighth note duration for compound
    const countdownBeats = feltBeats
    const countdownDuration = countdownBeats * feltBeatDuration
    const now = ctx.currentTime + 0.5  // extra buffer; Safari needs more time after clock stabilizes
    startTimeRef.current = now + countdownDuration
    // For compound: actual quarter note duration differs from beatDuration
    const effectiveBeatDuration = isCompound ? compoundBeatDuration * 2 : beatDuration
    effectiveBeatDurationRef.current = effectiveBeatDuration

    // Countdown clicks: accent on felt beats, subdivision clicks in between for compound
    for (let i = 0; i < feltBeats; i++) {
      playClick(now + i * feltBeatDuration, i === 0)
      if (isCompound) {
        playClick(now + i * feltBeatDuration + compoundBeatDuration, false)
        playClick(now + i * feltBeatDuration + compoundBeatDuration * 2, false)
      }
    }
    // For compound meters: click on felt beats (dotted quarters), not every quarter note
    if (isCompound) {
      const feltBeatCount = Math.round(totalBeats / 3)
      for (let i = 0; i < feltBeatCount; i++) {
        playClick(startTimeRef.current + i * feltBeatDuration, i % feltBeats === 0)
        // subdivision clicks on beats 2 and 3 of each dotted quarter
        playClick(startTimeRef.current + i * feltBeatDuration + compoundBeatDuration, false)
        playClick(startTimeRef.current + i * feltBeatDuration + compoundBeatDuration * 2, false)
      }
    } else {
      for (let i = 0; i < totalBeats; i++) playClick(startTimeRef.current + i * beatDuration, i % beatsPerMeasure === 0)
    }

    const countdownStart = now
    const tick = () => {
      const ctx2 = ctxRef.current; if (!ctx2) return
      const lat = audioOutLatencyRef.current
      /** Desktop metronome clicks are scheduled +DESKTOP_METRO_CLICK_DELAY_SEC; align countdown UI with heard clicks. */
      const clickDelay = !useMobileLayout ? DESKTOP_METRO_CLICK_DELAY_SEC : 0
      const countdownElapsed = ctx2.currentTime - lat - countdownStart
      if (countdownElapsed < countdownDuration) {
        // Heard click k ≈ countdownElapsed === clickDelay + k * feltBeatDuration. Display lead shifts all beat boundaries earlier
        // to compensate for React commit + display vsync + panel response. Per-device value (tuned via VisualCalibrationModal,
        // default DEFAULT_VISUAL_LEAD_MS) takes precedence over the constant fallback below.
        const displayLead = visualLeadRef.current > 0 ? visualLeadRef.current : Math.max(0, COUNTDOWN_DISPLAY_LEAD_SEC)
        const tAdj = countdownElapsed - clickDelay + displayLead
        if (tAdj < 0) {
          setCountdown(null)
        } else {
          const idx = Math.floor(tAdj / feltBeatDuration)
          setCountdown(Math.min(idx + 1, feltBeats))
        }
        const lastBeatT = (feltBeats - 1) * feltBeatDuration
        if (tAdj >= lastBeatT) {
          const te = (tAdj - lastBeatT) / feltBeatDuration
          setCountdownOverlayOpacity((1 - Math.min(1, Math.max(0, te))) ** 2)
        } else {
          setCountdownOverlayOpacity(1)
        }
        // Start playhead moving during last countdown beat (heard downbeat includes click delay + output latency)
        const timeToHeardDownbeat = startTimeRef.current + lat + clickDelay - ctx2.currentTime
        // Show playhead from 2 beats before downbeat
        if (timeToHeardDownbeat <= beatDuration) {
          setPlayhead(-timeToHeardDownbeat / beatDuration)
        }
        // Enable tap during last beat only
        if (timeToHeardDownbeat <= beatDuration) {
          tapReadyRef.current = true
          setTapReady(true)
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setCountdown(null)
      setCountdownOverlayOpacity(1)
      const elapsed = ctx2.currentTime - lat - userOffsetRef.current - startTimeRef.current
      const beatFloat = elapsed / effectiveBeatDuration
      const effectiveTotalBeats = exercise.measures.length * exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
      if (beatFloat >= effectiveTotalBeats) {
        setTrail([...trailRef.current])
        if (scrollRef.current) setFrozenScrollLeft(scrollRef.current.scrollLeft)
        setPlayhead(effectiveTotalBeats)
        setPlaying(false); setLiveFeedback(null)
        tapNoteRef.current = null
        // Close AudioContext to cancel any remaining scheduled clicks
        isPressedRef.current = false
        if (ctxRef.current) {
          ctxRef.current.close()
          ctxRef.current = null
          metroGainRef.current = null
          pianoGainRef.current = null
        }
        return
      }
      // Paint trail — green if pressing near a note, red if pressing on rest, gray if not pressing
      let trailColor = '#DDD8CA'
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
          trailColor = '#65C366'
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
          trailColor = strictlyOnRest ? '#ED6765' : '#65C366'
        }
      }
      trailRef.current.push({ beat: beatFloat, color: trailColor })
      while (trailRef.current.length > TRAIL_REF_CAP) trailRef.current.shift()
      trailUiTickRef.current += 1
      if (trailUiTickRef.current % TRAIL_UI_EVERY_N_FRAMES === 0) {
        setTrail([...trailRef.current])
      }
      setPlayhead(beatFloat)
      // Drive portrait scroll directly in RAF — bypass React render cycle
      if (scrollRef.current && exercise) {
        const allN = exercise.measures.flatMap((m: any) => m.notes)
        const smlDur = allN.reduce((mn: number, n: any) => Math.min(mn, n.durationBeats), 1)
        const nW = Math.max(40, 32 / smlDur)
        scrollRef.current.scrollLeft = NOTATION_PAGE_SCROLL_LEAD_BEATS * nW + beatFloat * nW
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [exercise, totalBeats, beatDuration, resetNotationScroll])


  // Portrait scroll: drive scrollLeft during playback, freeze at end
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (!playing && countdown === null && frozenScrollLeft === null) return
    if (!playing && countdown === null && frozenScrollLeft !== null) {
      el.scrollLeft = frozenScrollLeft
      return
    }
    if (countdown !== null && !playing) {
      // During countdown: scroll to pre-roll start position
      const allNotes = exercise ? exercise.measures.flatMap((m: any) => m.notes) : []
      const smallestDur = allNotes.reduce((min: number, n: any) => Math.min(min, n.durationBeats), 1)
      const noteW = Math.max(40, 32 / smallestDur)
      el.scrollLeft = NOTATION_PAGE_SCROLL_LEAD_BEATS * noteW
      return
    }
    if (playhead === null) return
    const allNotes = exercise ? exercise.measures.flatMap((m: any) => m.notes) : []
    const smallestDur = allNotes.reduce((min: number, n: any) => Math.min(min, n.durationBeats), 1)
    const noteW = Math.max(40, 32 / smallestDur)
    const clientCenter = el.clientWidth / 2
    const allNotes2 = exercise ? exercise.measures.flatMap((m: any) => m.notes) : []
    const smallestDur2 = allNotes2.reduce((min: number, n: any) => Math.min(min, n.durationBeats), 1)
    const noteW2 = Math.max(40, 32 / smallestDur2)
    const leadPx2 = NOTATION_PAGE_SCROLL_LEAD_BEATS * noteW2
    const target = leadPx2 + playhead * noteW  // at beat -0.5: target=0, at beat 0: target=leadPx2 (first note at center)
    el.scrollLeft = target
  }, [playhead, playing, countdown, frozenScrollLeft, exercise])

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
    setTrail([...trailRef.current])
    setCountdownOverlayOpacity(1)
    setPlaying(false); setPreviewing(false); setPlayhead(null); setCountdown(null); setLiveFeedback(null); setFrozenScrollLeft(null)
    tapNoteRef.current = null  // sound auto-decays
  }


  const startPreview = useCallback(async () => {
    if (!exercise) return
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') await ctx.resume()
    // Safari: currentTime may remain 0 for many frames after resume() resolves.
    await waitForCtxClock(ctx)
    audioOutLatencyRef.current = getAudioOutputLatencySec(ctx)
    {
      const k = getDeviceKey(ctx)
      userOffsetRef.current = getStoredOffsetSec(k)
      visualLeadRef.current = getVisualLeadSec(k)
    }
    cancelAnimationFrame(rafRef.current)
    setPreviewing(true)
    setPlaying(false)
    setPlayhead(null)
    setCountdown(null)
    setCountdownOverlayOpacity(1)
    resetNotationScroll()

    const isCompound = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3
    const feltBeats = isCompound ? exercise.timeSignature.beats / 3 : exercise.timeSignature.beats
    const feltBeatDuration = isCompound ? 60 / bpm : beatDuration
    const compoundBeatDuration = isCompound ? feltBeatDuration / 3 : beatDuration
    const effectiveBeatDuration = isCompound ? compoundBeatDuration * 2 : beatDuration
    effectiveBeatDurationRef.current = effectiveBeatDuration
    const beatsPerMeasure = exercise.timeSignature.beats
    const totalQBeats = exercise.measures.length * exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)

    const now = ctx.currentTime + 0.5  // extra buffer; Safari needs more time after clock stabilizes
    startTimeRef.current = now

    // Schedule metronome clicks
    if (isCompound) {
      const feltBeatCount = Math.round(totalBeats / 3)
      for (let i = 0; i < feltBeatCount; i++) {
        playClick(startTimeRef.current + i * feltBeatDuration, i % feltBeats === 0)
        playClick(startTimeRef.current + i * feltBeatDuration + compoundBeatDuration, false)
        playClick(startTimeRef.current + i * feltBeatDuration + compoundBeatDuration * 2, false)
      }
    } else {
      for (let i = 0; i < totalBeats; i++) playClick(startTimeRef.current + i * beatDuration, i % beatsPerMeasure === 0)
    }

    // Ensure piano buffer is loaded
    if (!pianoBufferRef.current) {
      try {
        const resp = await fetch('/samples/piano-g4.wav')
        const ab = await resp.arrayBuffer()
        pianoBufferRef.current = await ctx.decodeAudioData(ab)
      } catch(e) { console.error('preview buffer load failed', e) }
    }
    const pianoGain = pianoGainRef.current
    if (pianoBufferRef.current && soundEnabledRef.current) {
      let beatPos = 0
      for (const measure of exercise.measures) {
        for (const note of measure.notes) {
          if (!note.rest) {
            const noteTime = startTimeRef.current + beatPos * effectiveBeatDuration
            const source = ctx.createBufferSource()
            const gain = ctx.createGain()
            source.buffer = pianoBufferRef.current
            source.playbackRate.value = 261.63 / 392
            const dest = pianoGain ?? ctx.destination
            source.connect(gain); gain.connect(dest)
            const noteDur = Math.max(0.3, note.durationBeats * effectiveBeatDuration)
            gain.gain.setValueAtTime(1.0, noteTime)
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDur * 1.5)
            source.start(noteTime)
            source.stop(noteTime + noteDur * 1.5 + 0.1)
          }
          beatPos += note.durationBeats
        }
      }
    }

    const tick = () => {
      const ctx2 = ctxRef.current; if (!ctx2) return
      const lat = audioOutLatencyRef.current
      const elapsed = ctx2.currentTime - lat - userOffsetRef.current - startTimeRef.current
      const beatFloat = elapsed / effectiveBeatDuration
      const effectiveTotalBeats = totalQBeats
      setPlayhead(beatFloat)
      // Drive portrait scroll directly in RAF
      if (scrollRef.current && exercise) {
        const allN = exercise.measures.flatMap((m: any) => m.notes)
        const smlDur = allN.reduce((mn: number, n: any) => Math.min(mn, n.durationBeats), 1)
        const nW = Math.max(40, 32 / smlDur)
        scrollRef.current.scrollLeft = NOTATION_PAGE_SCROLL_LEAD_BEATS * nW + beatFloat * nW
      }
      // Color notes green as they sound
      if (exercise) {
        const newResults: ('hit'|'miss'|'none')[][] = exercise.measures.map((measure, mIdx) => {
          let bp = 0
          return measure.notes.map(note => {
            const globalBeat = mIdx * exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType) + bp
            const result = (!note.rest && beatFloat >= globalBeat) ? 'hit' : 'none'
            bp += note.durationBeats
            return result as 'hit'|'miss'|'none'
          })
        })
        setTapResults(newResults)
      }
      if (beatFloat >= effectiveTotalBeats) {
        setPlayhead(null); setPreviewing(false)
        if (ctxRef.current) {
          ctxRef.current.close()
          ctxRef.current = null
          metroGainRef.current = null
          pianoGainRef.current = null
        }
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [exercise, totalBeats, beatDuration, bpm, resetNotationScroll])

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
          audioOutLatencyRef.current = getAudioOutputLatencySec(ctx2)
          // Schedule slightly in the future — never subtract latency for tap audio,
          // as scheduling in the past causes unpredictable buffering in Safari.
          const when = ctx2.currentTime + 0.005
          if (pianoBufferRef.current) {
            const source = ctx2.createBufferSource()
            const gain = ctx2.createGain()
            source.buffer = pianoBufferRef.current
            source.playbackRate.value = 261.63 / 392  // G4 sample → C4
            const dest = pianoGainRef.current ?? ctx2.destination
            source.connect(gain); gain.connect(dest)
            gain.gain.setValueAtTime(1.0, when)
            gain.gain.exponentialRampToValueAtTime(0.001, when + 2)
            source.start(when); source.stop(when + 2)
          } else {
            const osc1 = ctx2.createOscillator()
            const osc2 = ctx2.createOscillator()
            const gain = ctx2.createGain()
            const dest = pianoGainRef.current ?? ctx2.destination
            osc1.connect(gain); osc2.connect(gain); gain.connect(dest)
            osc1.frequency.value = 261.63
            osc2.frequency.value = 523.25
            osc1.type = 'triangle'; osc2.type = 'sine'
            gain.gain.setValueAtTime(0.4, when)
            gain.gain.exponentialRampToValueAtTime(0.001, when + 1.5)
            osc1.start(when); osc2.start(when)
            osc1.stop(when + 1.5); osc2.stop(when + 1.5)
          }
        }
      }
      const kbElapsed = ctx.currentTime - audioOutLatencyRef.current - userOffsetRef.current - startTimeRef.current
      if (kbElapsed < -beatDuration * 1.5) return
      const beatFloat2 = kbElapsed < 0 ? 0 : kbElapsed / effectiveBeatDurationRef.current
      const beat = Math.round(beatFloat2)
      const clampedBeat = Math.max(0, Math.min(beatFloat2, totalBeats))
      if (DEBUG_TAPS) console.log('KB TAP: beatFloat='+beatFloat2.toFixed(3)+' clampedBeat='+clampedBeat.toFixed(3))
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
              const cur = newResults[nearest.mi][nearest.ni]
              if (cur === 'hit' && result === 'miss') return newResults
              newResults[nearest.mi][nearest.ni] = result
              return newResults
            })
          } else if (nearOnsetKB && onRestKB) {
            // Find the *single* nearest non-rest note onset across the whole
            // exercise (don't break early inside one measure — `posNR` would
            // freeze and every later measure's first non-rest note would
            // falsely re-match against the same beat position).
            let posNR = 0
            let bestNR: { mi: number; ni: number; dist: number } | null = null
            for (let miNR = 0; miNR < exercise.measures.length; miNR++) {
              for (let niNR = 0; niNR < exercise.measures[miNR].notes.length; niNR++) {
                const nNR = exercise.measures[miNR].notes[niNR]
                if (!nNR.rest) {
                  const d = Math.abs(posNR - clampedBeat)
                  if (d <= 0.75 && (!bestNR || d < bestNR.dist)) {
                    bestNR = { mi: miNR, ni: niNR, dist: d }
                  }
                }
                posNR += nNR.durationBeats
              }
            }
            if (bestNR) {
              setTapResults(prev => {
                const newResults = exercise.measures.map((m, mi) => prev[mi] ? [...prev[mi]] : m.notes.map(() => 'none' as const))
                if (newResults[bestNR.mi][bestNR.ni] !== 'hit') newResults[bestNR.mi][bestNR.ni] = 'hit'
                return newResults
              })
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
    const expectedEndMs: number[] = []
    const expectedDurationBeats: number[] = []
    let pos = 0
    const flatNotes = exercise.measures.flatMap(m => m.notes)
    const quarterMs = (effectiveBeatDurationRef.current || beatDuration) * 1000
    // Build expected onsets and expected end times (including ties).
    for (let i = 0; i < flatNotes.length; i++) {
      const n = flatNotes[i]
      const onsetBeats = pos
      if (!n.rest && !n.tieStop) {
        // If note is tied, duration is the whole tie chain.
        let tiedDurBeats = n.durationBeats
        if (n.tieStart) {
          for (let j = i + 1; j < flatNotes.length; j++) {
            const nj = flatNotes[j]
            if (!nj.tieStop) break
            tiedDurBeats += nj.durationBeats
            if (!nj.tieStart) break
          }
        }
        expected.push(onsetBeats)
        expectedDurationBeats.push(tiedDurBeats)
        expectedEndMs.push(tiedDurBeats * quarterMs)
      }
      pos += n.durationBeats
    }
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
    // Only score duration for quarter notes and longer (durationBeats >= 1.0).
    const scorableDurations = expectedEndMs
      .map((expMs, i) => ({ expMs, durationBeats: expectedDurationBeats[i] ?? 0, tapIdx: i }))
      .filter(x => x.durationBeats >= 1.0)

    const durationTotal = scorableDurations.length === 0 ? 0 : scorableDurations.length
    const durationHits = durationTotal === 0 ? 0 : scorableDurations.filter(({ expMs, tapIdx }) => {
      const heldMs = tapDurations[tapIdx]
      if (typeof heldMs !== 'number') return false

      // More "musical" duration scoring:
      // - evaluate absolute release-timing error in ms
      // - stricter for releasing early, more forgiving for holding slightly long
      // - include a small fixed ms slack so it feels human across tempos
      const bpmNum = bpm
      const tBpm = Math.max(0, Math.min(1, (bpmNum - 80) / 80)) // 0 at 80bpm, 1 at 160bpm+

      const errMs = heldMs - expMs // negative = early release, positive = late release
      const absSlack = 85 + 35 * tBpm // 85ms → 120ms

      // Fractional slack based on expected duration
      // Early: allow up to ~35–55% + absolute slack
      // Late:  allow up to ~55–80% + absolute slack
      const earlyFrac = 0.35 + 0.20 * tBpm
      const lateFrac = 0.55 + 0.25 * tBpm

      const earlyLimit = absSlack + earlyFrac * expMs
      const lateLimit = absSlack + lateFrac * expMs

      if (errMs < 0) return (-errMs) <= earlyLimit
      return errMs <= lateLimit
    }).length

    const finalScore = { hits: adjustedHits, total: expected.length, durationHits, durationTotal, restTaps }
    setScore(finalScore)
    setDiagLog(prev => {
      const trailSummary = trailRef.current.filter((_, i) => i % 10 === 0).map(t => `${t.beat.toFixed(2)}:${t.color === '#65C366' ? 'G' : t.color === '#ED6765' ? 'R' : '_'}`).join(' ')
      return [...prev, `SCORE hits=${finalScore.hits}/${finalScore.total} restTaps=${restTaps} noteTaps=[${noteTaps.map(t=>t.toFixed(2)).join(',')}] taps=[${taps.map(t=>t.toFixed(2)).join(',')}] expected=[${expected.map(e=>e.toFixed(1)).join(',')}]`, `TRAIL(every10): ${trailSummary}`]
    })
  }, [playing])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (!file) return
    const { parseMXL } = await import('@/lib/parseMXL')
    const ex = await parseMXL(await file.arrayBuffer())
    setExercise(ex); setCurrentMeta(null)
    setScore(null); setTaps([]); setTapResults([]); setTrail([]); trailRef.current = []; trailUiTickRef.current = 0
    resetNotationScroll()
  }, [resetNotationScroll])

  const handlePointerDown = useCallback(() => {
    isPressedRef.current = true
    initSampler()
    if (!playing) return
    if (countdown !== null && !tapReadyRef.current) return
    pointerDownTimeRef.current = performance.now()
    const ctx = getCtx(); if (!ctx) return
    void ctx.resume()
    audioOutLatencyRef.current = getAudioOutputLatencySec(ctx)
    {
      const k = getDeviceKey(ctx)
      userOffsetRef.current = getStoredOffsetSec(k)
      visualLeadRef.current = getVisualLeadSec(k)
    }
    if (DEBUG_TAPS) console.log('TAP: state='+ctx.state+' pianoBuffer='+!!pianoBufferRef.current+' pianoGain='+!!pianoGainRef.current)
    if (soundEnabledRef.current) {
      // Schedule slightly in the future — never subtract latency for tap audio,
      // as scheduling in the past causes unpredictable buffering in Safari.
      const when = ctx.currentTime + 0.005
      if (pianoBufferRef.current) {
        // Real piano sample
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        source.buffer = pianoBufferRef.current
        source.playbackRate.value = 261.63 / 392  // G4 sample → C4
        const pianoDest = pianoGainRef.current ?? ctx.destination
        source.connect(gain); gain.connect(pianoDest)
        gain.gain.setValueAtTime(1.0, when)
        gain.gain.exponentialRampToValueAtTime(0.001, when + 2)
        source.start(when)
        source.stop(when + 2)
      } else {
        // Fallback: piano-like synthesis
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
        osc1.frequency.value = 261.63
        osc2.frequency.value = 523.25
        osc1.type = 'triangle'; osc2.type = 'sine'
        gain.gain.setValueAtTime(0.3, when)
        gain.gain.exponentialRampToValueAtTime(0.001, when + 1.5)
        osc1.start(when); osc2.start(when)
        osc1.stop(when + 1.5); osc2.stop(when + 1.5)
      }
    }
    const elapsed = ctx.currentTime - audioOutLatencyRef.current - userOffsetRef.current - startTimeRef.current
    if (elapsed < -beatDuration * 1.5) return
    const beatFloatP = elapsed < 0 ? 0 : elapsed / effectiveBeatDurationRef.current
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
    // Real-time note coloring — nearest note *onset* (same idea as keyboard).
    // Span-based matching is wrong for long notes (e.g. whole in 4/4): beat 4 still lies inside
    // the first note's [0, 4+durationTol) window, so the next measure's tap recolors the previous note red.
    if (exercise) {
      const ONSET_MATCH = 0.75
      const HIT_TOL = 0.4
      const qPerMeasure = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
      let nearestTouch: { mi: number; ni: number; onset: number; dist: number } | null = null
      for (let mi = 0; mi < exercise.measures.length; mi++) {
        let bp = 0
        for (let ni = 0; ni < exercise.measures[mi].notes.length; ni++) {
          const n = exercise.measures[mi].notes[ni]
          const onsetGlobal = mi * qPerMeasure + bp
          if (!(n.rest || n.tieStop)) {
            const d = Math.abs(onsetGlobal - clampedBeat)
            if (d <= ONSET_MATCH && (!nearestTouch || d < nearestTouch.dist)) {
              nearestTouch = { mi, ni, onset: onsetGlobal, dist: d }
            }
          }
          bp += n.durationBeats
        }
      }
      if (nearestTouch) {
        const result: 'hit'|'miss' = nearestTouch.dist <= HIT_TOL ? 'hit' : 'miss'
        setTapResults(prev => {
          const newResults = exercise.measures.map((m, mi) => prev[mi] ? [...prev[mi]] : m.notes.map(() => 'none' as const))
          const { mi, ni } = nearestTouch!
          const cur = newResults[mi][ni]
          if (cur === 'hit' && result === 'miss') return newResults
          newResults[mi][ni] = result
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

  const pct = score && score.total > 0 ? Math.round(score.hits / score.total * 100) : 0
  const currentExIdx = currentMeta ? accessibleUnlockOrder.findIndex(e => e.id === currentMeta.id) : -1
  const prevEx = currentExIdx > 0 ? accessibleUnlockOrder[currentExIdx - 1] : null
  const currentCompleted = currentMeta ? (progress[currentMeta.id]?.completed ?? false) : false
  const nextExRaw = currentExIdx >= 0 && currentExIdx < accessibleUnlockOrder.length - 1 ? accessibleUnlockOrder[currentExIdx + 1] : null
  const nextEx = currentCompleted ? nextExRaw : null
  const durationPct = score && score.durationTotal > 0 ? Math.round(score.durationHits / score.durationTotal * 100) : 0


  // ── PORTRAIT / MOBILE LAYOUT ─────────────────────────────────────────────
  // Mobile landscape uses the same UI as portrait (no desktop paging layout).
  if (useMobileLayout) {
    // iOS Safari bottom toolbar can overlap content even with safe-area insets.
    // This guard keeps the TAP dock comfortably above it on most devices.
    const SAFARI_BOTTOM_GUARD_PX = 62

    const tapBtnStyle: React.CSSProperties = {
      width: '100%', height: '80px', borderRadius: '16px',
      border: liveFeedback === 'hit' ? '2px solid #65C366' : liveFeedback === 'miss' ? '2px solid #ED6765' : '2px solid #DDD8CA',
      background: liveFeedback === 'hit' ? '#65C366' : liveFeedback === 'miss' ? '#ED6765' : (playing && tapReady) ? '#1A1A18' : '#F2EDDF',
      color: liveFeedback ? 'white' : (playing && tapReady) ? 'white' : '#DDD8CA',
      fontFamily: F, fontSize: '18px', fontWeight: 300,
      cursor: 'pointer', transition: 'background 0.1s, border 0.1s',
      userSelect: 'none', WebkitUserSelect: 'none',
      touchAction: 'none', WebkitTouchCallout: 'none',
      letterSpacing: '0.08em', flexShrink: 0,
    }

    return (
      <div
        style={{
          height: '100dvh',
          background: '#F2EDDF',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 12px',
          gap: '8px',
          overflow: 'hidden',
          userSelect: 'none' as const,
          WebkitUserSelect: 'none' as const,
          WebkitTouchCallout: 'none' as const,
        }}
      >
        {/* Top bar: back + title + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {returnTo && (
            <button onClick={() => router.push(returnTo)}
              style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', background: 'none', border: '1px solid #DDD8CA', borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
              ← Program
            </button>
          )}
          {exercise && !returnTo && (
            <button onClick={() => { setExercise(null); setCurrentMeta(null); stop(); resetNotationScroll() }}
              style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', background: 'none', border: '1px solid #DDD8CA', borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
              ← Library
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {exercise && currentMeta ? (
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {currentMeta.title} · {exercise.timeSignature.beats}/{exercise.timeSignature.beatType} · {bpm} BPM
              </p>
            ) : (
              <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 300, color: '#2A2318', margin: 0 }}>Rhythm Trainer</p>
            )}
          </div>
          {exercise && currentMeta && (
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button onClick={() => prevEx && loadExercise(prevEx)} disabled={!prevEx}
                style={{ padding: '6px 10px', borderRadius: '20px', border: '1px solid ' + (prevEx ? '#1A1A18' : '#DDD8CA'), background: prevEx ? '#1A1A18' : '#F2EDDF', color: prevEx ? 'white' : '#DDD8CA', fontFamily: F, fontSize: 'var(--nl-text-compact)', cursor: prevEx ? 'pointer' : 'default' }}>←</button>
              <button onClick={() => nextEx && loadExercise(nextEx)} disabled={!nextEx}
                style={{ padding: '6px 10px', borderRadius: '20px', border: '1px solid ' + (nextEx ? '#1A1A18' : '#DDD8CA'), background: nextEx ? '#1A1A18' : '#F2EDDF', color: nextEx ? 'white' : '#DDD8CA', fontFamily: F, fontSize: 'var(--nl-text-compact)', cursor: nextEx ? 'pointer' : 'default' }}>→</button>
            </div>
          )}
          {/* Mixer control lives in the bottom tap dock on mobile. */}
        </div>

        {/* Mixer sheet (portrait) */}
        {showMixer && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}
            onClick={e => e.target === e.currentTarget && setShowMixer(false)}>
            <div style={{ position: 'absolute' as const, inset: 0, background: 'rgba(26,26,24,0.35)' }} />
            <div style={{ position: 'absolute' as const, left: 0, right: 0, bottom: 0, background: 'rgba(245,242,236,0.98)', borderTop: '1px solid #DDD8CA', borderTopLeftRadius: '18px', borderTopRightRadius: '18px', padding: '14px 14px 18px', boxShadow: '0 -14px 34px rgba(26,26,24,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', margin: 0 }}>Mixer</p>
                <button onClick={() => setShowMixer(false)} style={{ border: '1px solid #DDD8CA', background: '#FDFAF3', color: '#7A7060', borderRadius: '20px', padding: '6px 10px', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>Done</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#2A2318' }}>Click</span>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', fontVariantNumeric: 'tabular-nums' as any }}>{Math.round(metroVol * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={Math.round(metroVol * 100)}
                    onChange={e => setMetroVol(Number(e.target.value) / 100)}
                    style={{ width: '100%', accentColor: '#1A1A18' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#2A2318' }}>Piano</span>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', fontVariantNumeric: 'tabular-nums' as any }}>{Math.round(pianoVol * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={Math.round(pianoVol * 100)}
                    onChange={e => setPianoVol(Number(e.target.value) / 100)}
                    style={{ width: '100%', accentColor: '#1A1A18' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notation area */}
        {exercise ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <div
              ref={containerRef}
              style={{
                background: '#FDFAF3',
                borderRadius: '16px',
                border: RHYTHM_CARD_BORDER,
                boxShadow: RHYTHM_CARD_SHADOW,
                overflow: 'hidden',
                position: 'relative' as const,
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
            {countdown !== null && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background: 'rgba(26, 26, 24, 0.14)',
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  zIndex: 30,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: countdownOverlayOpacity,
                }}
              >
                <span style={{ fontFamily: SERIF, fontSize: 'clamp(48px, 14vmin, 88px)', fontWeight: 300, color: '#B5402A', lineHeight: 1 }}>{countdown}</span>
              </div>
            )}
            {/* Fixed playhead */}
            {(playing || previewing) && (countdown === null || (playhead !== null && playhead >= -1)) && (
              <div style={{ position: 'absolute' as const, left: '50%', top: 0, bottom: 0, width: '2px', background: '#B5402A', opacity: 0.6, zIndex: 10, pointerEvents: 'none' as const, transform: 'translateX(-3px)' }} />
            )}
            {view === 'notation' && (() => {
              const qBeatsPerMeasure = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
              const allNotesFlat = exercise.measures.flatMap(m => m.notes)
              const smallestDur = allNotesFlat.reduce((min: number, n: {durationBeats: number}) => Math.min(min, n.durationBeats), 1)
              const NOTE_W_PORTRAIT = Math.max(40, 32 / smallestDur)
              const totalBeatsAll = qBeatsPerMeasure * exercise.measures.length
              const totalW = totalBeatsAll * NOTE_W_PORTRAIT + 160
              const centerX = svgWidth / 2
              const staffSvgH = Math.max(110, Math.min(190, Math.floor(mobileNotationCardH > 0 ? mobileNotationCardH : 160)))
              const staffYOffset = Math.max(12, Math.floor((staffSvgH - 130) / 2))
              // Pre-roll: start 1 beat before beat 0
              const preRoll = 0  // offset handled by mx+18 positioning
              // playhead goes from -countdownBeats to totalBeats
              // at playhead=0, first note (x=56+18) should be at centerX
              // at playhead=0, first notehead (x=74) aligns with center playhead line
              const effectivePlayhead = playhead !== null ? playhead : 0
              const leadPx = NOTATION_PAGE_SCROLL_LEAD_BEATS * NOTE_W_PORTRAIT
              return (
                <div
                  ref={scrollRef}
                  className="nl-hide-scrollbar"
                  style={{ overflowX: 'scroll', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' as any }}
                >
                  <svg className="nl-notation-staff" width={totalW + centerX + 40 + leadPx} height={staffSvgH} style={{ display: 'block' }}>
                    <g transform={`translate(${centerX - 74 + leadPx}, ${staffYOffset})`}>
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
                          <line key={'bm'+mi+'-'+bi} x1={56 + 10 + (mi * qBeatsPerMeasure + bi) * NOTE_W_PORTRAIT} y1={STAFF_Y + 20} x2={56 + 10 + (mi * qBeatsPerMeasure + bi) * NOTE_W_PORTRAIT} y2={STAFF_Y + 23} stroke="#DDD8CA" strokeWidth={1} />
                        ))
                      )}
                      {/* Trail — smooth pills */}
                      {(() => {
                        const TY = STAFF_Y + 20
                        const TH = 8
                        const R = TH / 2
                        const originX = 56 + 10
                        // Baseline
                        const baseW = totalBeatsAll * NOTE_W_PORTRAIT
                        // Group into contiguous same-color runs
                        type Run = { beats: number[]; color: string }
                        const runs: Run[] = []
                        for (const t of trail) {
                          const last = runs[runs.length - 1]
                          if (last && last.color === t.color && t.beat - last.beats[last.beats.length - 1] < 0.09) {
                            last.beats.push(t.beat)
                          } else {
                            runs.push({ beats: [t.beat], color: t.color })
                          }
                        }
                        return (
                          <>
                            <rect x={originX} y={TY + 1} width={baseW} height={1} fill="rgba(211,209,199,0.5)" rx={0.5} />
                            {runs.map((run, i) => {
                              const isGreen = run.color === '#65C366'
                              const isRed = run.color === '#ED6765'
                              if (!isGreen && !isRed) return null
                              const x1 = originX + run.beats[0] * NOTE_W_PORTRAIT
                              const x2 = originX + run.beats[run.beats.length - 1] * NOTE_W_PORTRAIT
                              const w = Math.max(TH, x2 - x1 + NOTE_W_PORTRAIT / 16)
                              const fill = isGreen ? '#65C366' : '#ED6765'
                              const fillBg = isGreen ? 'rgba(101,195,102,0.12)' : 'rgba(237,103,101,0.12)'
                              const isDot = w <= TH + 2
                              return (
                                <g key={i}>
                                  {isDot ? (
                                    <circle cx={x1} cy={TY + R} r={R} fill={fill} opacity={0.9} />
                                  ) : (
                                    <>
                                      <rect x={x1 - R} y={TY} width={w} height={TH} rx={R} fill={fillBg} />
                                      <rect x={x1 - R} y={TY} width={w} height={TH} rx={R} fill="none" stroke={fill} strokeWidth={1.5} opacity={0.95} />
                                    </>
                                  )}
                                </g>
                              )
                            })}
                          </>
                        )
                      })()}
                    </g>
                  </svg>
                </div>
              )
            })()}
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="nl-hide-scrollbar" style={{ flex: 1, overflowY: 'auto' as const, padding: '4px 0 8px' }}>
            <LibraryPanel onSelect={loadExercise} onDrop={onDrop} dragOver={dragOver} setDragOver={setDragOver} progress={progress} currentId={currentMeta?.id} userId={user?.id} onProgressReset={() => import('@/lib/rhythmLibrary').then(({fetchProgress}) => fetchProgress(user?.id ?? null).then(setProgress))} tree={libraryTree} unlockOrder={accessibleUnlockOrder} loading={libraryLoading} canAccessProgram={canAccessProgram} onUnlockCollection={handleUnlockRhythmCollection} checkingOut={checkingOutRhythm} />
          </div>
        )}

        {/* Bottom dock (keeps TAP at bottom, no scroll) */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: `calc(env(safe-area-inset-bottom) + ${SAFARI_BOTTOM_GUARD_PX}px)` }}>
          {/* Score */}
          <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {score && !playing && !countdown && (
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: pct >= 80 ? '#3B6D11' : '#1A1A18', margin: 0 }}>
                {score.hits}/{score.total} · {pct}% timing · {durationPct}% duration
              </p>
            )}
          </div>

          {/* Bottom controls */}
          {exercise && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => setBpm(b => Math.max(40, b - 4))} disabled={playing}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #DDD8CA', background: '#FDFAF3', color: '#7A7060', fontFamily: F, fontSize: '18px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1, flexShrink: 0 }}>−</button>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#2A2318', minWidth: '54px', textAlign: 'center' as const }}>{bpm} BPM</span>
              <button onClick={() => setBpm(b => Math.min(200, b + 4))} disabled={playing}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #DDD8CA', background: '#FDFAF3', color: '#7A7060', fontFamily: F, fontSize: '18px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1, flexShrink: 0 }}>+</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowCalibration(true)} disabled={playing}
                title="Calibrate audio timing for your headphones / device"
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #DDD8CA', background: 'white', color: '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: playing ? 'default' : 'pointer', opacity: playing ? 0.4 : 1 }}>
                Calibrate
              </button>
              <button onClick={() => setShowVisualCal(true)} disabled={playing}
                title="Tune the countdown so the digit matches the click sound"
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #DDD8CA', background: 'white', color: '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: playing ? 'default' : 'pointer', opacity: playing ? 0.4 : 1 }}>
                Visual sync
              </button>
              <button onClick={() => setShowMixer(v => !v)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (showMixer ? '#1A1A18' : '#DDD8CA'), background: showMixer ? '#1A1A18' : 'white', color: showMixer ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
                Mixer
              </button>
              <button onClick={previewing ? stop : startPreview} disabled={playing}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid ' + (previewing ? '#B5402A' : '#DDD8CA'), background: previewing ? '#B5402A' : 'white', color: previewing ? 'white' : '#7A7060', fontSize: 'var(--nl-text-compact)', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: playing ? 0.4 : 1 }}>
                {previewing ? '■' : '▶'}
              </button>
              <button onClick={playing ? stop : start}
                style={{ background: playing ? 'none' : '#1A1A18', color: playing ? '#7A7060' : 'white', border: playing ? '1px solid #DDD8CA' : 'none', borderRadius: '10px', padding: '8px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
                {playing ? 'Stop' : score ? 'Try Again' : 'Start'}
              </button>
            </div>
          )}

          {/* TAP button */}
          {exercise && (
            <button ref={tapBtnRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
              onContextMenu={e => e.preventDefault()} style={tapBtnStyle as React.CSSProperties}>
              {countdown !== null && !tapReady ? String(countdown) : liveFeedback === 'hit' ? '✓' : liveFeedback === 'miss' ? '✗' : playing ? 'TAP' : '·'}
            </button>
          )}
        </div>

        {showAuthRhythm && <AuthModal onClose={() => setShowAuthRhythm(false)} onSuccess={() => setShowAuthRhythm(false)} />}
        <CalibrationModal
          open={showCalibration}
          onClose={() => setShowCalibration(false)}
          onCalibrated={() => {
            // Refresh the trainer's cached offset so the next start() picks up the new value
            // even if the user starts an exercise before the modal closes.
            try {
              const ctx = ctxRef.current
              if (ctx) userOffsetRef.current = getStoredOffsetSec(getDeviceKey(ctx))
            } catch {}
          }}
        />
        <VisualCalibrationModal
          open={showVisualCal}
          onClose={() => setShowVisualCal(false)}
          onCalibrated={() => {
            try {
              const ctx = ctxRef.current
              if (ctx) visualLeadRef.current = getVisualLeadSec(getDeviceKey(ctx))
            } catch {}
          }}
        />
      </div>
    )
  }

  const desktopExerciseLocked = Boolean(exercise && !loadingExercise)

  return (
    <div
      style={{
        minHeight: 'calc(100svh - 64px)',
        height: 'calc(100dvh - 64px)',
        maxHeight: 'calc(100dvh - 64px)',
        background: '#F2EDDF',
        padding: '20px 32px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
        WebkitTouchCallout: 'none' as const,
      }}
    >
      <div
        className={!desktopExerciseLocked ? 'nl-hide-scrollbar' : undefined}
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
          ...(desktopExerciseLocked
            ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'visible' }
            : { flex: 1, minHeight: 0, overflow: 'auto' }),
        }}
      >

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={() => {
                if (returnTo) {
                  router.push(returnTo)
                } else if (exercise) {
                  setExercise(null)
                  setCurrentMeta(null)
                  stop()
                  resetNotationScroll()
                } else {
                  router.push('/tools')
                }
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', padding: 0, marginBottom: '8px', display: 'block' }}
            >
              {returnTo ? '← Program' : exercise ? '← Library' : '← Back'}
            </button>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '4px' }}>Rhythm Trainer</h1>
            {!exercise && (
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 0', maxWidth: '500px', lineHeight: 1.6 }}>
                Select an exercise, then press ▶ to hear it or <strong style={{ fontWeight: 400, color: '#2A2318' }}>Start</strong> to tap along. Hit <strong style={{ fontWeight: 400, color: '#2A2318' }}>TAP</strong> on each note — hold for longer notes, rest for rests.
              </p>
            )}
            {exercise && currentMeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, padding: '2px 8px', borderRadius: '20px', background: DIFFICULTY_COLORS[currentMeta.difficulty], color: DIFFICULTY_TEXT[currentMeta.difficulty] }}>
                  {DIFFICULTY_LABEL[currentMeta.difficulty]}
                </span>
                {currentExIdx >= 0 && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, padding: '2px 8px', borderRadius: '20px', border: '1px solid #DDD8CA', background: 'rgba(255,255,255,0.7)', color: '#7A7060' }}>
                    #{currentExIdx + 1}
                  </span>
                )}
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>
                  {currentMeta.category} · {exercise.timeSignature.beats}/{exercise.timeSignature.beatType} · {bpm} BPM
                </span>
              </div>
            )}
            {exercise && !currentMeta && (
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>
                {exercise.timeSignature.beats}/{exercise.timeSignature.beatType} · {bpm} BPM
              </p>
            )}
          </div>
          {exercise && currentMeta && (
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, paddingTop: '2px' }}>
              <button onClick={() => prevEx && loadExercise(prevEx)} disabled={!prevEx}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #DDD8CA', background: prevEx ? 'white' : '#F2EDDF', color: prevEx ? '#1A1A18' : '#DDD8CA', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: prevEx ? 'pointer' : 'default' }}>
                ← Prev
              </button>
              <button onClick={() => nextEx && loadExercise(nextEx)} disabled={!nextEx}
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid ' + (nextEx ? '#1A1A18' : '#DDD8CA'), background: nextEx ? '#1A1A18' : '#F2EDDF', color: nextEx ? 'white' : '#DDD8CA', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: nextEx ? 'pointer' : 'default' }}>
                Next →
              </button>
            </div>
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
            tree={libraryTree}
            unlockOrder={accessibleUnlockOrder}
            loading={libraryLoading}
            isDesktop
            canAccessProgram={canAccessProgram}
            onUnlockCollection={handleUnlockRhythmCollection}
            checkingOut={checkingOutRhythm}
          />
        )}

        {loadingExercise && (
          <div style={{ textAlign: 'center' as const, padding: '64px', color: '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-meta)' }}>Loading…</div>
        )}

        {/* Exercise view */}
        {exercise && !loadingExercise && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
            {/* Mixer popover (desktop/landscape) */}
            {showMixer && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 120 }}
                onClick={e => e.target === e.currentTarget && setShowMixer(false)}>
                <div style={{ position: 'absolute' as const, inset: 0, background: 'rgba(26,26,24,0.18)' }} />
                <div style={{ position: 'absolute' as const, left: '24px', bottom: 'calc(108px + env(safe-area-inset-bottom, 0px))', width: '320px', maxWidth: 'calc(100vw - 48px)', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(211,209,199,0.9)', borderRadius: '16px', padding: '14px', boxShadow: '0 18px 44px rgba(26,26,24,0.16)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' as any }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', margin: 0 }}>Mixer</p>
                    <button onClick={() => setShowMixer(false)} style={{ border: '1px solid #DDD8CA', background: '#FDFAF3', color: '#7A7060', borderRadius: '20px', padding: '6px 10px', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>Done</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#2A2318' }}>Click</span>
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', fontVariantNumeric: 'tabular-nums' as any }}>{Math.round(metroVol * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={Math.round(metroVol * 100)}
                        onChange={e => setMetroVol(Number(e.target.value) / 100)}
                        style={{ width: '100%', accentColor: '#1A1A18' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#2A2318' }}>Piano</span>
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', fontVariantNumeric: 'tabular-nums' as any }}>{Math.round(pianoVol * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={Math.round(pianoVol * 100)}
                        onChange={e => setPianoVol(Number(e.target.value) / 100)}
                        style={{ width: '100%', accentColor: '#1A1A18' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="nl-rt-controlbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' as const, flexShrink: 0 }}>
              {/* View */}
              <div className="nl-rt-seg" style={{ position: 'relative' as const, display: 'flex', alignItems: 'center', padding: '3px', borderRadius: '999px', border: '1px solid rgba(211,209,199,0.9)', background: 'rgba(255,255,255,0.65)', overflow: 'hidden' }}>
                <div
                  className="nl-rt-seg-thumb"
                  style={{
                    position: 'absolute' as const,
                    top: '3px',
                    bottom: '3px',
                    left: view === 'notation' ? '3px' : 'calc(50% + 2px)',
                    width: 'calc(50% - 5px)',
                    borderRadius: '999px',
                    background: '#1A1A18',
                    boxShadow: '0 6px 18px rgba(26,26,24,0.14)',
                    transition: 'left 180ms ease',
                    pointerEvents: 'none' as const,
                  }}
                />
                <button
                  onClick={() => setView('notation')}
                  className="nl-rt-seg-btn"
                  style={{
                    position: 'relative' as const,
                    zIndex: 2,
                    flex: 1,
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid transparent',
                    background: 'transparent',
                    color: view === 'notation' ? 'white' : '#7A7060',
                    fontFamily: F,
                    fontSize: 'var(--nl-text-compact)',
                    fontWeight: 300,
                    cursor: 'pointer',
                    transition: 'color 180ms ease, transform 120ms ease',
                    minWidth: '120px',
                  }}
                >
                  𝄞 Notation
                </button>
                <button
                  onClick={() => setView('grid')}
                  className="nl-rt-seg-btn"
                  style={{
                    position: 'relative' as const,
                    zIndex: 2,
                    flex: 1,
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid transparent',
                    background: 'transparent',
                    color: view === 'grid' ? 'white' : '#7A7060',
                    fontFamily: F,
                    fontSize: 'var(--nl-text-compact)',
                    fontWeight: 300,
                    cursor: 'pointer',
                    transition: 'color 180ms ease, transform 120ms ease',
                    minWidth: '120px',
                  }}
                >
                  ⊞ Grid
                </button>
              </div>

              {/* Tempo */}
              <div className="nl-rt-tempo" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', borderRadius: '999px', border: '1px solid rgba(211,209,199,0.9)', background: 'rgba(255,255,255,0.65)' }}>
                <button onClick={() => setBpm(b => Math.max(40, b - 4))} disabled={playing}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(211,209,199,0.9)', background: 'rgba(255,255,255,0.9)', color: '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-base)', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1, transition: 'transform 120ms ease' }}>−</button>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#2A2318', minWidth: '60px', textAlign: 'center' as const, fontVariantNumeric: 'tabular-nums' as any }}>{bpm} BPM</span>
                <button onClick={() => setBpm(b => Math.min(200, b + 4))} disabled={playing}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(211,209,199,0.9)', background: 'rgba(255,255,255,0.9)', color: '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-base)', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1, transition: 'transform 120ms ease' }}>+</button>
              </div>

              {/* Score (secondary) — light text for dark glass control bar */}
              <div className="nl-rt-score" style={{ minWidth: '240px', minHeight: '46px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignSelf: 'center' }}>
                {(() => {
                  const labelW = '74px'
                  const bar = {
                    label: 'rgba(255,255,255,0.82)',
                    muted: 'rgba(255,255,255,0.45)',
                    value: 'rgba(255,255,255,0.96)',
                    valueSoft: 'rgba(255,255,255,0.88)',
                    perfect: '#C8F0A8',
                  } as const
                  const valueFont = {
                    fontFamily: F,
                    fontSize: 'var(--nl-text-meta)',
                    fontVariantNumeric: 'tabular-nums' as any,
                    lineHeight: 1.3,
                    letterSpacing: '0.02em',
                  } as const
                  const labelStyle = {
                    ...valueFont,
                    width: labelW,
                    fontSize: 'var(--nl-text-compact)',
                    color: score && !playing ? bar.label : bar.muted,
                    fontWeight: 400,
                    flexShrink: 0,
                    textAlign: 'right' as const,
                    paddingRight: '6px',
                  } as const
                  const done = Boolean(score && !playing)
                  const accValue = done ? `${score!.hits}/${score!.total} · ${pct}%` : '—'
                  const durValue = done && score!.durationTotal > 0
                    ? `${score!.durationHits}/${score!.durationTotal} · ${Math.round(score!.durationHits / score!.durationTotal * 100)}%`
                    : '—'
                  const accValColor = !done ? bar.muted : (pct === 100 ? bar.perfect : bar.value)
                  const durValColor = !done ? bar.muted : bar.valueSoft
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                        <span style={labelStyle}>Accuracy:</span>
                        <span style={{ ...valueFont, color: accValColor, fontWeight: 500 }}>{accValue}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                        <span style={labelStyle}>Duration:</span>
                        <span style={{ ...valueFont, color: durValColor, fontWeight: 500 }}>{durValue}</span>
                      </div>
                    </>
                  )
                })()}
                {score && !playing && score.restTaps > 0 && (
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#A32D2D', margin: '2px 0 0', lineHeight: 1.2, textAlign: 'center' as const }}>
                    {score.restTaps} tap{score.restTaps > 1 ? 's' : ''} on rests
                  </p>
                )}
              </div>
            </div>

            {/* Notation / Grid — flex:grow so staff scales to remaining viewport (no page scroll). */}
            <div style={{ position: 'relative' as const, marginBottom: '8px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              ref={landscapeContainerRef}
              className="nl-hide-scrollbar"
              style={{
                background: '#FDFAF3',
                borderRadius: '16px',
                border: RHYTHM_CARD_BORDER,
                boxShadow: RHYTHM_CARD_SHADOW,
                padding: '24px',
                overflowX: 'hidden',
                overflowY: view === 'grid' ? 'auto' : 'hidden',
                position: 'relative' as const,
                flex: 1,
                minHeight: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {countdown !== null && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    background: 'rgba(26, 26, 24, 0.14)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    zIndex: 30,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: countdownOverlayOpacity,
                  }}
                >
                  <span style={{ fontFamily: SERIF, fontSize: 'clamp(48px, 12vmin, 88px)', fontWeight: 300, color: '#B5402A', lineHeight: 1 }}>{countdown}</span>
                </div>
              )}

              {/* LANDSCAPE/DESKTOP: row-based notation */}
              {view === 'notation' && !isPortrait && (() => {
                const notationRowEls = rows.map((rowMeasures, rowIdx) => {
                const { measureW, noteW, beatsPerMeasure: bpm } = buildLayout(exercise, svgWidth, rowMeasures)
                const beatUnit = (() => { const isComp = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3; return isComp ? 3 * (4 / exercise.timeSignature.beatType) : 4 / exercise.timeSignature.beatType })()
                const contentW = 56 + rowMeasures.length * measureW + 7
                const actualSvgW = Math.max(svgWidth, contentW + 20)
                const isLastRow = rowIdx === rows.length - 1
                const lastBarlineX = 56 + rowMeasures.length * measureW
                const staffLeftX = rowIdx === 0 ? 34 : 56
                const staffRightX = contentW
                const staffSpan = staffRightX - staffLeftX
                const notationCenterTx = Math.max(0, (actualSvgW - staffSpan) / 2 - staffLeftX)
                return (
                  <svg
                    className="nl-notation-staff"
                    key={rowIdx}
                    width="100%"
                    height={SVG_H}
                    viewBox={`0 0 ${actualSvgW} 130`}
                    style={{ display: 'block', marginBottom: rowIdx < rows.length - 1 ? rowGap : 0 }}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <g transform={`translate(${notationCenterTx}, 0)`}>
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
                            <line key={'bm'+bi} x1={mx - 8 + bi * noteW} y1={STAFF_Y + 20} x2={mx - 8 + bi * noteW} y2={STAFF_Y + 23} stroke="#DDD8CA" strokeWidth={1} />
                          ))}
                          {/* Trail — smooth pills */}
                          {(() => {
                            const trailInMeasure = trail.filter(t => t.beat >= globalMeasureIdx * bpm && t.beat < (globalMeasureIdx + 1) * bpm)
                            const trackX = mx - 8
                            const trackW = bpm * noteW
                            const TY = STAFF_Y + 20  // baseline Y — tighter to staff
                            const TH = 8             // pill height
                            const R = TH / 2         // corner radius

                            // Group into contiguous same-color runs (pills)
                            type Run = { beats: number[]; color: string }
                            const runs: Run[] = []
                            for (const t of trailInMeasure) {
                              const last = runs[runs.length - 1]
                              if (last && last.color === t.color && t.beat - last.beats[last.beats.length - 1] < 0.09) {
                                last.beats.push(t.beat)
                              } else {
                                runs.push({ beats: [t.beat], color: t.color })
                              }
                            }

                            return (
                              <>
                                {/* Track baseline */}
                                <rect x={trackX} y={TY + 1} width={trackW} height={1} fill="rgba(211,209,199,0.5)" rx={0.5} />
                                {runs.map((run, i) => {
                                  const x1 = trackX + (run.beats[0] - globalMeasureIdx * bpm) * noteW
                                  const x2 = trackX + (run.beats[run.beats.length - 1] - globalMeasureIdx * bpm) * noteW
                                  const w = Math.max(TH, x2 - x1 + noteW / 16)
                                  const isGreen = run.color === '#65C366'
                                  const isRed = run.color === '#ED6765'
                                  const isGray = !isGreen && !isRed
                                  // Gray = silence, skip rendering
                                  if (isGray) return null
                                  const fill = isGreen ? '#65C366' : '#ED6765'
                                  const fillBg = isGreen ? 'rgba(101,195,102,0.12)' : 'rgba(237,103,101,0.12)'
                                  const isDot = w <= TH + 2
                                  return (
                                    <g key={i}>
                                      {isDot ? (
                                        <circle cx={x1} cy={TY + R} r={R} fill={fill} opacity={0.9} />
                                      ) : (
                                        <>
                                          <rect x={x1 - R} y={TY} width={w} height={TH} rx={R} fill={fillBg} />
                                          <rect x={x1 - R} y={TY} width={w} height={TH} rx={R} fill="none" stroke={fill} strokeWidth={1.5} opacity={0.95} />
                                        </>
                                      )}
                                    </g>
                                  )
                                })}
                              </>
                            )
                          })()}
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
                      if (playhead === null || (!playing && !previewing && countdown === null)) return null
                      const rowStartBeat = rowIdx * MEASURES_PER_ROW * bpm
                      const rowEndBeat = rowStartBeat + rowMeasures.length * bpm
                      if (playhead < rowStartBeat - 1 || playhead >= rowEndBeat) return null
                      const beatInRow = playhead - rowStartBeat
                      const x = 56 + 18 + beatInRow * noteW
                      return <line x1={x} y1={STAFF_Y - 32} x2={x} y2={STAFF_Y + 32} stroke="#B5402A" strokeWidth={1.5} opacity={0.7} style={{ pointerEvents: 'none' }} />
                    })()}
                    </g>
                  </svg>
                )
              })
                if (notationSingleRowPaging || notationTwoRowPairPaging) {
                  return (
                    <div
                      style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'stretch',
                      }}
                    >
                      <div
                        ref={notationScrollRef}
                        className="nl-notation-scroll"
                        style={notationDesktopScrollStyle}
                      >
                        {notationRowEls}
                      </div>
                    </div>
                  )
                }
                return (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'stretch',
                    }}
                  >
                    {notationRowEls}
                  </div>
                )
              })()}

              {view === 'grid' && !isPortrait && (() => {
                const qBpmG = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)
                const CELL_H = 56
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
                          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', width: '18px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{mIdx + 1}</span>
                          {/* Grid row */}
                          <div style={{ flex: 1, position: 'relative' as const, display: 'flex', gap: '1px', padding: '1px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #DDD8CA', background: '#DDD8CA' }}>
                            {/* Active measure tint */}
                            {playheadInMeasure && (
                              <div style={{ position: 'absolute' as const, inset: 0, background: 'rgba(186, 117, 23, 0.04)', zIndex: 1, pointerEvents: 'none' as const }} />
                            )}
                            {/* Beat gridlines (subtle) */}
                            {Array.from({ length: Math.max(0, Math.round(qBpmG) - 1) }, (_, bi) => (
                              <div
                                key={'bg' + bi}
                                style={{
                                  position: 'absolute' as const,
                                  left: `${((bi + 1) / qBpmG) * 100}%`,
                                  top: 0,
                                  bottom: 0,
                                  width: '1px',
                                  background: '#1A1A18',
                                  opacity: 0.06,
                                  zIndex: 5,
                                  transform: 'translateX(-0.5px)',
                                  pointerEvents: 'none' as const,
                                }}
                              />
                            ))}
                            {measure.notes.map((note, nIdx) => {
                              const tr: 'hit'|'miss'|'none' = tapResults[mIdx]?.[nIdx] ?? 'none'
                              // Colors: note=dark, rest=empty/light, hit=green, miss=red
                              let bg = note.rest ? '#E8E4DE' : '#2A2A28'
                              if (tr === 'hit') bg = '#65C366'
                              if (tr === 'miss' && !note.rest) bg = '#ED6765'
                              // Subdivision lines inside each block
                              const subdivisions = Math.round(note.durationBeats / (4 / exercise.timeSignature.beatType))
                              return (
                                <div key={nIdx} style={{ flex: note.durationBeats, position: 'relative' as const, background: bg, transition: 'background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                  {/* Subdivision markers */}
                                  {subdivisions > 1 && Array.from({ length: subdivisions - 1 }, (_, si) => (
                                    <div key={si} style={{ position: 'absolute' as const, left: `${((si + 1) / subdivisions) * 100}%`, top: '25%', bottom: '25%', width: '1px', background: note.rest ? '#DDD8CA' : 'rgba(255,255,255,0.25)' }} />
                                  ))}
                                </div>
                              )
                            })}
                            {/* Playhead line */}
                            {playheadPct !== null && (
                              <div style={{ position: 'absolute' as const, left: `${playheadPct * 100}%`, top: 0, bottom: 0, width: '2px', background: '#B5402A', opacity: 0.85, zIndex: 10, transform: 'translateX(-1px)', pointerEvents: 'none' as const }} />
                            )}
                            {/* Baseline anchor for trail */}
                            <div style={{ position: 'absolute' as const, left: 0, right: 0, top: '85%', height: '1px', background: '#DDD8CA', opacity: 0.4, zIndex: 6, pointerEvents: 'none' as const }} />
                            {/* Trail in grid — smooth pills */}
                            {(() => {
                              const trailInMeasure = trail.filter(t => t.beat >= measureStartBeat && t.beat < measureEndBeat)
                              type Run = { beats: number[]; color: string }
                              const runs: Run[] = []
                              for (const t of trailInMeasure) {
                                const last = runs[runs.length - 1]
                                if (last && last.color === t.color && t.beat - last.beats[last.beats.length - 1] < 0.09) {
                                  last.beats.push(t.beat)
                                } else {
                                  runs.push({ beats: [t.beat], color: t.color })
                                }
                              }
                              return runs.map((run, i) => {
                                const isGreen = run.color === '#65C366'
                                const isRed = run.color === '#ED6765'
                                if (!isGreen && !isRed) return null
                                const x1pct = ((run.beats[0] - measureStartBeat) / qBpmG) * 100
                                const x2pct = ((run.beats[run.beats.length - 1] - measureStartBeat) / qBpmG) * 100
                                const wpct = Math.max(1.5, x2pct - x1pct + 0.5)
                                const fill = isGreen ? '#65C366' : '#ED6765'
                                const fillBg = isGreen ? 'rgba(101,195,102,0.12)' : 'rgba(237,103,101,0.12)'
                                const isDot = wpct < 2
                                return (
                                  <div key={i} style={{
                                    position: 'absolute' as const,
                                    left: `${x1pct}%`,
                                    bottom: '2px',
                                    width: isDot ? '7px' : `${wpct}%`,
                                    height: isDot ? '7px' : '7px',
                                    borderRadius: '4px',
                                    background: isDot ? fill : fillBg,
                                    border: isDot ? 'none' : `1.5px solid ${fill}`,
                                    opacity: 0.95,
                                    zIndex: 7,
                                    pointerEvents: 'none' as const,
                                    transform: isDot ? 'translateX(-50%)' : 'none',
                                  }} />
                                )
                              })
                            })()}
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
              <div className="nl-hide-scrollbar" style={{ background: '#1A1A18', borderRadius: '12px', padding: '12px', marginBottom: '8px', maxHeight: 'min(200px, 22vh)', overflowY: 'auto' as const, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.05em', margin: 0 }}>DIAGNOSTIC LOG</p>
                  <button onClick={() => navigator.clipboard.writeText(diagLog.join('\n'))}
                    style={{ fontFamily: 'monospace', fontSize: 'var(--nl-text-badge)', color: '#7A7060', background: 'none', border: '1px solid #888780', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>Copy</button>
                </div>
                {diagLog.length === 0 && <p style={{ fontFamily: 'monospace', fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>No taps yet</p>}
                {diagLog.map((line, i) => (
                  <p key={i} style={{ fontFamily: 'monospace', fontSize: 'var(--nl-text-compact)', color: line.includes('REST') ? '#ED6765' : line.includes('SCORE') ? '#B5402A' : '#65C366', margin: '2px 0' }}>{line}</p>
                ))}
              </div>
            )}


            {/* Bottom: Mixer + Preview + Start/Stop + TAP (desktop) */}
            <div className="nl-rt-tapbar" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowCalibration(true)}
                    disabled={playing}
                    title="Calibrate audio timing for your headphones / device"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '1px solid #DDD8CA',
                      background: 'white',
                      color: '#7A7060',
                      fontFamily: F,
                      fontSize: 'var(--nl-text-compact)',
                      fontWeight: 400,
                      cursor: playing ? 'default' : 'pointer',
                      opacity: playing ? 0.4 : 1,
                      flexShrink: 0,
                    }}
                  >
                    Calibrate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVisualCal(true)}
                    disabled={playing}
                    title="Tune the countdown so the digit matches the click sound"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '1px solid #DDD8CA',
                      background: 'white',
                      color: '#7A7060',
                      fontFamily: F,
                      fontSize: 'var(--nl-text-compact)',
                      fontWeight: 400,
                      cursor: playing ? 'default' : 'pointer',
                      opacity: playing ? 0.4 : 1,
                      flexShrink: 0,
                    }}
                  >
                    Visual sync
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMixer(v => !v)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '1px solid ' + (showMixer ? '#1A1A18' : '#DDD8CA'),
                      background: showMixer ? '#1A1A18' : 'white',
                      color: showMixer ? 'white' : '#7A7060',
                      fontFamily: F,
                      fontSize: 'var(--nl-text-compact)',
                      fontWeight: 400,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Mixer
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={previewing ? stop : startPreview}
                    disabled={playing}
                    title={previewing ? 'Stop preview' : 'Preview rhythm'}
                    onKeyDown={e => e.code === 'Space' && e.preventDefault()}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid ' + (previewing ? '#B5402A' : '#DDD8CA'),
                      background: previewing ? '#B5402A' : 'white',
                      color: previewing ? 'white' : '#7A7060',
                      fontSize: 'var(--nl-text-ui)',
                      cursor: playing ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      opacity: playing ? 0.4 : 1,
                    }}
                  >
                    {previewing ? '■' : '▶'}
                  </button>
                  {!playing ? (
                    <button onClick={start}
                      onKeyDown={e => e.code === 'Space' && e.preventDefault()}
                      style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
                      {score ? 'Try Again' : 'Start'}
                    </button>
                  ) : (
                    <button onClick={stop}
                      onKeyDown={e => e.code === 'Space' && e.preventDefault()}
                      style={{ background: 'none', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.7)' }}>
                      Stop
                    </button>
                  )}
                </div>
              </div>

              <button
                ref={tapBtnRef}
                onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
                onContextMenu={e => e.preventDefault()}
                className="rhythm-tap-btn"
                disabled={false}
                style={{
                  width: '100%', height: '72px', borderRadius: '16px',
                  border: liveFeedback === 'hit' ? '2px solid #65C366' : liveFeedback === 'miss' ? '2px solid #ED6765' : '2px solid #DDD8CA',
                  background: liveFeedback === 'hit' ? '#65C366' : liveFeedback === 'miss' ? '#ED6765' : (playing && (countdown === null || tapReady)) ? '#1A1A18' : '#F2EDDF',
                  color: liveFeedback ? 'white' : (playing && (countdown === null || tapReady)) ? 'white' : '#DDD8CA',
                  fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400,
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
            </div>
          </div>
        )}
      </div>
      {showAuthRhythm && <AuthModal onClose={() => setShowAuthRhythm(false)} onSuccess={() => setShowAuthRhythm(false)} />}
      <CalibrationModal
        open={showCalibration}
        onClose={() => setShowCalibration(false)}
        onCalibrated={() => {
          try {
            const ctx = ctxRef.current
            if (ctx) userOffsetRef.current = getStoredOffsetSec(getDeviceKey(ctx))
          } catch {}
        }}
      />
      <VisualCalibrationModal
        open={showVisualCal}
        onClose={() => setShowVisualCal(false)}
        onCalibrated={() => {
          try {
            const ctx = ctxRef.current
            if (ctx) visualLeadRef.current = getVisualLeadSec(getDeviceKey(ctx))
          } catch {}
        }}
      />
    </div>
  )
}
