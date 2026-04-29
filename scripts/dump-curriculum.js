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
    .select('program_slug, program_sort, category, category_sort, level, order_index, title, beats, beat_type, difficulty')
    .order('program_sort').order('category_sort').order('level').order('order_index');
  // Aggregate by (program, category, level)
  const groups = {};
  for (const r of data) {
    const k = r.program_slug + '|' + r.category + '|' + r.level;
    if (!groups[k]) groups[k] = { program_slug: r.program_slug, program_sort: r.program_sort, category: r.category, category_sort: r.category_sort, level: r.level, rows: [] };
    groups[k].rows.push(r);
  }
  // Output as JSON for parsing in next step
  const summary = Object.values(groups).map(g => ({
    program_slug: g.program_slug,
    program_sort: g.program_sort,
    category: g.category,
    category_sort: g.category_sort,
    level: g.level,
    count: g.rows.length,
    titles: g.rows.map(r => r.title),
    timeSignatures: [...new Set(g.rows.map(r => r.beats + '/' + r.beat_type))],
    difficulty: [...new Set(g.rows.map(r => r.difficulty))],
  }));
  // Sort by program_sort, category_sort, level
  summary.sort((a, b) => {
    if (a.program_sort !== b.program_sort) return a.program_sort - b.program_sort;
    if (a.category_sort !== b.category_sort) return a.category_sort - b.category_sort;
    return a.level - b.level;
  });
  console.log(JSON.stringify(summary, null, 2));
})();
