import { getSupabaseClient } from './supabase'

const RHYTHM_EXERCISE_COLUMNS =
  'id, title, category, order_index, difficulty, beats, beat_type, file_path, program_slug, program_sort, category_sort, level'

export interface RhythmExerciseMeta {
  id: string
  title: string
  category: string
  order_index: number
  difficulty: number
  beats: number
  beat_type: number
  file_path: string
  file_data?: string
  program_slug: string
  program_sort: number
  category_sort: number
  level: number
}

export type RhythmLevelNode = { level: number; exercises: RhythmExerciseMeta[] }
export type RhythmCategoryNode = { name: string; category_sort: number; levels: RhythmLevelNode[] }
export type RhythmProgramNode = { slug: string; program_sort: number; categories: RhythmCategoryNode[] }

/** Map a Supabase row to `RhythmExerciseMeta` (defaults for pre-migration or partial rows). */
export function rhythmMetaFromDbRow(row: Record<string, unknown>): RhythmExerciseMeta {
  const level = typeof row.level === 'number' ? row.level : 1
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    category: String(row.category ?? ''),
    order_index: typeof row.order_index === 'number' ? row.order_index : 0,
    difficulty: typeof row.difficulty === 'number' ? row.difficulty : 1,
    beats: typeof row.beats === 'number' ? row.beats : 4,
    beat_type: typeof row.beat_type === 'number' ? row.beat_type : 4,
    file_path: String(row.file_path ?? ''),
    file_data: typeof row.file_data === 'string' ? row.file_data : undefined,
    program_slug: typeof row.program_slug === 'string' && row.program_slug ? row.program_slug : 'core',
    program_sort: typeof row.program_sort === 'number' ? row.program_sort : 0,
    category_sort: typeof row.category_sort === 'number' ? row.category_sort : 0,
    level: Math.max(1, level),
  }
}

/** Stable sort: program → category → level → order_index → title. */
export function sortRhythmExercises(list: RhythmExerciseMeta[]): RhythmExerciseMeta[] {
  return [...list].sort((a, b) => {
    if (a.program_sort !== b.program_sort) return a.program_sort - b.program_sort
    if (a.program_slug !== b.program_slug) return a.program_slug.localeCompare(b.program_slug)
    if (a.category_sort !== b.category_sort) return a.category_sort - b.category_sort
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    if (a.level !== b.level) return a.level - b.level
    if (a.order_index !== b.order_index) return a.order_index - b.order_index
    return a.title.localeCompare(b.title)
  })
}

/**
 * Build program → category → level tree from a list already sorted with `sortRhythmExercises`.
 */
export function buildRhythmLibraryTree(sortedFlat: RhythmExerciseMeta[]): RhythmProgramNode[] {
  type CatAcc = { name: string; category_sort: number; levelMap: Map<number, RhythmExerciseMeta[]> }
  type ProgAcc = { slug: string; program_sort: number; catMap: Map<string, CatAcc> }
  const progOrder: string[] = []
  const progMap = new Map<string, ProgAcc>()

  for (const ex of sortedFlat) {
    let prog = progMap.get(ex.program_slug)
    if (!prog) {
      prog = { slug: ex.program_slug, program_sort: ex.program_sort, catMap: new Map() }
      progMap.set(ex.program_slug, prog)
      progOrder.push(ex.program_slug)
    }
    let cat = prog.catMap.get(ex.category)
    if (!cat) {
      cat = { name: ex.category, category_sort: ex.category_sort, levelMap: new Map() }
      prog.catMap.set(ex.category, cat)
    }
    let arr = cat.levelMap.get(ex.level)
    if (!arr) {
      arr = []
      cat.levelMap.set(ex.level, arr)
    }
    arr.push(ex)
  }

  const programs: RhythmProgramNode[] = progOrder.map(slug => {
    const p = progMap.get(slug)!
    const categories: RhythmCategoryNode[] = [...p.catMap.values()]
      .sort((a, b) =>
        a.category_sort !== b.category_sort ? a.category_sort - b.category_sort : a.name.localeCompare(b.name)
      )
      .map(c => ({
        name: c.name,
        category_sort: c.category_sort,
        levels: [...c.levelMap.entries()]
          .sort(([la], [lb]) => la - lb)
          .map(([level, exercises]) => ({ level, exercises })),
      }))
    return { slug: p.slug, program_sort: p.program_sort, categories }
  })

  programs.sort((a, b) =>
    a.program_sort !== b.program_sort ? a.program_sort - b.program_sort : a.slug.localeCompare(b.slug)
  )
  return programs
}

/** Global linear unlock order (same as sorted flat list). */
export function flattenRhythmUnlockOrder(sortedFlat: RhythmExerciseMeta[]): RhythmExerciseMeta[] {
  return sortedFlat
}

