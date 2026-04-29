#!/usr/bin/env node
/**
 * Rhythm content audit. Read-only.
 *
 * Run from the Notelab repo root:
 *   node /tmp/audit-rhythm-content.js
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from ./.env.local, pulls every
 * row from `rhythm_exercises`, decodes the base64 `file_data`, unzips the MXL,
 * and verifies the inner score.xml contains `<measure>` and `<note>` elements.
 * Aggregates by (program_slug, category, level) and dumps a JSON inventory to
 * /tmp/rhythm-audit.json plus a per-topic XML sample to /tmp/rhythm-samples/.
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function decodeBase64(b64) {
  return Buffer.from(b64, 'base64')
}

async function inspectMxl(buffer) {
  // Returns { ok: bool, reason: string, measureCount, noteCount, restCount, scoreXml? }
  let zip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch (e) {
    return { ok: false, reason: 'unzip_failed:' + e.message, measureCount: 0, noteCount: 0, restCount: 0 }
  }
  let containerXml
  try {
    const f = zip.file('META-INF/container.xml')
    if (!f) return { ok: false, reason: 'missing_container_xml', measureCount: 0, noteCount: 0, restCount: 0 }
    containerXml = await f.async('text')
  } catch (e) {
    return { ok: false, reason: 'container_read_failed:' + e.message, measureCount: 0, noteCount: 0, restCount: 0 }
  }
  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/)
  const scorePath = rootfileMatch ? rootfileMatch[1] : 'score.xml'
  let scoreXml
  try {
    const f = zip.file(scorePath)
    if (!f) return { ok: false, reason: 'missing_score_xml', measureCount: 0, noteCount: 0, restCount: 0 }
    scoreXml = await f.async('text')
  } catch (e) {
    return { ok: false, reason: 'score_read_failed:' + e.message, measureCount: 0, noteCount: 0, restCount: 0 }
  }
  // Light validation via regex/string ops — full DOM parsing isn't necessary
  const measureCount = (scoreXml.match(/<measure\b/g) || []).length
  const noteCount = (scoreXml.match(/<note\b/g) || []).length
  const restCount = (scoreXml.match(/<rest\b/g) || []).length
  if (measureCount === 0 || noteCount === 0) {
    return { ok: false, reason: `empty_score:m=${measureCount},n=${noteCount}`, measureCount, noteCount, restCount, scoreXml }
  }
  return { ok: true, reason: 'parsed', measureCount, noteCount, restCount, scoreXml }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching rhythm_exercises…')
  // First pass: metadata only (avoid double-loading large file_data twice)
  const { data, error } = await supabase
    .from('rhythm_exercises')
    .select('id, title, category, order_index, difficulty, beats, beat_type, program_slug, program_sort, category_sort, level, file_path, file_data')
  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }
  console.log(`Pulled ${data.length} rows`)

  const sampleDir = '/tmp/rhythm-samples'
  fs.mkdirSync(sampleDir, { recursive: true })

  // Aggregation
  const byProg = {}             // prog → cat → level → { filled, placeholder, broken, totals[] }
  const samples = {}            // "prog::cat" → first filled exercise's xml + meta
  const placeholderRows = []    // {id, title, prog, cat, level, reason}
  const brokenRows = []         // {id, title, prog, cat, level, reason}
  const filledRows = []
  const orphanRows = []

  let processed = 0
  for (const row of data) {
    processed++
    if (processed % 50 === 0) console.log(`  ${processed}/${data.length}…`)
    const prog = row.program_slug || '(no program)'
    const cat = row.category || '(no category)'
    const level = row.level == null ? -1 : row.level

    if (!byProg[prog]) byProg[prog] = { byCategory: {} }
    if (!byProg[prog].byCategory[cat]) byProg[prog].byCategory[cat] = { byLevel: {}, sortHint: row.category_sort }
    const catBucket = byProg[prog].byCategory[cat]
    if (!catBucket.byLevel[level]) catBucket.byLevel[level] = { filled: 0, placeholder: 0, broken: 0, ids: [] }
    const lvlBucket = catBucket.byLevel[level]
    lvlBucket.ids.push(row.id)

    if (!row.file_data || row.file_data.length === 0) {
      lvlBucket.placeholder++
      placeholderRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'no_file_data' })
      continue
    }
    let buffer
    try {
      buffer = decodeBase64(row.file_data)
      if (buffer.length === 0) {
        lvlBucket.placeholder++
        placeholderRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'empty_buffer' })
        continue
      }
    } catch (e) {
      lvlBucket.broken++
      brokenRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'b64_decode:' + e.message })
      continue
    }
    let result
    try {
      result = await inspectMxl(buffer)
    } catch (e) {
      lvlBucket.broken++
      brokenRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'inspect_threw:' + e.message })
      continue
    }
    if (!result.ok) {
      lvlBucket.broken++
      brokenRows.push({ id: row.id, title: row.title, prog, cat, level, reason: result.reason })
      continue
    }
    lvlBucket.filled++
    filledRows.push({ id: row.id, title: row.title, prog, cat, level, measures: result.measureCount, notes: result.noteCount, rests: result.restCount })

    // Save first filled sample per topic
    const sampleKey = `${prog}::${cat}`
    if (!samples[sampleKey]) {
      const safeName = `${prog}__${cat}`.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-')
      const xmlPath = path.join(sampleDir, `${safeName}.xml`)
      fs.writeFileSync(xmlPath, result.scoreXml)
      samples[sampleKey] = {
        id: row.id,
        title: row.title,
        program_slug: row.program_slug,
        category: row.category,
        level: row.level,
        beats: row.beats,
        beat_type: row.beat_type,
        difficulty: row.difficulty,
        file_path: row.file_path,
        measures: result.measureCount,
        notes: result.noteCount,
        rests: result.restCount,
        xmlPath,
        xmlBytes: result.scoreXml.length,
      }
    }
  }

  // Output JSON
  const out = {
    generatedAt: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0],
    totals: {
      rows: data.length,
      filled: filledRows.length,
      placeholder: placeholderRows.length,
      broken: brokenRows.length,
    },
    byProgram: byProg,
    samplesByTopic: samples,
    placeholderRows: placeholderRows.slice(0, 10),
    brokenRows: brokenRows.slice(0, 50),
    orphanRows,
  }
  const jsonPath = '/tmp/rhythm-audit.json'
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2))
  console.log(`\nWrote ${jsonPath}`)
  console.log(`  filled:      ${filledRows.length}`)
  console.log(`  placeholder: ${placeholderRows.length}`)
  console.log(`  broken:      ${brokenRows.length}`)
  console.log(`  samples:     ${Object.keys(samples).length} topics with at least one filled exercise`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
