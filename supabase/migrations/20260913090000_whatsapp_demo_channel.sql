create type public.whatsapp_connection_status as enum ('connected', 'disconnected');
create type public.whatsapp_notification_status as enum ('pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'cancelled');
create type public.whatsapp_notification_kind as enum ('pre_dose', 'overdue_followup');

create table public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade, phone_e164 text not null, wa_id text not null unique,
  status public.whatsapp_connection_status not null default 'connected', greeting_message_id text, connected_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.whatsapp_dose_notifications (
  id uuid primary key default gen_random_uuid(), dose_id uuid not null references public.medication_doses(id) on delete cascade,
  connection_id uuid not null references public.whatsapp_connections(id) on delete cascade, kind public.whatsapp_notification_kind not null,
  scheduled_for timestamptz not null, status public.whatsapp_notification_status not null default 'pending', meta_message_id text unique,
  sent_at timestamptz, last_error text, created_at timestamptz not null default now(), unique(dose_id, connection_id, kind)
);
create table public.whatsapp_inbound_messages (
  meta_message_id text primary key, connection_id uuid references public.whatsapp_connections(id) on delete set null,
  body text not null, received_at timestamptz not null default now(), processed_at timestamptz
);
alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_dose_notifications enable row level security;
alter table public.whatsapp_inbound_messages enable row level security;
create policy whatsapp_connections_owner on public.whatsapp_connections for all using (user_id = auth.uid() and public.owns_family(family_id)) with check (user_id = auth.uid() and public.owns_family(family_id));
create policy whatsapp_notifications_owner on public.whatsapp_dose_notifications for select using (exists(select 1 from public.whatsapp_connections c where c.id = connection_id and c.user_id = auth.uid()));
create policy whatsapp_inbound_owner on public.whatsapp_inbound_messages for select using (exists(select 1 from public.whatsapp_connections c where c.id = connection_id and c.user_id = auth.uid()));
create index whatsapp_notifications_due_idx on public.whatsapp_dose_notifications(status, scheduled_for);
