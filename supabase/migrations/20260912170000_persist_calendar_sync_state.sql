alter table public.care_episodes
  add column if not exists google_calendar_synced_at timestamptz,
  add column if not exists google_calendar_event_count integer not null default 0
    check (google_calendar_event_count >= 0);

update public.care_episodes as episode
set
  google_calendar_synced_at = now(),
  google_calendar_event_count = (
    select count(*)::integer
    from public.medications as medication
    join public.medication_doses as dose on dose.medication_id = medication.id
    where medication.care_episode_id = episode.id
  ) + (
    select count(*)::integer
    from public.follow_ups as follow_up
    where follow_up.care_episode_id = episode.id
      and follow_up.google_calendar_event_id is not null
  )
where exists (
  select 1
  from public.follow_ups as follow_up
  where follow_up.care_episode_id = episode.id
    and follow_up.google_calendar_event_id is not null
);
