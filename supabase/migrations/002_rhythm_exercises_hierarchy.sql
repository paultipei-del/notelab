-- Hierarchy: program → category → level → exercise ordering
alter table rhythm_exercises
  add column if not exists program_slug text not null default 'core',
  add column if not exists program_sort integer not null default 0,
  add column if not exists category_sort integer not null default 0,
  add column if not exists level integer not null default 1 check (level >= 1);

drop index if exists rhythm_exercises_order;
create index if not exists rhythm_exercises_library_order
  on rhythm_exercises (program_sort, category_sort, category, level, order_index);
