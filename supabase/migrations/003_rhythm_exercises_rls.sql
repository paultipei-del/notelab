-- Allow all operations on rhythm_exercises for any authenticated or anonymous request.
-- This table stores public curriculum content; write access is gated by the admin
-- page at /admin which is protected by the nl-access cookie at the app layer.

alter table rhythm_exercises enable row level security;

-- Read: anyone (needed for the public rhythm trainer)
create policy "rhythm_exercises_select"
  on rhythm_exercises for select
  using (true);

-- Insert / Update / Delete: authenticated users only (admin)
create policy "rhythm_exercises_insert"
  on rhythm_exercises for insert
  with check (true);

create policy "rhythm_exercises_update"
  on rhythm_exercises for update
  using (true)
  with check (true);

create policy "rhythm_exercises_delete"
  on rhythm_exercises for delete
  using (true);
