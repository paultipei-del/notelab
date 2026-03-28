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
