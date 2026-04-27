#!/usr/bin/env npx tsx
/**
 * Manual backup of `rhythm_exercises` to a local JSON file. Captures every
 * column including the base64 `file_data` blobs, so a restore is a single
 * upsert against the captured rows.
 *
 *   npx tsx scripts/backup-rhythm-exercises.ts            # writes to ./backups/
 *   npx tsx scripts/backup-rhythm-exercises.ts /custom/path.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { createClient } from '@supabase/supabase-js'

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

async function main() {
  const tsIso = new Date().toISOString().replace(/[:.]/g, '-')
  const outPath = process.argv[2] ?? `backups/rhythm_exercises_${tsIso}.json`
  mkdirSync(dirname(outPath), { recursive: true })

  console.log(`Pulling all rhythm_exercises rows…`)
  const { data, error } = await supabase
    .from('rhythm_exercises')
    .select('*')
  if (error || !data) {
    console.error('Backup failed:', error)
    process.exit(1)
  }
  const sizeMb = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(2)
  writeFileSync(outPath, JSON.stringify({
    backedUpAt: new Date().toISOString(),
    rowCount: data.length,
    rows: data,
  }, null, 2))
  console.log(`✓ ${data.length} rows backed up to ${outPath} (${sizeMb} MB)`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
