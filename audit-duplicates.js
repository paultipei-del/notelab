const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const text = fs.readFileSync('.env.local', 'utf-8');
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase
    .from('rhythm_exercises')
    .select('program_slug, category, level, order_index')
    .order('program_slug').order('category').order('level').order('order_index');
  
  const counts = {};
  for (const r of data) {
    const key = r.program_slug + '|' + r.category + '|L' + r.level + '|order=' + r.order_index;
    counts[key] = (counts[key] || 0) + 1;
  }
  
  const dupes = Object.entries(counts).filter(([k, v]) => v > 1);
  console.log('Total rows:', data.length);
  console.log('Total (program, category, level, order) slots:', Object.keys(counts).length);
  console.log('Duplicated slots:', dupes.length);
  console.log('');
  console.log('Topics with duplicates:');
  const byTopic = {};
  dupes.forEach(([k, v]) => {
    const [prog, cat] = k.split('|');
    const t = prog + ' / ' + cat;
    byTopic[t] = (byTopic[t] || 0) + 1;
  });
  Object.entries(byTopic)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log('  ' + n + ' duplicate slots in: ' + t));
})();