export async function fetchExerciseLibrary(): Promise<{
  flat: RhythmExerciseMeta[]
  tree: RhythmProgramNode[]
  unlockOrder: RhythmExerciseMeta[]
}> {
  const sb = getSupabaseClient()
  const { data, error } = await sb.from('rhythm_exercises').select(RHYTHM_EXERCISE_COLUMNS)
  if (error || !data) return { flat: [], tree: [], unlockOrder: [] }
  const flat = (data as Record<string, unknown>[]).map(rhythmMetaFromDbRow)
  const sorted = sortRhythmExercises(flat)
  const tree = buildRhythmLibraryTree(sorted)
  return { flat: sorted, tree, unlockOrder: sorted }
}

/** @deprecated Prefer `fetchExerciseLibrary` for hierarchy-aware UIs. */
export async function fetchExercisesByCategory(): Promise<Record<string, RhythmExerciseMeta[]>> {
  const { flat } = await fetchExerciseLibrary()
  const grouped: Record<string, RhythmExerciseMeta[]> = {}
  for (const ex of flat) {
    if (!grouped[ex.category]) grouped[ex.category] = []
    grouped[ex.category].push(ex)
  }
  return grouped
}

export async function fetchExerciseFile(id: string): Promise<ArrayBuffer> {
  const sb = getSupabaseClient()
  const { data, error } = await sb
    .from('rhythm_exercises')
    .select('file_data')
    .eq('id', id)
    .single()

  if (error || !data?.file_data) throw new Error('Could not load exercise file')

  // Decode base64 to ArrayBuffer
  const binary = atob(data.file_data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export interface RhythmProgress {
  id: string
  exercise_id: string
  best_timing: number
  best_duration: number
  attempts: number
  completed: boolean
  last_played: string
}

export async function fetchProgress(userId: string | null): Promise<Record<string, RhythmProgress>> {
  if (!userId) {
    // Use localStorage for anonymous users
    try {
      const raw = localStorage.getItem('rhythm-progress')
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  }
  const sb = getSupabaseClient()
  const { data } = await sb
    .from('rhythm_progress')
    .select('*')
    .eq('user_id', userId)
  const map: Record<string, RhythmProgress> = {}
  data?.forEach((p: RhythmProgress) => { map[p.exercise_id] = p })
  return map
}

export async function saveProgress(
  userId: string | null,
  exerciseId: string,
  timingPct: number,
  durationPct: number
): Promise<void> {
  const isCompleted = timingPct >= 90

  if (!userId) {
    // localStorage fallback for anonymous users
    try {
      const raw = localStorage.getItem('rhythm-progress')
      const map: Record<string, RhythmProgress> = raw ? JSON.parse(raw) : {}
      const existing = map[exerciseId]
      map[exerciseId] = {
        id: exerciseId,
        exercise_id: exerciseId,
        best_timing: Math.max(timingPct, existing?.best_timing ?? 0),
        best_duration: Math.max(durationPct, existing?.best_duration ?? 0),
        attempts: (existing?.attempts ?? 0) + 1,
        completed: existing?.completed || isCompleted,
        last_played: new Date().toISOString(),
      }
      localStorage.setItem('rhythm-progress', JSON.stringify(map))
    } catch {}
    return
  }

  const sb = getSupabaseClient()
  const { data: existing } = await sb
    .from('rhythm_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .maybeSingle()

  await sb.from('rhythm_progress').upsert({
    user_id: userId,
    exercise_id: exerciseId,
    best_timing: Math.max(timingPct, existing?.best_timing ?? 0),
    best_duration: Math.max(durationPct, existing?.best_duration ?? 0),
    attempts: (existing?.attempts ?? 0) + 1,
    completed: existing?.completed || isCompleted,
    last_played: new Date().toISOString(),
  }, { onConflict: 'user_id,exercise_id' })
}

export async function resetProgress(userId: string | null, exerciseId?: string): Promise<void> {
  if (!userId) {
    try {
      if (exerciseId) {
        const raw = localStorage.getItem('rhythm-progress')
        const map: Record<string, RhythmProgress> = raw ? JSON.parse(raw) : {}
        delete map[exerciseId]
        localStorage.setItem('rhythm-progress', JSON.stringify(map))
      } else {
        localStorage.removeItem('rhythm-progress')
      }
    } catch {}
    return
  }
  const sb = getSupabaseClient()
  if (exerciseId) {
    await sb.from('rhythm_progress').delete().eq('user_id', userId).eq('exercise_id', exerciseId)
  } else {
    await sb.from('rhythm_progress').delete().eq('user_id', userId)
  }
}
