-- CM Prep lesson progress — one row per (user, lesson)
create table if not exists cm_prep_progress (
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_slug text not null,
  sessions    jsonb not null default '[]'::jsonb,
  completed   boolean not null default false,
  best_score  real not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

create index if not exists cm_prep_progress_user_idx on cm_prep_progress(user_id);

-- Row-level security: each user reads/writes only their own rows
alter table cm_prep_progress enable row level security;

create policy "cm_prep_progress_select_own"
  on cm_prep_progress for select
  using (auth.uid() = user_id);

create policy "cm_prep_progress_insert_own"
  on cm_prep_progress for insert
  with check (auth.uid() = user_id);

create policy "cm_prep_progress_update_own"
  on cm_prep_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cm_prep_progress_delete_own"
  on cm_prep_progress for delete
  using (auth.uid() = user_id);
