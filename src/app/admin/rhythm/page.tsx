'use client'

import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { RhythmExerciseMeta } from '@/lib/rhythmLibrary'
import { buildRhythmLibraryTree, rhythmMetaFromDbRow, sortRhythmExercises } from '@/lib/rhythmLibrary'
import { rhythmProgramTitle } from '@/lib/rhythmCatalog'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const CATEGORIES = [
  'Quarter & Half Notes',
  'Rests',
  'Dotted Notes',
  'Ties',
  'Mixed',
]

const DIFFICULTIES = [1, 2, 3, 4, 5]
const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert'
}

const RHYTHM_ROW_SELECT =
  'id, title, category, order_index, difficulty, beats, beat_type, file_path, program_slug, program_sort, category_sort, level'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type EditState = {
  title: string
  category: string
  category_sort: number
  level: number
  order_index: number
  difficulty: number
  beats: number
  beat_type: number
  program_slug: string
  program_sort: number
}

function ExerciseRow({
  ex,
  onDelete,
  onSaved,
  sb,
  inp,
}: {
  ex: RhythmExerciseMeta
  onDelete: () => void
  onSaved: (updated: RhythmExerciseMeta) => void
  sb: ReturnType<typeof getSupabaseClient>
  inp: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [fields, setFields] = useState<EditState>({
    title: ex.title,
    category: ex.category,
    category_sort: ex.category_sort,
    level: ex.level,
    order_index: ex.order_index,
    difficulty: ex.difficulty,
    beats: ex.beats,
    beat_type: ex.beat_type,
    program_slug: ex.program_slug,
    program_sort: ex.program_sort,
  })

  // Reset fields if parent exercise changes (e.g. after save refreshes list)
  useEffect(() => {
    setFields({
      title: ex.title,
      category: ex.category,
      category_sort: ex.category_sort,
      level: ex.level,
      order_index: ex.order_index,
      difficulty: ex.difficulty,
      beats: ex.beats,
      beat_type: ex.beat_type,
      program_slug: ex.program_slug,
      program_sort: ex.program_sort,
    })
  }, [ex])

  const set = <K extends keyof EditState>(k: K, v: EditState[K]) =>
    setFields(prev => ({ ...prev, [k]: v }))

  async function handleSave() {
    if (!fields.title.trim()) { setErr('Title is required.'); return }
    setSaving(true); setErr(null)
    const payload = {
      title: fields.title.trim(),
      category: fields.category,
      category_sort: fields.category_sort,
      level: Math.max(1, fields.level),
      order_index: fields.order_index,
      difficulty: fields.difficulty,
      beats: fields.beats,
      beat_type: fields.beat_type,
      program_slug: fields.program_slug.trim() || 'core',
      program_sort: fields.program_sort,
    }
    const { error } = await sb.from('rhythm_exercises').update(payload).eq('id', ex.id)
    setSaving(false)
    if (error) { setErr('Save failed: ' + error.message); return }
    onSaved({ ...ex, ...payload })
    setOpen(false)
  }

  const smallInp: React.CSSProperties = { ...inp, padding: '7px 10px', fontSize: '13px' }

  return (
    <div style={{ background: 'white', borderRadius: '10px', border: open ? '1px solid #1A1A18' : '1px solid #D3D1C7', overflow: 'hidden', transition: 'border 0.15s' }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontFamily: SERIF, fontSize: '15px', color: '#1A1A18', flex: 1 }}>{ex.title}</span>
        <span style={{ fontFamily: F, fontSize: '11px', color: '#888780' }}>{ex.beats}/{ex.beat_type}</span>
        <span style={{ fontFamily: F, fontSize: '11px', color: '#888780' }}>D{ex.difficulty}</span>
        <span style={{ fontFamily: F, fontSize: '10px', color: '#B0AEA8' }}>Lv{ex.level} #{ex.order_index}</span>
        <span style={{ fontFamily: F, fontSize: '11px', color: open ? '#1A1A18' : '#888780' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Edit panel */}
      {open && (
        <div style={{ borderTop: '1px solid #F0EDE8', padding: '16px 14px', background: '#FAFAF8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Title</label>
              <input value={fields.title} onChange={e => set('title', e.target.value)} style={smallInp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Category</label>
              <select value={fields.category} onChange={e => set('category', e.target.value)} style={smallInp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Category sort</label>
              <input type="number" value={fields.category_sort} onChange={e => set('category_sort', Number(e.target.value))} style={smallInp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Level</label>
              <input type="number" min={1} value={fields.level} onChange={e => set('level', Math.max(1, Number(e.target.value)))} style={smallInp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Order within level</label>
              <input type="number" min={0} value={fields.order_index} onChange={e => set('order_index', Number(e.target.value))} style={smallInp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Difficulty</label>
              <select value={fields.difficulty} onChange={e => set('difficulty', Number(e.target.value))} style={smallInp}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d} — {DIFFICULTY_LABEL[d]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Time Signature</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select value={fields.beats} onChange={e => set('beats', Number(e.target.value))} style={{ ...smallInp, flex: 1 }}>
                  {[2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontFamily: SERIF, fontSize: '18px', color: '#888780' }}>/</span>
                <select value={fields.beat_type} onChange={e => set('beat_type', Number(e.target.value))} style={{ ...smallInp, flex: 1 }}>
                  {[2,4,8,16].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Program slug</label>
              <input value={fields.program_slug} onChange={e => set('program_slug', e.target.value)} style={smallInp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '4px' }}>Program sort</label>
              <input type="number" value={fields.program_sort} onChange={e => set('program_sort', Number(e.target.value))} style={smallInp} />
            </div>
          </div>

          {err && <p style={{ fontFamily: F, fontSize: '12px', color: '#E53935', marginBottom: '10px' }}>{err}</p>}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button type="button" onClick={onDelete}
              style={{ background: 'none', border: '1px solid #F09595', borderRadius: '8px', color: '#E53935', fontFamily: F, fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}>
              Delete exercise
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { setOpen(false); setErr(null) }}
                style={{ background: 'none', border: '1px solid #D3D1C7', borderRadius: '8px', color: '#888780', fontFamily: F, fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{ background: saving ? '#D3D1C7' : '#1A1A18', border: 'none', borderRadius: '8px', color: 'white', fontFamily: F, fontSize: '12px', padding: '6px 18px', cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminRhythm() {
  const [exercises, setExercises] = useState<RhythmExerciseMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [difficulty, setDifficulty] = useState(1)
  const [beats, setBeats] = useState(4)
  const [beatType, setBeatType] = useState(4)
  const [orderIndex, setOrderIndex] = useState(0)
  const [programSlug, setProgramSlug] = useState('core')
  const [programSort, setProgramSort] = useState(0)
  const [categorySort, setCategorySort] = useState(0)
  const [level, setLevel] = useState(1)

  const sb = getSupabaseClient()

  const libraryTree = useMemo(
    () => buildRhythmLibraryTree(sortRhythmExercises(exercises)),
    [exercises]
  )

  async function loadExercises() {
    const { data } = await sb.from('rhythm_exercises').select(RHYTHM_ROW_SELECT)
    const rows = (data ?? []) as Record<string, unknown>[]
    setExercises(rows.map(rhythmMetaFromDbRow))
    setLoading(false)
  }

  useEffect(() => { loadExercises() }, [])

  async function handleUpload() {
    if (!file || !title.trim()) {
      setMessage({ text: 'Please select a file and enter a title.', ok: false })
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const base64 = await fileToBase64(file)
      const safeName = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const safeCat = category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const safeProg = programSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'core'
      const filePath = `${safeProg}/${safeCat}/${safeName}.mxl`

      const { error } = await sb.from('rhythm_exercises').insert({
        title: title.trim(),
        category,
        difficulty,
        beats,
        beat_type: beatType,
        order_index: orderIndex,
        program_slug: safeProg,
        program_sort: programSort,
        category_sort: categorySort,
        level: Math.max(1, level),
        file_path: filePath,
        file_data: base64,
      })

      if (error) throw new Error('Database: ' + error.message)
      setMessage({ text: `✓ "${title}" uploaded successfully.`, ok: true })
      setTitle(''); setFile(null); setOrderIndex(0)
      await loadExercises()
    } catch (err) {
      setMessage({ text: String(err), ok: false })
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteCategoryScope(programSlugDel: string, categoryName: string) {
    if (!confirm(`Delete ALL exercises in "${rhythmProgramTitle(programSlugDel)}" → "${categoryName}"?`)) return
    const targets = exercises.filter(e => e.program_slug === programSlugDel && e.category === categoryName)
    await Promise.all(targets.map(ex => sb.from('rhythm_exercises').delete().eq('id', ex.id)))
    await loadExercises()
  }

  async function handleDelete(ex: RhythmExerciseMeta) {
    if (!confirm(`Delete "${ex.title}"?`)) return
    await sb.from('rhythm_exercises').delete().eq('id', ex.id)
    await loadExercises()
  }

  function handleSaved(updated: RhythmExerciseMeta) {
    setExercises(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid #D3D1C7', fontFamily: F, fontSize: '14px',
    color: '#1A1A18', background: '#F5F2EC', outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', padding: '40px 32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#1A1A18', marginBottom: '4px' }}>
          Rhythm Library Admin
        </h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', marginBottom: '40px' }}>
          Upload and manage rhythm exercises (program → category → level)
        </p>

        {/* Upload */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '28px', marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', marginBottom: '20px' }}>
            Upload Exercise
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Quarter Notes #1" style={inp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Program slug</label>
              <input value={programSlug} onChange={e => setProgramSlug(e.target.value)} placeholder="core" style={inp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Program sort</label>
              <input type="number" value={programSort} onChange={e => setProgramSort(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Category sort</label>
              <input type="number" value={categorySort} onChange={e => setCategorySort(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Level</label>
              <input type="number" value={level} onChange={e => setLevel(Math.max(1, Number(e.target.value)))} min={1} style={inp} />
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} style={inp}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d} — {DIFFICULTY_LABEL[d]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Time Signature</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select value={beats} onChange={e => setBeats(Number(e.target.value))} style={{ ...inp, flex: 1 }}>
                  {[2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontFamily: SERIF, fontSize: '20px', color: '#888780' }}>/</span>
                <select value={beatType} onChange={e => setBeatType(Number(e.target.value))} style={{ ...inp, flex: 1 }}>
                  {[2,4,8,16].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>Order within level</label>
              <input type="number" value={orderIndex} onChange={e => setOrderIndex(Number(e.target.value))} min={0} style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontFamily: F, fontSize: '11px', color: '#888780', display: 'block', marginBottom: '6px' }}>MXL File</label>
              <input type="file" accept=".mxl,.xml,.musicxml"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ fontFamily: F, fontSize: '13px', color: '#1A1A18' }} />
              {file && <p style={{ fontFamily: F, fontSize: '12px', color: '#888780', marginTop: '4px' }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            </div>
          </div>

          {message && (
            <p style={{ fontFamily: F, fontSize: '13px', color: message.ok ? '#4CAF50' : '#E53935', marginBottom: '12px' }}>
              {message.text}
            </p>
          )}

          <button onClick={handleUpload} disabled={uploading || !file || !title.trim()}
            style={{ background: uploading || !file || !title.trim() ? '#D3D1C7' : '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: uploading || !file || !title.trim() ? 'default' : 'pointer' }}>
            {uploading ? 'Uploading…' : 'Upload Exercise'}
          </button>
        </div>

        {/* Library */}
        <div>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', marginBottom: '16px' }}>
            Library ({exercises.length})
          </p>
          {loading && <p style={{ fontFamily: F, fontSize: '13px', color: '#888780' }}>Loading…</p>}
          {!loading && exercises.length === 0 && (
            <p style={{ fontFamily: F, fontSize: '13px', color: '#888780' }}>No exercises yet.</p>
          )}
          {!loading && libraryTree.map(program => (
            <div key={program.slug} style={{ marginBottom: '28px' }}>
              <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#1A1A18', marginBottom: '12px' }}>
                {rhythmProgramTitle(program.slug)} <span style={{ fontFamily: F, fontSize: '12px', color: '#888780' }}>({program.slug})</span>
              </p>
              {program.categories.map(cat => (
                <div key={`${program.slug}::${cat.name}`} style={{ marginBottom: '20px', marginLeft: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 300, color: '#1A1A18', margin: 0 }}>{cat.name}</p>
                    <span style={{ fontFamily: F, fontSize: '10px', color: '#B0AEA8' }}>cat_sort={cat.category_sort}</span>
                    <button type="button" onClick={() => handleDeleteCategoryScope(program.slug, cat.name)}
                      style={{ background: 'none', border: '1px solid #F09595', borderRadius: '8px', color: '#E53935', fontFamily: F, fontSize: '11px', padding: '2px 8px', cursor: 'pointer' }}>
                      Delete category
                    </button>
                  </div>
                  {cat.levels.map(lvl => (
                    <div key={lvl.level} style={{ marginBottom: '12px', marginLeft: '12px' }}>
                      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888780', marginBottom: '6px' }}>
                        Level {lvl.level}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {lvl.exercises.map(ex => (
                          <ExerciseRow
                            key={ex.id}
                            ex={ex}
                            onDelete={() => handleDelete(ex)}
                            onSaved={handleSaved}
                            sb={sb}
                            inp={inp}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
