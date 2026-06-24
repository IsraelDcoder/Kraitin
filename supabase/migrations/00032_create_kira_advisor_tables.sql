
-- Kira Advisor conversations
create table kira_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Kira Advisor messages
create table kira_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references kira_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

-- Indexes
create index kira_conversations_user_idx on kira_conversations(user_id, updated_at desc);
create index kira_messages_conv_idx      on kira_messages(conversation_id, created_at);

-- RLS
alter table kira_conversations enable row level security;
alter table kira_messages       enable row level security;

-- kira_conversations policies
create policy "kira_conv_select" on kira_conversations for select to authenticated
  using (user_id = auth.uid());
create policy "kira_conv_insert" on kira_conversations for insert to authenticated
  with check (user_id = auth.uid());
create policy "kira_conv_update" on kira_conversations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "kira_conv_delete" on kira_conversations for delete to authenticated
  using (user_id = auth.uid());

-- kira_messages: access via conversation ownership
create or replace function kira_user_owns_conversation(conv_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from kira_conversations where id = conv_id and user_id = auth.uid()
  );
$$;

create policy "kira_msg_select" on kira_messages for select to authenticated
  using (kira_user_owns_conversation(conversation_id));
create policy "kira_msg_insert" on kira_messages for insert to authenticated
  with check (kira_user_owns_conversation(conversation_id));
create policy "kira_msg_delete" on kira_messages for delete to authenticated
  using (kira_user_owns_conversation(conversation_id));
