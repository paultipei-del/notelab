#!/usr/bin/env npx tsx
/**
 * generate-rhythm-exercises.ts
 * Run from project root: npx tsx scripts/generate-rhythm-exercises.ts
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { generateExercise, generateMusicXML, xmlToMxlBuffer } from '../src/lib/rhythmGenerator'
import type { NoteValue } from '../src/lib/rhythmGenerator'

// ── Load .env.local ───────────────────────────────────────────────────────────
try {
  const text = readFileSync('.env.local', 'utf-8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Types ─────────────────────────────────────────────────────────────────────
interface BlueprintEntry {
  programSlug: string
  programSort: number
  category: string
  categorySort: number
  level: number
  title: string
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

// ── Blueprint ─────────────────────────────────────────────────────────────────
const BLUEPRINT: BlueprintEntry[] = [

  // ─── SCHOOL BEGINNERS ─────────────────────────────────────────────────────

  // Pulse Games & Meter Basics — feel the beat in three time signatures, no rhythmic complexity
  { programSlug: 'fundamentals', programSort: 1, category: 'Pulse Games & Meter Basics', categorySort: 1, level: 1, title: 'Steady 4/4',   beats: 4, beatType: 4, measures: 4, noteValues: ['quarter'], dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 7 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Pulse Games & Meter Basics', categorySort: 1, level: 2, title: 'Waltz Time',   beats: 3, beatType: 4, measures: 4, noteValues: ['quarter'], dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 7 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Pulse Games & Meter Basics', categorySort: 1, level: 3, title: 'March Time',   beats: 2, beatType: 4, measures: 4, noteValues: ['quarter'], dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 7 },

  // Quarter/Half/Whole Notes — the three foundational note values, then the same values in 3/4
  { programSlug: 'fundamentals', programSort: 1, category: 'Quarter/Half/Whole Notes', categorySort: 2, level: 1, title: 'Quarter & Half',       beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','half'],          dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 8 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Quarter/Half/Whole Notes', categorySort: 2, level: 2, title: 'Adding Whole',         beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','half','whole'],  dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 7 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Quarter/Half/Whole Notes', categorySort: 2, level: 3, title: 'Note Values in 3/4',  beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','half'],          dotted: [], rests: false, ties: false, difficulty: 1, exerciseCount: 7 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3, level: 1, title: 'Quarter Rests',       beats: 4, beatType: 4, measures: 4, noteValues: ['quarter'],               dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3, level: 2, title: 'Half & Whole Rests',   beats: 4, beatType: 4, measures: 4, noteValues: ['whole','half','quarter'], dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3, level: 2, title: 'Half & Whole Rests',   beats: 3, beatType: 4, measures: 4, noteValues: ['half','quarter'],        dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3, level: 3, title: 'Mixed Rests',          beats: 4, beatType: 4, measures: 6, noteValues: ['whole','half','quarter'], dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Basic Rests',        categorySort: 3, level: 3, title: 'Mixed Rests',          beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],        dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4, level: 1, title: 'Eighth Stream',        beats: 4, beatType: 4, measures: 4, noteValues: ['eighth'],               dotted: [],            rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4, level: 2, title: 'Quarter + Eighths',    beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: false, ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4, level: 2, title: 'Quarter + Eighths',    beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: false, ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4, level: 3, title: 'Eighths with Rests',   beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Eighth Notes',       categorySort: 4, level: 3, title: 'Eighths with Rests',   beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Simple Syncopation', categorySort: 7, level: 1, title: 'Off-Beat Entries',     beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Simple Syncopation', categorySort: 7, level: 2, title: 'Syncopation Patterns', beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Simple Syncopation', categorySort: 7, level: 2, title: 'Syncopation Patterns', beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Simple Syncopation', categorySort: 7, level: 3, title: 'Syncopation + Rests',  beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],            rests: true,  ties: true,  difficulty: 2, exerciseCount: 4 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6, level: 1, title: 'Dotted Half',          beats: 3, beatType: 4, measures: 4, noteValues: ['half'],                 dotted: ['d.half'],    rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6, level: 2, title: 'Dotted Quarter',       beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: ['d.quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6, level: 2, title: 'Dotted Quarter',       beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: ['d.quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6, level: 3, title: 'Mixed Dotted',         beats: 4, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Dotted Rhythms',     categorySort: 6, level: 3, title: 'Mixed Dotted',         beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 2 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5, level: 1, title: 'Ties Within Beat',     beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','half'],        dotted: [],            rests: false, ties: true,  difficulty: 1, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5, level: 2, title: 'Ties Across Beats',    beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','half'],        dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5, level: 2, title: 'Ties Across Beats',    beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','half'],        dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5, level: 3, title: 'Ties & Barlines',      beats: 4, beatType: 4, measures: 6, noteValues: ['whole','half','quarter'], dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Ties',               categorySort: 5, level: 3, title: 'Ties & Barlines',      beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],        dotted: [],            rests: false, ties: true,  difficulty: 2, exerciseCount: 2 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Sixteenth Notes',    categorySort: 8, level: 1, title: 'Sixteenth Grid',       beats: 4, beatType: 4, measures: 4, noteValues: ['sixteenth'],            dotted: [],            rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Sixteenth Notes',    categorySort: 8, level: 2, title: 'Sixteenth Cells',      beats: 4, beatType: 4, measures: 4, noteValues: ['eighth','sixteenth'],    dotted: [],            rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Sixteenth Notes',    categorySort: 8, level: 3, title: 'Mixed Sixteenths',     beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth','sixteenth'], dotted: [],     rests: true,  ties: false, difficulty: 3, exerciseCount: 4 },

  { programSlug: 'fundamentals', programSort: 1, category: '6/8 Foundations',   categorySort: 9, level: 1, title: 'Big Beats',            beats: 6, beatType: 8, measures: 4, noteValues: ['eighth'],               dotted: ['d.quarter'], rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: '6/8 Foundations',   categorySort: 9, level: 2, title: '6/8 Eighths',          beats: 6, beatType: 8, measures: 4, noteValues: ['eighth'],               dotted: [],            rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'fundamentals', programSort: 1, category: '6/8 Foundations',   categorySort: 9, level: 3, title: '6/8 Mixed',            beats: 6, beatType: 8, measures: 4, noteValues: ['eighth','quarter'],     dotted: ['d.quarter'], rests: true,  ties: true,  difficulty: 3, exerciseCount: 4 },

  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 1, title: 'Spiral Review A',    beats: 4, beatType: 4, measures: 6, noteValues: ['whole','half','quarter'], dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 1, title: 'Spiral Review A',    beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],        dotted: [],            rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 2, title: 'Spiral Review B',    beats: 4, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'],dotted: [],            rests: true,  ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 2, title: 'Spiral Review B',    beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'],dotted: [],            rests: true,  ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 3, title: 'Checkpoint',         beats: 4, beatType: 4, measures: 8, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'], rests: true,  ties: true,  difficulty: 2, exerciseCount: 2 },
  { programSlug: 'fundamentals', programSort: 1, category: 'Mixed Review',       categorySort: 10, level: 3, title: 'Checkpoint',         beats: 3, beatType: 4, measures: 8, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'], rests: true,  ties: true,  difficulty: 2, exerciseCount: 2 },

  // ─── PERSONAL PRACTICE ────────────────────────────────────────────────────

  { programSlug: 'personal-practice', programSort: 2, category: 'Pulse Refresh',         categorySort: 1,  level: 1, title: 'Steady Beat Reset',    beats: 4, beatType: 4, measures: 4, noteValues: ['quarter'],               dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Pulse Refresh',         categorySort: 1,  level: 2, title: 'Reading Ease',         beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','half'],        dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Pulse Refresh',         categorySort: 1,  level: 2, title: 'Reading Ease',         beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','half'],        dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Pulse Refresh',         categorySort: 1,  level: 3, title: 'Warmup Lines',         beats: 4, beatType: 4, measures: 6, noteValues: ['whole','half','quarter'], dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Core Values + Rests',   categorySort: 2,  level: 1, title: 'Note Values',          beats: 4, beatType: 4, measures: 4, noteValues: ['whole','half','quarter'], dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Core Values + Rests',   categorySort: 2,  level: 2, title: 'Rests in Flow',        beats: 4, beatType: 4, measures: 4, noteValues: ['half','quarter'],        dotted: [],              rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Core Values + Rests',   categorySort: 2,  level: 2, title: 'Rests in Flow',        beats: 3, beatType: 4, measures: 4, noteValues: ['half','quarter'],        dotted: [],              rests: true,  ties: false, difficulty: 1, exerciseCount: 2 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Core Values + Rests',   categorySort: 2,  level: 3, title: 'Mixed Values',         beats: 4, beatType: 4, measures: 6, noteValues: ['whole','half','quarter'], dotted: [],              rests: true,  ties: false, difficulty: 2, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Eighth-Note Fluency',   categorySort: 3,  level: 1, title: 'Straight Eighths',     beats: 4, beatType: 4, measures: 4, noteValues: ['eighth'],               dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Eighth-Note Fluency',   categorySort: 3,  level: 2, title: 'Eighth Groove',        beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Eighth-Note Fluency',   categorySort: 3,  level: 3, title: 'Eighth Sync',          beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 2, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Groove Syncopation',    categorySort: 4,  level: 1, title: 'Backbeat',             beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Groove Syncopation',    categorySort: 4,  level: 2, title: 'Sync Loop',            beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Groove Syncopation',    categorySort: 4,  level: 3, title: 'Sync + Rests',         beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Groove Syncopation',    categorySort: 4,  level: 4, title: 'Groove Variation',     beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 2, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Dotted Values',         categorySort: 5,  level: 1, title: 'Dotted Long',          beats: 3, beatType: 4, measures: 4, noteValues: ['half'],                 dotted: ['d.half'],      rests: false, ties: false, difficulty: 1, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Dotted Values',         categorySort: 5,  level: 2, title: 'Dotted Quarter',       beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: ['d.quarter'],   rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Dotted Values',         categorySort: 5,  level: 3, title: 'Dotted Phrase',        beats: 4, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'],   rests: false, ties: false, difficulty: 2, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Ties + Phrase',         categorySort: 6,  level: 1, title: 'Sustain',              beats: 4, beatType: 4, measures: 4, noteValues: ['half','quarter'],        dotted: [],              rests: false, ties: true,  difficulty: 1, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Ties + Phrase',         categorySort: 6,  level: 2, title: 'Phrase Arc',           beats: 4, beatType: 4, measures: 6, noteValues: ['whole','half','quarter'], dotted: [],              rests: false, ties: true,  difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Ties + Phrase',         categorySort: 6,  level: 3, title: 'Ties Across Bar',      beats: 4, beatType: 4, measures: 6, noteValues: ['half','quarter'],        dotted: [],              rests: false, ties: true,  difficulty: 2, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Sixteenth Groove',      categorySort: 7,  level: 1, title: 'Sixteenth Pocket',     beats: 4, beatType: 4, measures: 4, noteValues: ['eighth','sixteenth'],    dotted: [],              rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Sixteenth Groove',      categorySort: 7,  level: 2, title: 'Funk Fragment',        beats: 4, beatType: 4, measures: 4, noteValues: ['eighth','sixteenth'],    dotted: [],              rests: true,  ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Sixteenth Groove',      categorySort: 7,  level: 3, title: 'Mixed Groove',         beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth','sixteenth'], dotted: [],       rests: true,  ties: true,  difficulty: 3, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Sixteenth Groove',      categorySort: 7,  level: 4, title: 'Groove Etude',         beats: 4, beatType: 4, measures: 8, noteValues: ['quarter','eighth','sixteenth'], dotted: ['d.eighth'], rests: true, ties: true, difficulty: 3, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Compound Meter',        categorySort: 8,  level: 1, title: 'Two Big Beats',        beats: 6,  beatType: 8, measures: 4, noteValues: ['eighth'],              dotted: ['d.quarter'],   rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Compound Meter',        categorySort: 8,  level: 2, title: 'Rolling 12/8',         beats: 12, beatType: 8, measures: 4, noteValues: ['eighth'],              dotted: ['d.quarter'],   rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Compound Meter',        categorySort: 8,  level: 3, title: 'Compound Space',       beats: 6,  beatType: 8, measures: 4, noteValues: ['eighth'],              dotted: ['d.quarter'],   rests: true,  ties: true,  difficulty: 3, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Style Modules',         categorySort: 9,  level: 1, title: 'Straight Style',       beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Style Modules',         categorySort: 9,  level: 2, title: 'Swing Feel',           beats: 4, beatType: 4, measures: 4, noteValues: ['eighth'],               dotted: ['d.eighth'],    rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Style Modules',         categorySort: 9,  level: 3, title: 'Latin Ostinato',       beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 3, exerciseCount: 4 },

  { programSlug: 'personal-practice', programSort: 2, category: 'Reading Etudes',        categorySort: 10, level: 1, title: 'Short Etude',          beats: 4, beatType: 4, measures: 6, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'],   rests: true,  ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Reading Etudes',        categorySort: 10, level: 2, title: 'Mixed Concept',        beats: 4, beatType: 4, measures: 8, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'],   rests: true,  ties: true,  difficulty: 2, exerciseCount: 4 },
  { programSlug: 'personal-practice', programSort: 2, category: 'Reading Etudes',        categorySort: 10, level: 3, title: 'Performance Read',     beats: 4, beatType: 4, measures: 8, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'],   rests: true,  ties: true,  difficulty: 3, exerciseCount: 4 },

  // ─── CONSERVATORY PREP ────────────────────────────────────────────────────

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Precision Pulse',        categorySort: 1,  level: 1, title: 'Metronome Drill',      beats: 4, beatType: 4, measures: 4, noteValues: ['quarter'],               dotted: [],              rests: false, ties: false, difficulty: 2, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Precision Pulse',        categorySort: 1,  level: 2, title: 'Subdivision Ladder',   beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth','sixteenth'], dotted: [],         rests: false, ties: false, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Precision Pulse',        categorySort: 1,  level: 3, title: 'Grid Independence',    beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth','sixteenth'], dotted: [],         rests: true,  ties: false, difficulty: 3, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Advanced Simple Meter',  categorySort: 2,  level: 1, title: 'Dense Reading',        beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth','sixteenth'], dotted: [],         rests: true,  ties: false, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Advanced Simple Meter',  categorySort: 2,  level: 2, title: 'Displacement',         beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 4, exerciseCount: 2 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Advanced Simple Meter',  categorySort: 2,  level: 2, title: 'Displacement',         beats: 3, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 4, exerciseCount: 2 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Advanced Simple Meter',  categorySort: 2,  level: 3, title: 'Stamina',              beats: 4, beatType: 4, measures: 8, noteValues: ['quarter','eighth','sixteenth'], dotted: ['d.quarter'], rests: true, ties: true, difficulty: 4, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Complex Rests',          categorySort: 3,  level: 1, title: 'Rests as Rhythm',      beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: false, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Complex Rests',          categorySort: 3,  level: 2, title: 'Anticipated Silence',  beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Complex Rests',          categorySort: 3,  level: 3, title: 'Rest Sync',            beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 4, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Syncopation Systems',    categorySort: 4,  level: 1, title: 'Offbeat Families',     beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Syncopation Systems',    categorySort: 4,  level: 2, title: 'Cross-Beat',           beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Syncopation Systems',    categorySort: 4,  level: 3, title: 'Cross-Bar',            beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: [],              rests: true,  ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Syncopation Systems',    categorySort: 4,  level: 4, title: 'Sync Synthesis',       beats: 4, beatType: 4, measures: 8, noteValues: ['quarter','eighth','sixteenth'], dotted: [],       rests: true,  ties: true,  difficulty: 5, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Dotted/Tied Complexity', categorySort: 5,  level: 1, title: 'Compound Dotted',      beats: 3, beatType: 4, measures: 6, noteValues: ['half','quarter'],        dotted: ['d.half','d.quarter'], rests: false, ties: false, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Dotted/Tied Complexity', categorySort: 5,  level: 2, title: 'Dots + Ties',          beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth'],      dotted: ['d.quarter'],   rests: false, ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Dotted/Tied Complexity', categorySort: 5,  level: 3, title: 'Dotted Barlines',      beats: 4, beatType: 4, measures: 8, noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'],   rests: false, ties: true,  difficulty: 4, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Sixteenth Vocabulary',   categorySort: 6,  level: 1, title: 'Permutation',          beats: 4, beatType: 4, measures: 4, noteValues: ['sixteenth'],            dotted: [],              rests: false, ties: false, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Sixteenth Vocabulary',   categorySort: 6,  level: 2, title: 'Mixed Subdivision',    beats: 4, beatType: 4, measures: 6, noteValues: ['eighth','sixteenth'],    dotted: [],              rests: true,  ties: false, difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Sixteenth Vocabulary',   categorySort: 6,  level: 3, title: 'Sixteenth Density',    beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth','sixteenth'], dotted: [],       rests: true,  ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Sixteenth Vocabulary',   categorySort: 6,  level: 4, title: 'Permutation Etude',    beats: 4, beatType: 4, measures: 8, noteValues: ['quarter','eighth','sixteenth'], dotted: ['d.eighth'], rests: true, ties: true, difficulty: 5, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Compound Mastery',       categorySort: 7,  level: 1, title: 'Compound Hierarchy',   beats: 6, beatType: 8, measures: 4, noteValues: ['eighth'],               dotted: ['d.quarter'],   rests: false, ties: false, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Compound Mastery',       categorySort: 7,  level: 2, title: 'Compound Subdivision', beats: 9, beatType: 8, measures: 4, noteValues: ['eighth','sixteenth'],    dotted: ['d.quarter'],   rests: false, ties: false, difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Compound Mastery',       categorySort: 7,  level: 3, title: 'Compound Silence',     beats: 6, beatType: 8, measures: 6, noteValues: ['eighth'],               dotted: ['d.quarter'],   rests: true,  ties: true,  difficulty: 4, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Mixed Meter',            categorySort: 8,  level: 1, title: 'Grouping 5/8',         beats: 5, beatType: 8, measures: 4, noteValues: ['eighth'],               dotted: [],              rests: false, ties: false, difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Mixed Meter',            categorySort: 8,  level: 2, title: 'Pattern Switch',       beats: 7, beatType: 8, measures: 4, noteValues: ['eighth'],               dotted: [],              rests: false, ties: false, difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Mixed Meter',            categorySort: 8,  level: 3, title: 'Mixed Meter',          beats: 5, beatType: 8, measures: 6, noteValues: ['eighth','quarter'],     dotted: [],              rests: true,  ties: true,  difficulty: 5, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Polyrhythm Prep',        categorySort: 9,  level: 1, title: '2 Against 3',          beats: 3, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Polyrhythm Prep',        categorySort: 9,  level: 2, title: 'Embedded Poly',        beats: 4, beatType: 4, measures: 4, noteValues: ['quarter','eighth'],      dotted: [],              rests: false, ties: true,  difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Polyrhythm Prep',        categorySort: 9,  level: 3, title: 'Polyrhythm',           beats: 4, beatType: 4, measures: 6, noteValues: ['quarter','eighth','sixteenth'], dotted: [],       rests: true,  ties: true,  difficulty: 5, exerciseCount: 4 },

  { programSlug: 'conservatory-prep', programSort: 3, category: 'Performance Etudes',     categorySort: 10, level: 1, title: 'Controlled Etude',     beats: 4, beatType: 4, measures: 8,  noteValues: ['half','quarter','eighth'],dotted: ['d.quarter'],                   rests: true, ties: true, difficulty: 3, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Performance Etudes',     categorySort: 10, level: 2, title: 'Combined Demands',     beats: 4, beatType: 4, measures: 8,  noteValues: ['quarter','eighth','sixteenth'], dotted: ['d.quarter'],           rests: true, ties: true, difficulty: 4, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Performance Etudes',     categorySort: 10, level: 3, title: 'Jury Checkpoint',      beats: 4, beatType: 4, measures: 12, noteValues: ['quarter','eighth','sixteenth'], dotted: ['d.quarter','d.eighth'], rests: true, ties: true, difficulty: 5, exerciseCount: 4 },
  { programSlug: 'conservatory-prep', programSort: 3, category: 'Performance Etudes',     categorySort: 10, level: 4, title: 'Final Capstone',       beats: 4, beatType: 4, measures: 16, noteValues: ['quarter','eighth','sixteenth'], dotted: ['d.quarter','d.eighth'], rests: true, ties: true, difficulty: 5, exerciseCount: 4 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function toBase64Mxl(exercise: ReturnType<typeof generateExercise>, title: string): Promise<string> {
  const xml = generateMusicXML(exercise, title)
  const buffer = await xmlToMxlBuffer(xml)
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const total = BLUEPRINT.reduce((s, e) => s + e.exerciseCount, 0)
  console.log(`Generating ${total} exercises across ${BLUEPRINT.length} blueprint entries...\n`)

  let n = 0
  let errors = 0

  for (const entry of BLUEPRINT) {
    const dotPool: NoteValue[] = entry.dotted.map(d => d.replace('d.', '') as NoteValue)
    const hasDots = dotPool.length > 0

    const safeProg = slugify(entry.programSlug)
    const safeCat  = slugify(entry.category)

    for (let i = 1; i <= entry.exerciseCount; i++) {
      n++
      // The blueprint title is the final user-facing title. Sequence within a
      // (program, category, level) tuple is communicated by `order_index`, not
      // by an in-title "#N -" prefix.
      const title = entry.title
      const safeTitle = slugify(`${title}-${i}`)
      const filePath = `generated/${safeProg}/${safeCat}/${safeTitle}-${Date.now()}.mxl`

      const exercise = generateExercise({
        timeSignature: { beats: entry.beats, beatType: entry.beatType },
        measures: entry.measures,
        notePool: entry.noteValues as NoteValue[],
        allowRests: entry.rests,
        restProbability: 0.25,
        allowDots: hasDots,
        dotPool,
        dotProbability: 0.3,
        allowTies: entry.ties,
        tieProbability: 0.2,
        allowTuplets: false,
        tupletType: null,
        hands: 1,
        seed: Math.floor(Math.random() * 999999),
      })

      const base64 = await toBase64Mxl(exercise, title)

      const { error } = await supabase.from('rhythm_exercises').insert({
        title,
        category:      entry.category,
        difficulty:    entry.difficulty,
        beats:         entry.beats,
        beat_type:     entry.beatType,
        order_index:   i,
        program_slug:  entry.programSlug,
        program_sort:  entry.programSort,
        category_sort: entry.categorySort,
        level:         entry.level,
        file_path:     filePath,
        file_data:     base64,
      })

      if (error) {
        console.error(`[${n}/${total}] ERROR: ${title} — ${error.message}`)
        errors++
      } else {
        console.log(`[${n}/${total}] Saved: ${title} (${entry.programSlug} / ${entry.category} / L${entry.level})`)
      }

      await delay(300)
    }
  }

  console.log(`\nDone — ${n - errors}/${total} saved, ${errors} errors.`)
}

main().catch(err => { console.error(err); process.exit(1) })
