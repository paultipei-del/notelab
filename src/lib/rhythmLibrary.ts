import { getSupabaseClient } from './supabase'

export interface RhythmExerciseMeta {
  id: string
  title: string
  category: string
  order_index: number
  difficulty: number
  beats: number
  beat_type: number
  file_path: string
  file_data?: string  // base64 encoded mxl
}

export async function fetchExercisesByCategory(): Promise<Record<string, RhythmExerciseMeta[]>> {
  const sb = getSupabaseClient()
  const { data, error } = await sb
    .from('rhythm_exercises')
    .select('id, title, category, order_index, difficulty, beats, beat_type, file_path')
    .order('difficulty', { ascending: true })
    .order('order_index', { ascending: true })

  if (error || !data) return {}

  const grouped: Record<string, RhythmExerciseMeta[]> = {}
  data.forEach((ex: RhythmExerciseMeta) => {
    if (!grouped[ex.category]) grouped[ex.category] = []
    grouped[ex.category].push(ex)
  })
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
    .single()

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
