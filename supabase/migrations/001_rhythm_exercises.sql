-- Rhythm exercises library
create table if not exists rhythm_exercises (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null,
  order_index  integer not null default 0,
  difficulty   integer not null default 1 check (difficulty between 1 and 5),
  beats        integer not null default 4,
  beat_type    integer not null default 4,
  file_path    text not null,
  created_at   timestamptz default now()
);

-- Order by category then difficulty then order_index
create index if not exists rhythm_exercises_order on rhythm_exercises(category, difficulty, order_index);

-- Storage bucket (run this in Supabase dashboard > Storage)
-- Create a bucket called "rhythm-exercises" and set it to public
