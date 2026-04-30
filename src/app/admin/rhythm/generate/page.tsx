'use client'

import { useState, useCallback, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { GeneratorOptions, NoteValue } from '@/lib/rhythmGenerator'
import type { RhythmExercise } from '@/lib/parseMXL'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const DEFAULT_CATEGORIES = ['Quarter & Half Notes', 'Rests', 'Dotted Notes', 'Ties', 'Eighth Notes', 'Mixed'] as const
const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' }
const ALL_NOTE_VALUES: NoteValue[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth']

const DEFAULT_OPTS: GeneratorOptions = {
  timeSignature: { beats: 4, beatType: 4 },
  measures: 4,
  notePool: ['quarter', 'half'],
  allowRests: false,
  restProbability: 0.2,
  allowDots: false,
  dotPool: [] as NoteValue[],
  dotProbability: 0.25,
  allowTies: false,
  tieProbability: 0.2,
  allowTuplets: false,
  tupletType: null,
  hands: 1,
}


const BRAVURA_REST: Record<string, string> = {
  whole:      String.fromCodePoint(0xE4E3),
  half:       String.fromCodePoint(0xE4E4),
  quarter:    String.fromCodePoint(0xE4E5),
  eighth:     String.fromCodePoint(0xE4E6),
  sixteenth:  String.fromCodePoint(0xE4E7),
}

const BRAVURA_NOTE: Record<string, string> = {
  whole:     String.fromCodePoint(0xE1D2),
  half:      String.fromCodePoint(0xE1D3),
  quarter:   String.fromCodePoint(0xE1D5),
  eighth:    String.fromCodePoint(0xE1D7),
  sixteenth: String.fromCodePoint(0xE1D9),
}

const BEAM_FONT_SIZE = 44
const STAFF_Y_P = 52
const STEM_H_P = 36

const BRAVURA_NOTE_GLYPHS: Record<string, string> = {
  whole:      String.fromCodePoint(0xE1D2),
  half:       String.fromCodePoint(0xE1D3),
  quarter:    String.fromCodePoint(0xE1D5),
  eighth:     String.fromCodePoint(0xE1D7),
  sixteenth:  String.fromCodePoint(0xE1D9),
}

function BravuraNoteP({ x, y, type, color }: { x: number; y: number; type: string; color: string }) {
  return <text x={x} y={y} fontSize={BEAM_FONT_SIZE} fontFamily="Bravura, serif" fill={color} textAnchor="middle" dominantBaseline="auto">
    {BRAVURA_NOTE_GLYPHS[type] ?? BRAVURA_NOTE_GLYPHS.quarter}
  </text>
}

function RestSymbolP({ x, type, dot }: { x: number; type: string; dot?: boolean }) {
  const glyph =
    type === 'whole'      ? BRAVURA_REST.whole :
    type === 'half'       ? BRAVURA_REST.half :
    type === 'eighth'     ? BRAVURA_REST.eighth :
    type === 'sixteenth'  ? BRAVURA_REST.sixteenth :
    BRAVURA_REST.quarter
  const y = type === 'whole' ? STAFF_Y_P : type === 'half' ? STAFF_Y_P - 0.5 : STAFF_Y_P
  return <g>
    <text x={x} y={y} fontSize={BEAM_FONT_SIZE} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">{glyph}</text>
    {dot && <circle cx={x + 14} cy={y - 4} r={2.5} fill="#1A1A18" />}
  </g>
}

interface RhythmNoteP { type: string; durationBeats: number; rest?: boolean; dot?: boolean; tieStart?: boolean; tieStop?: boolean }

function TieCurveP({ x1, x2 }: { x1: number; x2: number }) {
  const y = STAFF_Y_P + 10
  const h = Math.min(8, Math.max(4, (x2 - x1) * 0.12))
  const cp1x = x1 + (x2-x1)*0.25; const cp2x = x2 - (x2-x1)*0.25
  const outer = `M ${x1} ${y} C ${cp1x} ${y+h} ${cp2x} ${y+h} ${x2} ${y}`
  const inner = `C ${cp2x} ${y+h-2} ${cp1x} ${y+h-2} ${x1} ${y}`
  return <path d={outer + ' ' + inner + ' Z'} fill="#1A1A18" opacity={0.85} />
}

function renderMeasureP(notes: RhythmNoteP[], mx: number, noteW: number, beatUnit: number = 1): React.ReactElement[] {
  const els: React.ReactElement[] = []

  // Pre-compute note positions
  const noteInfos: { idx: number; beatPos: number; x: number }[] = []
  let bp = 0
  notes.forEach((n, i) => {
    noteInfos.push({ idx: i, beatPos: bp, x: mx + bp * noteW })
    bp += n.durationBeats
  })

  // Beat-aware beam groups — group beamable notes within the same beat
  const beatSize = beatUnit
  const totalBeats = Math.round(noteInfos.reduce((sum, _, i) => sum + notes[i].durationBeats, 0))
  const beamGroups: number[][] = []
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

  // Render notes
  bp = 0
  notes.forEach((note, i) => {
    const x = mx + bp * noteW
    if (note.rest) {
      els.push(<RestSymbolP key={`r-${i}`} x={x} type={note.type} dot={note.dot} />)
    } else if (beamedSet.has(i)) {
      els.push(<text key={`n-${i}`} x={x} y={STAFF_Y_P} fontSize={BEAM_FONT_SIZE} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="auto">{String.fromCodePoint(0xE1F1)}</text>)
      if (note.dot) els.push(<circle key={`d-${i}`} cx={x + 14} cy={STAFF_Y_P - 4} r={2.5} fill="#1A1A18" />)
    } else {
      els.push(<BravuraNoteP key={`n-${i}`} x={x} y={STAFF_Y_P} type={note.type} color="#1A1A18" />)
      if (note.dot) els.push(<circle key={`d-${i}`} cx={x + 14} cy={STAFF_Y_P - 4} r={2.5} fill="#1A1A18" />)
    }
    // Tie
    if (note.tieStart && i < notes.length - 1) {
      const nextX = mx + (bp + note.durationBeats) * noteW
      els.push(<TieCurveP key={'tie-'+i} x1={x} x2={nextX} />)
    }
    bp += note.durationBeats
  })

  // Beams
  beamGroups.forEach((group, gi) => {
    const nonRestIndices = group.filter(i => !notes[i].rest)
    if (nonRestIndices.length < 2) return
    const xs = nonRestIndices.map(idx => { let pos = 0; for (let k = 0; k < idx; k++) pos += notes[k].durationBeats; return mx + pos * noteW })
    if (xs.length < 2) return
    const x1 = xs[0] + 7; const x2 = xs[xs.length - 1] + 7
    const beamY = STAFF_Y_P - 39
    if (isFinite(x1) && isFinite(x2) && x2 > x1) els.push(<rect key={`bm1-${gi}`} x={x1} y={beamY} width={x2 - x1} height={5} fill="#1A1A18" rx={1} />)
    for (let k = 0; k < group.length - 1; k++) {
      // Use nonRestIndices for secondary beams so indices align with xs array
    }
    // Secondary beams: full beam between adjacent 16ths, stub for isolated 16ths
    const STUB = 12
    for (let k = 0; k < nonRestIndices.length; k++) {
      const ni = nonRestIndices[k]
      if (notes[ni].type !== 'sixteenth') continue
      const prevIs16 = k > 0 && notes[nonRestIndices[k-1]].type === 'sixteenth'
      const nextIs16 = k < nonRestIndices.length - 1 && notes[nonRestIndices[k+1]].type === 'sixteenth'
      if (nextIs16) {
        // Full beam to next sixteenth
        if (xs[k+1] !== undefined && isFinite(xs[k]) && isFinite(xs[k+1]))
          els.push(<rect key={'bm2-'+gi+'-f-'+k} x={xs[k]+7} y={beamY+7} width={xs[k+1]-xs[k]} height={5} fill="#1A1A18" rx={1} />)
      } else if (prevIs16) {
        // Last in a sixteenth run — stub LEFT
        if (isFinite(xs[k]))
          els.push(<rect key={'bm2-'+gi+'-s-'+k} x={xs[k]+7-STUB} y={beamY+7} width={STUB} height={5} fill="#1A1A18" rx={1} />)
      } else {
        // Isolated sixteenth — stub direction depends on position in group
        const isLastInGroup = k === nonRestIndices.length - 1
        const stubX = isLastInGroup ? xs[k]+7-STUB : xs[k]+7
        if (isFinite(xs[k]))
          els.push(<rect key={'bm2-'+gi+'-s-'+k} x={stubX} y={beamY+7} width={STUB} height={5} fill="#1A1A18" rx={1} />)
      }
    }
  })

  return els
}

function buildLayout(exercise: RhythmExercise, svgW: number, rowMeasures: typeof exercise.measures) {
  const beatsPerMeasure = exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)  // in quarter note units
  const allNotes = rowMeasures.flatMap(m => m.notes)
  const smallestDuration = allNotes.reduce((min, n) => Math.min(min, n.durationBeats), 1)
  const MIN_SLOT_W = 32  // minimum px per smallest note slot
  const slotsPerMeasure = beatsPerMeasure / smallestDuration
  const minMeasureW = slotsPerMeasure * MIN_SLOT_W
  const usableW = svgW - 96
  const naturalMeasureW = usableW / rowMeasures.length
  const measureW = Math.max(naturalMeasureW, minMeasureW)
  const noteW = measureW / beatsPerMeasure
  return { measureW, noteW, beatsPerMeasure }
}

function MiniPreview({ exercise }: { exercise: RhythmExercise | null }) {
  if (!exercise) return null
  const STAFF_Y = 52
  const STEM_H = 36
  const SVG_H = 120
  const SVG_W = 700

  // Same row logic as rhythm trainer
  const beats = exercise.timeSignature.beats
  const allNotes = exercise.measures.flatMap(m => m.notes)
  const smallest = allNotes.reduce((min, n) => Math.min(min, n.durationBeats), 1)
  const slotsPerMeasure = beats / smallest
  const MIN_SLOT = 28
  const minMeasureW = slotsPerMeasure * MIN_SLOT
  const total = exercise.measures.length
    const _allNotes = exercise.measures.flatMap(m => m.notes)
  const _smallest = _allNotes.reduce((min, n) => Math.min(min, n.durationBeats), 1)
  const _slots = exercise.timeSignature.beats / _smallest
  const _minMW = _slots * 24
  let measuresPerRow = 1
  for (const candidate of [4, 2, 1]) {
    if (candidate !== 1 && total % candidate !== 0) continue
    if (_minMW * candidate + 96 <= SVG_W) { measuresPerRow = candidate; break }
  }

  const rows = Array.from({ length: Math.ceil(total / measuresPerRow) },
    (_, i) => exercise.measures.slice(i * measuresPerRow, (i + 1) * measuresPerRow))

  return (
    <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px' }}>
      {rows.map((rowMeasures, rowIdx) => {
        const { measureW, noteW } = buildLayout(exercise, SVG_W, rowMeasures)
        const isLastRow = rowIdx === rows.length - 1
        return (
          <svg key={rowIdx} width="100%" viewBox={`0 0 ${Math.max(SVG_W, 56 + rowMeasures.length * measureW + 20)} ${SVG_H}`} style={{ display: 'block', marginBottom: rowIdx < rows.length - 1 ? '8px' : 0 }} preserveAspectRatio="xMinYMin meet">
            {/* Time signature on first row only */}
            {rowIdx === 0 && <>
              <text x={20} y={STAFF_Y - 10} fontSize={36} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle">{String.fromCodePoint(0xE080 + exercise.timeSignature.beats)}</text>
              <text x={20} y={STAFF_Y + 16} fontSize={36} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle">{String.fromCodePoint(0xE080 + exercise.timeSignature.beatType)}</text>
            </>}
            {/* Staff line */}
            <line x1={56} y1={STAFF_Y} x2={56 + rowMeasures.length * measureW + 7} y2={STAFF_Y} stroke="#1A1A18" strokeWidth={1.2} />
            {/* Opening barline */}
            <line x1={56} y1={STAFF_Y - STEM_H} x2={56} y2={STAFF_Y + STEM_H} stroke="#1A1A18" strokeWidth={1} />
            {rowMeasures.map((m, mIdx) => {
              const mx = 56 + mIdx * measureW + 18
              const barlineX = 56 + (mIdx + 1) * measureW
              const globalMIdx = rowIdx * measuresPerRow + mIdx
              const isLastMeasure = isLastRow && mIdx === rowMeasures.length - 1
              return (
                <g key={mIdx}>
                  {renderMeasureP(m.notes as RhythmNoteP[], mx, noteW, (() => {
                    const isComp = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3
                    return isComp ? 3 * (4 / exercise.timeSignature.beatType) : 4 / exercise.timeSignature.beatType
                  })())}
                  {!isLastMeasure && (
                    <line x1={barlineX} y1={STAFF_Y - STEM_H} x2={barlineX} y2={STAFF_Y + STEM_H} stroke="#1A1A18" strokeWidth={1} />
                  )}
                  {isLastMeasure && <>
                    <line x1={barlineX} y1={STAFF_Y - STEM_H} x2={barlineX} y2={STAFF_Y + STEM_H} stroke="#1A1A18" strokeWidth={1.2} />
                    <line x1={barlineX + 7} y1={STAFF_Y - STEM_H} x2={barlineX + 7} y2={STAFF_Y + STEM_H} stroke="#1A1A18" strokeWidth={6} />
                  </>}
                </g>
              )
            })}
          </svg>
        )
      })}
    </div>
  )
}

export default function GeneratePage() {
  const [opts, setOpts] = useState<GeneratorOptions>(DEFAULT_OPTS)
  const [preview, setPreview] = useState<RhythmExercise | null>(null)
  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES])
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0])
  const [difficulty, setDifficulty] = useState(1)
  const [programSlug, setProgramSlug] = useState('core')
  const [programSort, setProgramSort] = useState(0)
  const [categorySort, setCategorySort] = useState(0)
  const [level, setLevel] = useState(1)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [showDiag, setShowDiag] = useState(false)

  const set = (key: keyof GeneratorOptions, val: unknown) =>
    setOpts(prev => ({ ...prev, [key]: val }))

  const generate = useCallback(async () => {
    const { generateExercise } = await import('@/lib/rhythmGenerator')
    const ex = generateExercise({ ...opts, seed: Math.floor(Math.random() * 999999) })
    setPreview(ex as unknown as RhythmExercise)
    setMessage(null)
  }, [opts])

  useEffect(() => {
    let cancelled = false
    import('@/lib/rhythmLibrary').then(({ fetchExerciseLibrary, sortRhythmExercises }) => {
      fetchExerciseLibrary()
        .then(({ flat }) => {
          if (cancelled) return
          const sorted = sortRhythmExercises(flat)
          const ordered: string[] = []
          const seen = new Set<string>()
          for (const ex of sorted) {
            if (!seen.has(ex.category)) {
              seen.add(ex.category)
              ordered.push(ex.category)
            }
          }
          for (const d of DEFAULT_CATEGORIES) {
            if (!seen.has(d)) ordered.push(d)
          }
          const merged = ordered.length ? ordered : [...DEFAULT_CATEGORIES]
          setCategories(merged)
          if (!merged.includes(category)) setCategory(merged[0] ?? DEFAULT_CATEGORIES[0])
        })
        .catch(() => {
          // keep fallback categories
        })
    }).catch(() => {
      // keep fallback categories
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = useCallback(async () => {
    if (!preview || !title.trim()) { setMessage({ text: 'Generate an exercise and enter a title first.', ok: false }); return }
    setSaving(true); setMessage(null)
    try {
      const { generateMusicXML, xmlToMxlBuffer } = await import('@/lib/rhythmGenerator')
      const xml = generateMusicXML(preview, title.trim())
      const buffer = await xmlToMxlBuffer(xml)
      const bytes = new Uint8Array(buffer)
      let binary = ''
      bytes.forEach(b => binary += String.fromCharCode(b))
      const base64 = btoa(binary)
      const safeName = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const safeCat = category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const safeProg = programSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'core'
      const filePath = `generated/${safeProg}/${safeCat}/${safeName}-${Date.now()}.mxl`
      const sb = getSupabaseClient()
      const { error } = await sb.from('rhythm_exercises').insert({
        title: title.trim(),
        category,
        difficulty,
        beats: opts.timeSignature.beats,
        beat_type: opts.timeSignature.beatType,
        order_index: 0,
        program_slug: safeProg,
        program_sort: programSort,
        category_sort: categorySort,
        level: Math.max(1, level),
        file_path: filePath,
        file_data: base64,
      })
      if (error) throw new Error(error.message)
      setMessage({ text: `✓ "${title}" saved to library.`, ok: true })
      setTitle(''); setPreview(null)
    } catch (err) {
      setMessage({ text: String(err), ok: false })
    } finally { setSaving(false) }
  }, [preview, title, category, difficulty, opts, programSlug, programSort, categorySort, level])

  const toggleNote = (n: NoteValue) => {
    const pool = opts.notePool.includes(n) ? opts.notePool.filter(x => x !== n) : [...opts.notePool, n]
    // Allow empty notePool if dotPool has items
    if (pool.length > 0 || (opts.dotPool ?? []).length > 0) set('notePool', pool)
  }
  const NOTE_BEATS_MAP: Record<NoteValue, number> = {whole:4,half:2,quarter:1,eighth:0.5,sixteenth:0.25}
  const isCompoundMeter = opts.timeSignature.beats % 3 === 0 && opts.timeSignature.beats > 3
  const compBeatUnit = isCompoundMeter ? 3 * (4 / opts.timeSignature.beatType) : 4 / opts.timeSignature.beatType
  const maxBeats = isCompoundMeter
    ? (opts.timeSignature.beats / 3) * compBeatUnit
    : opts.timeSignature.beats * (4 / opts.timeSignature.beatType)
  const allowedNoteValues = ALL_NOTE_VALUES.filter(n => {
    const b = NOTE_BEATS_MAP[n]
    if (b > maxBeats + 0.001) return false
    if (isCompoundMeter) {
      const divUnit = 4 / opts.timeSignature.beatType
      const multOfDiv = Math.abs(b % divUnit) < 0.001
      const subdivOfDiv = b < divUnit - 0.001 && Math.abs(divUnit % b) < 0.001
      const crossesBeat = b > compBeatUnit + 0.001 && Math.abs(b % compBeatUnit) > 0.001
      return (multOfDiv || subdivOfDiv) && !crossesBeat
    }
    return true
  })

  const inp: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #DDD8CA', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#2A2318', background: '#F2EDDF', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const tog = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', borderRadius: '20px', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer', border: `1px solid ${active ? '#1A1A18' : '#DDD8CA'}`, background: active ? '#1A1A18' : 'white', color: active ? 'white' : '#7A7060' })
  const lbl: React.CSSProperties = { fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', display: 'block', marginBottom: '6px' }
  const card: React.CSSProperties = { background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px' }
  const sectionLabel: React.CSSProperties = { fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '16px' }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '40px 32px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '4px' }}>Rhythm Generator</h1>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>Configure and generate rhythm exercises for the library</p>
          </div>
          <a href="/admin/rhythm" style={{ marginLeft: 'auto', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', textDecoration: 'none', border: '1px solid #DDD8CA', borderRadius: '20px', padding: '6px 14px' }}>← Library</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={card}>
            <p style={sectionLabel}>Time Signature & Length</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Beats</label>
                <select value={opts.timeSignature.beats} onChange={e => set('timeSignature', { ...opts.timeSignature, beats: Number(e.target.value) })} style={inp}>
                  {[2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <span style={{ fontFamily: SERIF, fontSize: '24px', color: '#7A7060', paddingBottom: '6px' }}>/</span>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Beat type</label>
                <select value={opts.timeSignature.beatType} onChange={e => set('timeSignature', { ...opts.timeSignature, beatType: Number(e.target.value) })} style={inp}>
                  {[2,4,8,16].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <label style={lbl}>Measures</label>
            <select value={opts.measures} onChange={e => set('measures', Number(e.target.value))} style={inp}>
              {[2,4,6,8,12,16].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div style={card}>
            <p style={sectionLabel}>Note Values</p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
              {allowedNoteValues.map(n => <button key={n} onClick={() => toggleNote(n)} style={tog(opts.notePool.includes(n))}>{n}</button>)}
            </div>
            <p style={{ ...lbl, marginTop: '12px' }}>Dotted values</p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
              {(['half','quarter','eighth'] as NoteValue[]).filter(n => allowedNoteValues.includes(n) || allowedNoteValues.length === 0).map(n => {
                const dotSelected = (opts.dotPool ?? []).includes(n)
                // Also show dotted versions of allowed notes in compound meters
                const dottedBeatsMap: Record<string,number> = {whole:6,half:3,quarter:1.5,eighth:0.75,sixteenth:0.375}
                const dottedBeats = dottedBeatsMap[n] ?? 0
                const isCompound = opts.timeSignature.beats % 3 === 0 && opts.timeSignature.beats > 3
                const maxB = isCompound
                  ? (opts.timeSignature.beats / 3) * 3 * (4 / opts.timeSignature.beatType)
                  : opts.timeSignature.beats * (4 / opts.timeSignature.beatType)
                if (dottedBeats > maxB + 0.001) return null
                return (
                  <button key={'d'+n} onClick={() => {
                    const current = opts.dotPool ?? []
                    const next = dotSelected ? current.filter(x => x !== n) : [...current, n]
                    set('dotPool', next)
                    if (!opts.allowDots && !dotSelected) set('allowDots', true)
                  }} style={tog(dotSelected)}>d.{n}</button>
                )
              })}
            </div>
          </div>

          <div style={card}>
            <p style={sectionLabel}>Articulation</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {[
                { key: 'allowRests' as const, probKey: 'restProbability' as const, label: 'Rests' },

                { key: 'allowTies' as const, probKey: 'tieProbability' as const, label: 'Ties' },
              ].map(({ key, probKey, label }) => (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#2A2318' }}>{label}</span>
                    <button onClick={() => set(key, !opts[key])} style={tog(!!opts[key])}>{opts[key] ? 'On' : 'Off'}</button>
                  </div>
                  {opts[key] && (
                    <div>
                      <label style={lbl}>Probability: {Math.round((opts[probKey] as number) * 100)}%</label>
                      <input type="range" min={5} max={60} value={Math.round((opts[probKey] as number) * 100)} onChange={e => set(probKey, Number(e.target.value) / 100)} style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <p style={sectionLabel}>Save to Library</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              <div>
                <label style={lbl}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Quarter Notes #3" style={inp} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select
                  value={categories.includes(category) ? category : '__custom__'}
                  onChange={e => {
                    if (e.target.value === '__custom__') setCategory('')
                    else setCategory(e.target.value)
                  }}
                  style={{ ...inp, marginBottom: '6px' }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">+ New category…</option>
                </select>
                {!categories.includes(category) && (
                  <input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Type new category name"
                    style={inp}
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label style={lbl}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} style={inp}>
                  {[1,2,3,4,5].map(d => <option key={d} value={d}>{d} — {DIFFICULTY_LABEL[d]}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Program slug</label>
                <input value={programSlug} onChange={e => setProgramSlug(e.target.value)} placeholder="core" style={inp} />
              </div>
              <div>
                <label style={lbl}>Program sort</label>
                <input type="number" value={programSort} onChange={e => setProgramSort(Number(e.target.value))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Category sort</label>
                <input type="number" value={categorySort} onChange={e => setCategorySort(Number(e.target.value))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Level</label>
                <input type="number" min={1} value={level} onChange={e => setLevel(Math.max(1, Number(e.target.value)))} style={inp} />
              </div>
            </div>
          </div>
        </div>

        {preview && (
          <div style={{ marginBottom: '24px' }}>
            <p style={sectionLabel}>Preview</p>
            <MiniPreview exercise={preview} />
          </div>
        )}

        {preview && showDiag && (
          <div style={{ background: '#1A1A18', borderRadius: '12px', padding: '16px', marginBottom: '16px', overflowX: 'auto' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diagnostic — Beat Positions</p>
            <div style={{ fontFamily: 'monospace', fontSize: 'var(--nl-text-badge)', color: '#7A7060', marginBottom: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
              <span><span style={{ border: '2px solid #4A9EFF', padding: '0 3px', borderRadius: '2px' }}>note~</span> tie start</span>
              <span><span style={{ border: '2px solid #FF9E4A', padding: '0 3px', borderRadius: '2px' }}>~note</span> tie stop</span>
              <span style={{ color: '#4CAF50' }}>● on beat</span>
              <span style={{ color: '#FF6B6B' }}>● off beat</span>
              <span style={{ color: '#888' }}>R = rest</span>
              <span style={{ color: '#B5402A' }}>d = dotted</span>
            </div>
            {preview.measures.map((m, mi) => {
              let pos = 0
              const expected = preview.timeSignature.beats * (4 / preview.timeSignature.beatType)
              const sum = m.notes.reduce((a, n) => a + n.durationBeats, 0)
              const ok = Math.abs(sum - expected) < 0.01
              return (
                <div key={mi} style={{ marginBottom: '8px' }}>
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: ok ? '#4CAF50' : '#E53935', marginRight: '8px' }}>
                    M{mi+1} sum={sum.toFixed(3)} {ok ? '✓' : '✗'}
                  </span>
                  {m.notes.map((n, ni) => {
                    const start = pos
                    pos += n.durationBeats
                    const onBeat = Math.abs(start % 1) < 0.01
                    return (
                      <span key={ni} style={{
                        fontFamily: 'monospace', fontSize: 'var(--nl-text-badge)',
                        background: n.rest ? '#333' : (onBeat ? '#2A4A2A' : '#4A2A2A'),
                        color: n.rest ? '#888' : (onBeat ? '#4CAF50' : '#FF6B6B'),
                        padding: '2px 4px', borderRadius: '3px', margin: '1px',
                        display: 'inline-block',
                        outline: n.tieStart ? '2px solid #4A9EFF' : n.tieStop ? '2px solid #FF9E4A' : 'none'
                      }}>
                        {n.tieStop ? '~' : ''}{n.rest ? 'R' : ''}{n.dot ? 'd' : ''}{n.type[0].toUpperCase()}{n.durationBeats} @{start.toFixed(2)}{n.tieStart ? '~' : ''}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
        {message && <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: message.ok ? '#4CAF50' : '#E53935', marginBottom: '16px' }}>{message.text}</p>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={generate} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 32px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
            {preview ? 'Regenerate' : 'Generate'}
          </button>
          {preview && (
            <button onClick={() => setShowDiag(d => !d)}
              style={{ background: showDiag ? '#333' : 'transparent', color: showDiag ? 'white' : '#7A7060', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '12px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
              {showDiag ? 'Hide Diag' : 'Diagnose'}
            </button>
          )}
          {preview && (
            <button onClick={save} disabled={saving || !title.trim()}
              style={{ background: saving || !title.trim() ? '#DDD8CA' : '#B5402A', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 32px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: saving || !title.trim() ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save to Library'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
