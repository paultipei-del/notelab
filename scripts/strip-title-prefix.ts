#!/usr/bin/env npx tsx
/**
 * One-shot Phase A migration for rhythm_exercises.
 *
 *   1. Strip "#N - " prefix from DB `title` column.
 *   2. Strip "#N - " prefix from the <work-title> inside each MXL blob
 *      (the trainer header reads work-title via parseMXL, so the DB
 *      change alone leaves the trainer dirty).
 *   3. Renumber `order_index` to a contiguous 1..N within each
 *      (program_slug, category, level) tuple.
 *
 * Dry-run by default — log everything, write nothing. Pass `--apply`
 * (or set APPLY=1) to commit changes.
 *
 *   npx tsx scripts/strip-title-prefix.ts            # dry run
 *   npx tsx scripts/strip-title-prefix.ts --apply    # live
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

// ── Env ───────────────────────────────────────────────────────────────────────
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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const APPLY = process.argv.includes('--apply') || process.env.APPLY === '1'
const PREFIX_RE = /^#\d+\s*-\s*/

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripPrefix(title: string): string {
  return title.replace(PREFIX_RE, '')
}

async function rewriteWorkTitle(base64: string, newTitle: string): Promise<{
  newBase64: string
  oldWorkTitle: string
  changed: boolean
}> {
  const buffer = Buffer.from(base64, 'base64')
  const zip = await JSZip.loadAsync(buffer)
  const containerFile = zip.file('META-INF/container.xml')
  if (!containerFile) throw new Error('missing container.xml')
  const containerXml = await containerFile.async('text')
  const m = containerXml.match(/full-path="([^"]+)"/)
  const scorePath = m ? m[1] : 'score.xml'
  const scoreFile = zip.file(scorePath)
  if (!scoreFile) throw new Error(`missing score file at ${scorePath}`)
  const scoreXml = await scoreFile.async('text')
  const wtMatch = scoreXml.match(/<work-title>([^<]*)<\/work-title>/)
  const oldWorkTitle = wtMatch ? wtMatch[1] : ''
  if (oldWorkTitle === newTitle) {
    return { newBase64: base64, oldWorkTitle, changed: false }
  }
  // Escape XML-sensitive characters in the new title.
  const escaped = newTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const newScoreXml = scoreXml.replace(
    /<work-title>[^<]*<\/work-title>/,
    `<work-title>${escaped}</work-title>`,
  )
  zip.file(scorePath, newScoreXml)
  const newBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return { newBase64: newBuf.toString('base64'), oldWorkTitle, changed: true }
}

