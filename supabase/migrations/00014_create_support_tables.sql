
create table if not exists support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references support_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table support_conversations enable row level security;
alter table support_messages enable row level security;

-- support_conversations: users see their own; anon blocked
create policy "users_own_conversations" on support_conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- support_messages: users see messages in their conversations
create policy "users_own_messages" on support_messages
  for all to authenticated
  using (
    conversation_id in (
      select id from support_conversations where user_id = auth.uid()
    )
  )
  with check (
    conversation_id in (
      select id from support_conversations where user_id = auth.uid()
    )
  );

-- indexes
create index if not exists support_messages_conv_idx on support_messages(conversation_id, created_at);
create index if not exists support_conversations_user_idx on support_conversations(user_id, updated_at desc);
