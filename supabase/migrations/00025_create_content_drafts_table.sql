
-- content_drafts: stores AI-generated social media content drafts
create table public.content_drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  platform    text not null check (platform in ('twitter_thread','twitter_hot_take','linkedin_longform','linkedin_carousel')),
  tone        text not null check (tone in ('data_driven','founder_story','hot_take','educational')),
  content     text not null,
  status      text not null default 'draft' check (status in ('draft','posted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- update updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger content_drafts_updated_at
  before update on public.content_drafts
  for each row execute function public.set_updated_at();

-- RLS
alter table public.content_drafts enable row level security;

-- authenticated users: full CRUD on their own rows
create policy "users can select own drafts"
  on public.content_drafts for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can insert own drafts"
  on public.content_drafts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update own drafts"
  on public.content_drafts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users can delete own drafts"
  on public.content_drafts for delete
  to authenticated
  using (user_id = auth.uid());

-- anon: no access
create policy "anon no access drafts"
  on public.content_drafts for all
  to anon
  using (false);
