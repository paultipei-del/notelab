const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const text = fs.readFileSync('.env.local', 'utf-8');
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase
    .from('rhythm_exercises')
    .select('id, title, level, order_index, beats, beat_type, difficulty, file_path, file_data')
    .eq('program_slug', 'fundamentals')
    .eq('category', 'Pulse Games & Meter Basics')
    .order('level').order('order_index');
  console.log('Pulse Games & Meter Basics — ' + data.length + ' rows');
  console.log('');
  const dir = '/tmp/pulse-content';
  fs.mkdirSync(dir, { recursive: true });
  for (const r of data) {
    const buf = Buffer.from(r.file_data, 'base64');
    const zip = await JSZip.loadAsync(buf);
    const containerXml = await zip.file('META-INF/container.xml').async('text');
    const m = containerXml.match(/full-path="([^"]+)"/);
    const scoreXml = await zip.file(m ? m[1] : 'score.xml').async('text');
    const sha = require('crypto').createHash('sha256').update(scoreXml).digest('hex').slice(0,12);
    const noteCount = (scoreXml.match(/<note\b/g) || []).length;
    const noteTypes = [...scoreXml.matchAll(/<type>([^<]+)<\/type>/g)].map(m=>m[1]);
    const fname = path.join(dir, r.id.slice(0,8) + '.xml');
    fs.writeFileSync(fname, scoreXml);
    console.log('L' + r.level + ' ord=' + r.order_index + ' "' + r.title + '" beats=' + r.beats + '/' + r.beat_type + ' diff=' + r.difficulty + ' notes=' + noteCount + ' sha=' + sha + ' types=[' + [...new Set(noteTypes)].join(',') + ']');
    console.log('   file_path: ' + r.file_path);
  }
})();
