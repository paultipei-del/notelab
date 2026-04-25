#!/usr/bin/env node
/**
 * One-shot DB update: swap categorySort for Simple Syncopation (5→7) and Ties (5→7→5)
 * in the rhythm_exercises table for the fundamentals program. Aligns the live DB
 * with the pedagogical reorder that lands in scripts/generate-rhythm-exercises.ts:
 * Ties now precedes Simple Syncopation so syncopation has its building blocks.
 *
 * Run from the Notelab repo root:
 *   node scripts/update-fundamentals-categorysort.js
 *
 * Idempotent: re-running after success is a no-op (queries find nothing to update).
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── Load .env.local ─────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local')
try {
  const text = fs.readFileSync(envPath, 'utf-8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch (e) {
  console.error(`Could not read .env.local at ${envPath}:`, e.message)
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  // Step 1: park Ties out of the way at sort 99 so the swap doesn't briefly
  // collide on a unique constraint (none exists today, but defensive).
  const park = await supabase
    .from('rhythm_exercises')
    .update({ category_sort: 99 })
    .eq('program_slug', 'fundamentals')
    .eq('category', 'Ties')
  if (park.error) throw new Error('Park Ties: ' + park.error.message)
  console.log(`Step 1: parked Ties at sort 99`)

  // Step 2: Simple Syncopation 5 → 7
  const sync = await supabase
    .from('rhythm_exercises')
    .update({ category_sort: 7 })
    .eq('program_slug', 'fundamentals')
    .eq('category', 'Simple Syncopation')
    .eq('category_sort', 5)
  if (sync.error) throw new Error('Sync 5→7: ' + sync.error.message)
  console.log(`Step 2: Simple Syncopation moved to sort 7`)

  // Step 3: Ties 99 → 5
  const ties = await supabase
    .from('rhythm_exercises')
    .update({ category_sort: 5 })
    .eq('program_slug', 'fundamentals')
    .eq('category', 'Ties')
    .eq('category_sort', 99)
  if (ties.error) throw new Error('Ties 99→5: ' + ties.error.message)
  console.log(`Step 3: Ties moved to sort 5`)

  // Verify
  const { data, error } = await supabase
    .from('rhythm_exercises')
    .select('category, category_sort')
    .eq('program_slug', 'fundamentals')
    .in('category', ['Simple Syncopation', 'Ties'])

  if (error) throw new Error('Verify: ' + error.message)
  const summary = {}
  for (const row of data) summary[`${row.category} @ sort=${row.category_sort}`] = (summary[`${row.category} @ sort=${row.category_sort}`] ?? 0) + 1
  console.log('\nVerification:')
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v} rows`)
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
