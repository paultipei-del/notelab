#!/usr/bin/env node
/**
 * Orphan cleanup: remove the duplicate Fundamentals topic rows sitting at
 * weird category_sort values (10 and 20) that shouldn't exist alongside the
 * canonical sort-1 and sort-2 versions of the same categories.
 *
 * Targets exactly two query patterns, scoped tightly:
 *   - program_slug='fundamentals' AND category='Pulse Games & Meter Basics' AND category_sort=10
 *   - program_slug='fundamentals' AND category='Quarter/Half/Whole Notes'   AND category_sort=20
 *
 * Run from the Notelab repo root:
 *   node scripts/cleanup-fundamentals-orphans.js
 *
 * Defaults to DRY_RUN. Flip the constant to false to actually delete.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DRY_RUN = true

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

const TARGETS = [
  { category: 'Pulse Games & Meter Basics', category_sort: 10 },
  { category: 'Quarter/Half/Whole Notes',   category_sort: 20 },
]

async function main() {
  let totalToDelete = 0
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no deletions)' : 'EXECUTE DELETION'}\n`)

  for (const t of TARGETS) {
    const { data, error } = await supabase
      .from('rhythm_exercises')
      .select('id, title, level')
      .eq('program_slug', 'fundamentals')
      .eq('category', t.category)
      .eq('category_sort', t.category_sort)

    if (error) throw new Error(`Query ${t.category}@${t.category_sort}: ${error.message}`)
    console.log(`Target: ${t.category} @ category_sort=${t.category_sort}`)
    console.log(`  Found ${data.length} orphan rows`)
    for (const row of data) console.log(`    - ${row.id} L${row.level} "${row.title}"`)
    totalToDelete += data.length

    if (!DRY_RUN && data.length > 0) {
      const { error: delErr } = await supabase
        .from('rhythm_exercises')
        .delete()
        .eq('program_slug', 'fundamentals')
        .eq('category', t.category)
        .eq('category_sort', t.category_sort)
      if (delErr) throw new Error(`Delete ${t.category}: ${delErr.message}`)
      console.log(`  → DELETED ${data.length} rows`)
    }
    console.log()
  }

  console.log(`Total ${DRY_RUN ? 'WOULD delete' : 'deleted'}: ${totalToDelete} rows`)
  if (DRY_RUN) console.log('\nDRY RUN — no changes made. Set DRY_RUN = false at the top of this file to actually delete.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
