create extension if not exists pgcrypto;

create type public.care_episode_status as enum ('draft', 'active', 'completed', 'archived');
create type public.dose_status as enum ('scheduled', 'taken', 'missed', 'skipped');
create type public.follow_up_status as enum ('pending', 'scheduled', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'My Family',
  created_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  relationship text not null,
  date_of_birth date,
  avatar_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  family_member_id uuid references public.family_members(id) on delete set null,
  cloudinary_public_id text not null,
  cloudinary_url text not null,
  mime_type text not null,
  record_type text not null default 'unknown',
  record_date date,
  status text not null default 'uploaded',
  raw_ai_output_json jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.care_episodes (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  title text not null,
  reason text,
  status public.care_episode_status not null default 'draft',
  start_date date not null,
  end_date date,
  primary_record_id uuid references public.health_records(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  care_episode_id uuid not null references public.care_episodes(id) on delete cascade,
  name text not null,
  dose numeric not null check (dose > 0),
  unit text not null,
  frequency_per_day integer not null check (frequency_per_day between 1 and 12),
  duration_days integer not null check (duration_days between 1 and 365),
  instructions text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table public.medication_doses (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_at timestamptz not null,
  status public.dose_status not null default 'scheduled',
  taken_at timestamptz,
  caregiver_member_id uuid references public.family_members(id) on delete set null,
  caregiver_user_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (medication_id, scheduled_at)
);

create table public.health_events (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  care_episode_id uuid references public.care_episodes(id) on delete set null,
  event_type text not null,
  title text not null,
  description text,
  occurred_at timestamptz not null,
  source_type text not null,
  source_id text,
  reported_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  care_episode_id uuid references public.care_episodes(id) on delete set null,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  status public.follow_up_status not null default 'pending',
  source_record_id uuid references public.health_records(id) on delete set null,
  google_calendar_event_id text,
  created_at timestamptz not null default now()
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  provider text not null default 'google',
  encrypted_access_token text,
  encrypted_refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  langgraph_thread_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, family_id, langgraph_thread_id)
);

create table public.memory_references (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  care_episode_id uuid references public.care_episodes(id) on delete set null,
  provider text not null,
  provider_memory_id text not null,
  category text not null check (category in ('episodic', 'semantic')),
  content text not null,
  source_type text not null,
  source_id text not null,
  confidence numeric check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (provider, provider_memory_id)
);

create or replace function public.owns_family(target_family_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.families where id = target_family_id and owner_user_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  insert into public.families (owner_user_id, name) values (new.id, 'My Family');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.health_records enable row level security;
alter table public.care_episodes enable row level security;
alter table public.medications enable row level security;
alter table public.medication_doses enable row level security;
alter table public.health_events enable row level security;
alter table public.follow_ups enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.agent_threads enable row level security;
alter table public.memory_references enable row level security;

create policy profiles_owner on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy families_owner on public.families for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy family_members_owner on public.family_members for all using (public.owns_family(family_id)) with check (public.owns_family(family_id));
create policy health_records_owner on public.health_records for all using (public.owns_family(family_id)) with check (public.owns_family(family_id));
create policy care_episodes_owner on public.care_episodes for all using (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id))) with check (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id)));
create policy medications_owner on public.medications for all using (exists(select 1 from public.care_episodes ce join public.family_members fm on fm.id = ce.family_member_id where ce.id = care_episode_id and public.owns_family(fm.family_id))) with check (exists(select 1 from public.care_episodes ce join public.family_members fm on fm.id = ce.family_member_id where ce.id = care_episode_id and public.owns_family(fm.family_id)));
create policy medication_doses_owner on public.medication_doses for all using (exists(select 1 from public.medications m join public.care_episodes ce on ce.id = m.care_episode_id join public.family_members fm on fm.id = ce.family_member_id where m.id = medication_id and public.owns_family(fm.family_id))) with check (exists(select 1 from public.medications m join public.care_episodes ce on ce.id = m.care_episode_id join public.family_members fm on fm.id = ce.family_member_id where m.id = medication_id and public.owns_family(fm.family_id)));
create policy health_events_owner on public.health_events for all using (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id))) with check (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id)));
create policy follow_ups_owner on public.follow_ups for all using (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id))) with check (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id)));
create policy calendar_connections_owner on public.calendar_connections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy agent_threads_owner on public.agent_threads for all using (user_id = auth.uid() and public.owns_family(family_id)) with check (user_id = auth.uid() and public.owns_family(family_id));
create policy memory_references_owner on public.memory_references for all using (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id))) with check (exists(select 1 from public.family_members fm where fm.id = family_member_id and public.owns_family(fm.family_id)));

create index family_members_family_idx on public.family_members(family_id);
create index health_records_family_member_idx on public.health_records(family_id, family_member_id);
create index care_episodes_member_status_idx on public.care_episodes(family_member_id, status);
create index medication_doses_schedule_idx on public.medication_doses(medication_id, scheduled_at);
create index health_events_member_time_idx on public.health_events(family_member_id, occurred_at desc);
create index follow_ups_member_due_idx on public.follow_ups(family_member_id, due_at);
create index memory_references_member_idx on public.memory_references(family_member_id, created_at desc);
