
-- ── kira_memory: one row per user, persistent founder profile ──────────
create table if not exists kira_memory (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  current_idea text,
  stage        text check (stage in ('idea','building','launched','growing')),
  tech_stack   text[],
  target_market text,
  goals        text,
  notes        text,
  updated_at   timestamptz not null default now()
);

create index kira_memory_user_idx on kira_memory(user_id);

alter table kira_memory enable row level security;

create policy "kira_memory_select" on kira_memory for select to authenticated
  using (user_id = auth.uid());

create policy "kira_memory_insert" on kira_memory for insert to authenticated
  with check (user_id = auth.uid());

create policy "kira_memory_update" on kira_memory for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "kira_memory_delete" on kira_memory for delete to authenticated
  using (user_id = auth.uid());
