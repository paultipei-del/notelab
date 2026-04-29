const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const { createClient } = require('@supabase/supabase-js')

const envPath = path.join(process.cwd(), '.env.local')
const text = fs.readFileSync(envPath, 'utf-8')
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  const { data } = await supabase
    .from('rhythm_exercises')
    .select('id, title, level, file_data')
    .eq('program_slug', 'fundamentals')
    .eq('category', 'Basic Rests')
    .order('level')
    .order('order_index')

  const out = '/tmp/basic-rests-all'
  fs.mkdirSync(out, { recursive: true })

  for (const row of data) {
    const buf = Buffer.from(row.file_data, 'base64')
    const zip = await JSZip.loadAsync(buf)
    const container = await zip.file('META-INF/container.xml').async('text')
    const scorePath = container.match(/full-path="([^"]+)"/)[1]
    const xml = await zip.file(scorePath).async('text')
    const fname = `L${row.level}-${row.title.replace(/[^a-z0-9]/gi, '-')}.xml`
    fs.writeFileSync(path.join(out, fname), xml)
    console.log(`L${row.level} ${row.title}`)
  }
  console.log(`\nWrote ${data.length} files to ${out}`)
})()
