const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const text = fs.readFileSync('.env.local', 'utf-8');
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DRY_RUN = true;

(async () => {
  const { data } = await supabase
    .from('rhythm_exercises')
    .select('id, program_slug, category, level, order_index, file_path, created_at')
    .order('program_slug').order('category').order('level').order('order_index').order('created_at');
  
  const slots = {};
  for (const r of data) {
    const key = r.program_slug + '|' + r.category + '|L' + r.level + '|order=' + r.order_index;
    if (!slots[key]) slots[key] = [];
    slots[key].push(r);
  }
  
  const toDelete = [];
  for (const [key, rows] of Object.entries(slots)) {
    if (rows.length > 1) {
      const keeper = rows[0];
      const dupes = rows.slice(1);
      console.log('SLOT: ' + key);
      console.log('  KEEP:   ' + keeper.id.slice(0,8) + ' file=' + (keeper.file_path ? keeper.file_path.slice(-40) : 'NULL'));
      for (const d of dupes) {
        console.log('  DELETE: ' + d.id.slice(0,8) + ' file=' + (d.file_path ? d.file_path.slice(-40) : 'NULL'));
        toDelete.push(d.id);
      }
    }
  }
  
  console.log('');
  console.log('Plan: delete ' + toDelete.length + ' duplicate rows');
  console.log('After dedup, total rows: ' + (data.length - toDelete.length));
  
  if (DRY_RUN) {
    console.log('');
    console.log('DRY RUN — no changes made. Set DRY_RUN = false to actually delete.');
    return;
  }
  
  console.log('');
  console.log('EXECUTING DELETION...');
  const { error } = await supabase.from('rhythm_exercises').delete().in('id', toDelete);
  if (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
  console.log('Deleted ' + toDelete.length + ' rows successfully.');
})();
