#!/usr/bin/env npx tsx
/**
 * Restore the 3/4-meter variant exercises that the dedupe pass collapsed.
 * The blueprint defined separate 4/4 and 3/4 entries per level with the
 * SAME title, so the (program, category, level, title) dedupe key killed
 * the 3/4 variants. This script re-inserts them with " (3/4)" suffixed
 * titles so they're title-unique and dedupe-safe going forward.
 *
 * Idempotent: re-running checks for existing rows with the suffixed title
 * before inserting, so no duplicates pile up if you run it twice.
 *
 * Run from project root:
 *   cd ~/Notelab && npx tsx scripts/restore-meter-variants.ts
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { generateExercise, generateMusicXML, xmlToMxlBuffer } from '../src/lib/rhythmGenerator'
import type { NoteValue } from '../src/lib/rhythmGenerator'

try {
  const text = readFileSync('.env.local', 'utf-8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface Variant {
  programSlug: string
  programSort: number
  category: string
  categorySort: number
  level: number
  baseTitle: string
  beats: number
  beatType: number
  measures: number
  noteValues: string[]
  dotted: string[]
  rests: boolean
  ties: boolean
  difficulty: number
  exerciseCount: number
}

// 3/4 variants from the blueprint that were lost. Titles get " (3/4)" appended
// at insert time to make them title-unique relative to their 4/4 siblings.
const VARIANTS: Variant[] = [
  // Fundamentals
  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3,  level: 2, baseTitle: 'Half & Whole Rests',   beats: 3, beatType: 4, measures: 4, noteValues: ['half','quarter'],         dotted: [], rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3,  level: 3, baseTitle: 'Mixed Rests',           beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],         dotted: [], rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4,  level: 2, baseTitle: 'Quarter + Eighths',     beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],       dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4,  level: 3, baseTitle: 'Eighths with Rests',    beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],       dotted: [], rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5,  level: 2, baseTitle: 'Ties Across Beats',     beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','half'],         dotted: [], rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5,  level: 3, baseTitle: 'Ties & Barlines',       beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],         dotted: [], rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6,  level: 2, baseTitle: 'Dotted Quarter',        beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],       dotted: ['quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6,  level: 3, baseTitle: 'Mixed Dotted',          beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'], dotted: ['quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Simple Syncopation', categorySort: 7,  level: 2, baseTitle: 'Syncopation Patterns',  beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],       dotted: [], rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 1, baseTitle: 'Spiral Review A',       beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],         dotted: [], rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 2, baseTitle: 'Spiral Review B',       beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'], dotted: [], rests: true,  ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 3, baseTitle: 'Checkpoint',            beats: 3, beatType: 4, measures: 8, noteValues: ['half','quarter','eighth'], dotted: ['quarter'], rests: true, ties: true, difficulty: 2, exerciseCount: 2 },
  // Personal Practice
  { programSlug: 'personal-practice', programSort: 2, category: 'Pulse Refresh',       categorySort: 1, level: 2, baseTitle: 'Reading Ease',  beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','half'], dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Core Values + Rests', categorySort: 2, level: 2, baseTitle: 'Rests in Flow', beats: 3, beatType: 4, measures: 4, noteValues: ['half','quarter'], dotted: [], rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  // Conservatory Prep
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Advanced Simple Meter', categorySort: 2, level: 2, baseTitle: 'Displacement', beats: 3, beatType: 4, measures: 6, noteValues: ['quarter','eighth'], dotted: [], rests: true, ties: true, difficulty: 4, exerciseCount: 2 },
]

function slugify(s: string) { return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }

async function toBase64Mxl(exercise: ReturnType<typeof generateExercise>, title: string): Promise<string> {
  const xml = generateMusicXML(exercise, title)
  const buffer = await xmlToMxlBuffer(xml)
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

async function main() {
  let inserted = 0
  let skipped = 0
  for (const v of VARIANTS) {
    const dotPool: NoteValue[] = v.dotted as NoteValue[]
    for (let i = 1; i <= v.exerciseCount; i++) {
      // Final user-facing title — sequence is communicated via order_index.
      const title = `${v.baseTitle} (3/4)`
      // Idempotency check: do we already have this row?
      const { data: existing } = await supabase
        .from('rhythm_exercises')
        .select('id')
        .eq('program_slug', v.programSlug)
        .eq('category', v.category)
        .eq('level', v.level)
        .eq('title', title)
        .limit(1)
      if (existing && existing.length > 0) { skipped++; continue }

      const exercise = generateExercise({
        timeSignature: { beats: v.beats, beatType: v.beatType },
        measures: v.measures,
        notePool: v.noteValues as NoteValue[],
        allowRests: v.rests, restProbability: 0.25,
        allowDots: dotPool.length > 0, dotPool, dotProbability: 0.3,
        allowTies: v.ties, tieProbability: 0.2,
        allowTuplets: false, tupletType: null,
        hands: 1, seed: Math.floor(Math.random() * 999999),
      })
      const base64 = await toBase64Mxl(exercise, title)
      const filePath = `generated/${slugify(v.programSlug)}/${slugify(v.category)}/${slugify(title)}-${Date.now()}.mxl`
      const { error } = await supabase.from('rhythm_exercises').insert({
        title, category: v.category, difficulty: v.difficulty,
        beats: v.beats, beat_type: v.beatType, order_index: i,
        program_slug: v.programSlug, program_sort: v.programSort,
        category_sort: v.categorySort, level: v.level,
        file_path: filePath, file_data: base64,
      })
      if (error) throw new Error(`Insert ${title}: ${error.message}`)
      inserted++
      console.log(`  + ${v.programSlug}/${v.category}/L${v.level} ${title}`)
    }
  }
  console.log(`\nDone. Inserted ${inserted} new rows, skipped ${skipped} existing.`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
