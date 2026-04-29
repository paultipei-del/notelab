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
    .select('id, title, level, file_path, order_index')
    .eq('program_slug', 'fundamentals')
    .eq('category', 'Basic Rests')
    .order('level').order('order_index');
  console.log('Found', data.length, 'rows in Basic Rests:');
  data.forEach(r => {
    const filePath = r.file_path ? r.file_path.slice(-40) : 'NULL';
    console.log('  L' + r.level + ' order=' + r.order_index + ' title="' + r.title + '" id=' + r.id.slice(0,8) + ' file=' + filePath);
  });
})();
