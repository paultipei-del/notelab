#!/usr/bin/env node
/**
 * Focused audit: do the two "entry" Fundamentals topics exist in the DB,
 * and are their exercises filled? These topics are NOT in the canonical seed
 * at scripts/generate-rhythm-exercises.ts, so they were created via admin UI.
 *
 * Run from the Notelab repo root:
 *   node /tmp/audit-fundamentals-entry.js
 */

const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
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

async function inspectMxl(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const container = zip.file('META-INF/container.xml')
    if (!container) return { ok: false, reason: 'missing_container' }
    const containerXml = await container.async('text')
    const m = containerXml.match(/full-path="([^"]+)"/)
    const scorePath = m ? m[1] : 'score.xml'
    const score = zip.file(scorePath)
    if (!score) return { ok: false, reason: 'missing_score_xml' }
    const scoreXml = await score.async('text')
    const measureCount = (scoreXml.match(/<measure\b/g) || []).length
    const noteCount = (scoreXml.match(/<note\b/g) || []).length
    if (measureCount === 0 || noteCount === 0) return { ok: false, reason: 'empty_score' }
    return { ok: true, measureCount, noteCount }
  } catch (e) {
    return { ok: false, reason: 'parse_error:' + e.message }
  }
}

async function main() {
  console.log('Querying Fundamentals topics 1 and 2…\n')

  const { data, error } = await supabase
    .from('rhythm_exercises')
    .select('id, title, category, level, category_sort, file_data')
    .eq('program_slug', 'fundamentals')
    .lte('category_sort', 2)
    .order('category_sort', { ascending: true })
    .order('level', { ascending: true })
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }

  if (data.length === 0) {
    console.log('NO ROWS FOUND with category_sort <= 2 in fundamentals.')
    console.log('Conclusion: the entry topics (Pulse Games & Meter Basics, Quarter/Half/Whole Notes) DO NOT EXIST in the DB.')
    console.log('The curriculum effectively starts at Basic Rests (sort 3).')
    return
  }

  // Group by (category_sort, category)
  const groups = new Map()
  for (const row of data) {
    const key = `${row.category_sort}::${row.category}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  for (const [key, rows] of groups) {
    const [sort, name] = key.split('::')
    console.log(`\n┌── sort=${sort} · ${name}`)
    console.log(`│  ${rows.length} exercises total`)

    let filled = 0, empty = 0, broken = 0
    const byLevel = {}
    for (const row of rows) {
      byLevel[row.level] = byLevel[row.level] || { filled: 0, empty: 0, broken: 0, total: 0 }
      byLevel[row.level].total++
      if (!row.file_data || row.file_data.length === 0) {
        empty++
        byLevel[row.level].empty++
        continue
      }
      const buffer = Buffer.from(row.file_data, 'base64')
      const result = await inspectMxl(buffer)
      if (result.ok) {
        filled++
        byLevel[row.level].filled++
      } else {
        broken++
        byLevel[row.level].broken++
      }
    }
    console.log(`│  filled: ${filled}, empty: ${empty}, broken: ${broken}`)
    for (const lvl of Object.keys(byLevel).sort()) {
      const b = byLevel[lvl]
      console.log(`│    L${lvl}: ${b.filled}/${b.total} filled${b.empty ? `, ${b.empty} empty` : ''}${b.broken ? `, ${b.broken} broken` : ''}`)
    }
  }

  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