interface Row {
  id: string
  title: string
  program_slug: string
  category: string
  level: number
  order_index: number
  file_data: string | null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== rhythm_exercises Phase A migration ===`)
  console.log(`Mode: ${APPLY ? 'APPLY (writing to Supabase)' : 'DRY RUN (no writes)'}\n`)

  const { data, error } = await supabase
    .from('rhythm_exercises')
    .select('id, title, program_slug, category, level, order_index, file_data')
  if (error || !data) {
    console.error('Query failed:', error)
    process.exit(1)
  }
  const rows = data as Row[]
  console.log(`Pulled ${rows.length} rows\n`)

  // ─── Pass 1: title prefix strip ──────────────────────────────────────────
  console.log(`── Pass 1: strip "#N - " from DB title + MXL <work-title> ─────────`)
  let titleChanges = 0
  let mxlChanges = 0
  let mxlSkipped = 0
  let mxlAlreadyClean = 0
  let processed = 0

  for (const row of rows) {
    processed++
    if (processed % 50 === 0) console.log(`  …${processed}/${rows.length}`)

    const newTitle = stripPrefix(row.title)
    const titleNeedsChange = newTitle !== row.title

    let newFileData: string | null = null
    let oldWorkTitle = ''
    let mxlNeedsChange = false

    if (row.file_data) {
      try {
        const r = await rewriteWorkTitle(row.file_data, newTitle)
        oldWorkTitle = r.oldWorkTitle
        if (r.changed) {
          newFileData = r.newBase64
          mxlNeedsChange = true
        } else {
          mxlAlreadyClean++
        }
      } catch (e) {
        mxlSkipped++
        console.log(`  ! MXL skip ${row.id.slice(0,8)} "${row.title}" — ${(e as Error).message}`)
      }
    } else {
      mxlSkipped++
    }

    if (titleNeedsChange || mxlNeedsChange) {
      titleChanges += titleNeedsChange ? 1 : 0
      mxlChanges += mxlNeedsChange ? 1 : 0
      console.log(
        `  ${row.id.slice(0,8)} db: "${row.title}" → "${newTitle}"` +
        (oldWorkTitle && oldWorkTitle !== newTitle ? ` | mxl-work-title: "${oldWorkTitle}" → "${newTitle}"` : ''),
      )
      if (APPLY) {
        const update: Record<string, unknown> = {}
        if (titleNeedsChange) update.title = newTitle
        if (mxlNeedsChange && newFileData) update.file_data = newFileData
        const { error: upErr } = await supabase
          .from('rhythm_exercises')
          .update(update)
          .eq('id', row.id)
        if (upErr) {
          console.error(`  !! UPDATE FAILED ${row.id}: ${upErr.message}`)
          process.exit(1)
        }
      }
    }
  }

  console.log(`\n  DB title changes proposed:    ${titleChanges}`)
  console.log(`  MXL work-title changes:        ${mxlChanges}`)
  console.log(`  MXL already clean:             ${mxlAlreadyClean}`)
  console.log(`  MXL skipped (no/broken data):  ${mxlSkipped}`)

  // ─── Pass 2: order_index continuity check + renumber ─────────────────────
  console.log(`\n── Pass 2: verify order_index is contiguous 1..N per (program, category, level) ─`)

  // Re-read after potential apply (use cached if dry-run since no writes occurred).
  const groupKey = (r: Row) => `${r.program_slug}|${r.category}|L${r.level}`
  const groups = new Map<string, Row[]>()
  for (const r of rows) {
    const k = groupKey(r)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(r)
  }

  let groupsOK = 0
  let groupsToRenumber = 0
  let renumberedRows = 0

  for (const [k, members] of groups) {
    // Sort by current order_index, then by title (so "Foo" lands before
    // "Foo (3/4)" within a collision bucket), then by id for stability.
    // Use the *stripped* title for the title comparison so the post-strip
    // ordering is what wins, not whatever transient `#N -` prefixes existed.
    members.sort((a, b) => {
      if (a.order_index !== b.order_index) return a.order_index - b.order_index
      const at = stripPrefix(a.title)
      const bt = stripPrefix(b.title)
      if (at !== bt) return at.localeCompare(bt)
      return a.id.localeCompare(b.id)
    })
    const expected = members.map((_, i) => i + 1)
    const actual = members.map(m => m.order_index)
    const isContiguousFromOne =
      actual.length === expected.length && actual.every((v, i) => v === expected[i])
    if (isContiguousFromOne) {
      groupsOK++
      continue
    }
    groupsToRenumber++
    console.log(
      `  RENUMBER  ${k}  actual=[${actual.join(',')}]  →  [${expected.join(',')}]`,
    )
    for (let i = 0; i < members.length; i++) {
      const want = i + 1
      const have = members[i].order_index
      if (want === have) continue
      renumberedRows++
      console.log(
        `      ${members[i].id.slice(0,8)} "${stripPrefix(members[i].title)}" order_index ${have} → ${want}`,
      )
      if (APPLY) {
        const { error: upErr } = await supabase
          .from('rhythm_exercises')
          .update({ order_index: want })
          .eq('id', members[i].id)
        if (upErr) {
          console.error(`  !! UPDATE FAILED ${members[i].id}: ${upErr.message}`)
          process.exit(1)
        }
      }
    }
  }

  console.log(`\n  Groups already contiguous: ${groupsOK}`)
  console.log(`  Groups requiring renumber: ${groupsToRenumber}`)
  console.log(`  Rows renumbered:           ${renumberedRows}`)

  console.log(`\n=== ${APPLY ? 'Applied' : 'Dry-run complete — no writes performed'} ===\n`)
}

main().catch(e => {
  console.error('FATAL:', e)
  process.exit(1)
})
