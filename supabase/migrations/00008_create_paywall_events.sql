
-- Paywall analytics events table
create table paywall_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete set null,
  event_type  text        not null check (event_type in ('viewed','upgrade_clicked','dismissed')),
  feature     text        not null,
  source      text,
  plan        text        check (plan in ('monthly','yearly') or plan is null),
  created_at  timestamptz not null default now()
);

-- Indexes for analytics queries
create index paywall_events_feature_idx    on paywall_events(feature);
create index paywall_events_event_type_idx on paywall_events(event_type);
create index paywall_events_user_id_idx    on paywall_events(user_id);
create index paywall_events_created_at_idx on paywall_events(created_at desc);

-- Enable RLS
alter table paywall_events enable row level security;

-- Anon can insert (track unauthenticated visitors too)
create policy "anon_insert_paywall_events"
  on paywall_events for insert
  to anon
  with check (user_id is null);

-- Anon can read nothing
create policy "anon_select_paywall_events"
  on paywall_events for select
  to anon
  using (false);

-- Authenticated users can insert their own events
create policy "auth_insert_paywall_events"
  on paywall_events for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);

-- Authenticated users can read their own events
create policy "auth_select_paywall_events"
  on paywall_events for select
  to authenticated
  using (user_id = auth.uid());

-- No updates or deletes for regular users
create policy "auth_no_update_paywall_events"
  on paywall_events for update
  to authenticated
  using (false);

create policy "auth_no_delete_paywall_events"
  on paywall_events for delete
  to authenticated
  using (false);

-- Analytics view: conversion stats per feature (security definer so admins can query)
create or replace view paywall_conversion_stats
with (security_invoker = false)
as
select
  feature,
  count(*)                                                           as total_events,
  count(*) filter (where event_type = 'viewed')                     as views,
  count(*) filter (where event_type = 'upgrade_clicked')            as clicks,
  count(*) filter (where event_type = 'dismissed')                  as dismissals,
  round(
    100.0 * count(*) filter (where event_type = 'upgrade_clicked')
    / nullif(count(*) filter (where event_type = 'viewed'), 0), 1
  )                                                                  as conversion_rate,
  count(*) filter (where plan = 'yearly')                           as yearly_plan_clicks,
  count(*) filter (where plan = 'monthly')                          as monthly_plan_clicks,
  max(created_at)                                                    as last_event_at
from paywall_events
group by feature
order by clicks desc;
