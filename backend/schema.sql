-- TDC Meets schema. Paste this into the Supabase SQL editor and run it once.

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  name text default 'Admin',
  created_at timestamptz default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  host_email text not null,
  room_id text unique not null,
  unlock_time timestamptz not null,
  end_time timestamptz,
  status text default 'scheduled',
  timezone text default 'IST',
  attendee_count integer default 0,
  recording_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  name text not null,
  email text,
  is_host boolean default false,
  is_muted boolean default true,
  is_kicked boolean default false,
  status text default 'active',
  joined_at timestamptz default now(),
  left_at timestamptz
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  sender_name text not null,
  sender_email text,
  message text not null,
  message_type text default 'text',
  timestamp timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  asker_name text not null,
  asker_email text,
  question text not null,
  status text default 'pending',
  raised_at timestamptz default now(),
  answered_at timestamptz
);

create index if not exists idx_meetings_room_id on meetings(room_id);
create index if not exists idx_attendees_meeting on attendees(meeting_id);
create index if not exists idx_messages_meeting on messages(meeting_id);
create index if not exists idx_questions_meeting on questions(meeting_id);

-- Only our backend touches these tables, using the service role key which
-- bypasses row level security. Enabling RLS with no policies means a leaked
-- anon key still cannot read admin password hashes or attendee emails.
alter table admins enable row level security;
alter table meetings enable row level security;
alter table attendees enable row level security;
alter table messages enable row level security;
alter table questions enable row level security;
