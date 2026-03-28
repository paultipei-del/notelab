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
}

export async function fetchExercisesByCategory(): Promise<Record<string, RhythmExerciseMeta[]>> {
  const sb = getSupabaseClient()
  const { data, error } = await sb
    .from('rhythm_exercises')
    .select('*')
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

export async function fetchExerciseFile(filePath: string): Promise<ArrayBuffer> {
  const sb = getSupabaseClient()
  const { data, error } = await sb.storage
    .from('rhythm-exercises')
    .download(filePath)
  if (error || !data) throw new Error('Could not load exercise file')
  return data.arrayBuffer()
}
