create or replace function public.confirm_prescription_care_plan(
  target_record_id uuid,
  target_member_id uuid,
  episode_title text,
  medication_input jsonb,
  follow_up_input jsonb default null
) returns uuid language plpgsql set search_path = '' as $$
declare
  new_episode_id uuid;
  new_medication_id uuid;
  frequency integer := (medication_input ->> 'frequencyPerDay')::integer;
  duration integer := (medication_input ->> 'durationDays')::integer;
  treatment_start date := coalesce((medication_input ->> 'startDate')::date, current_date);
begin
  if not exists (
    select 1 from public.health_records hr join public.family_members fm on fm.id = target_member_id
    where hr.id = target_record_id and hr.family_member_id = target_member_id and hr.family_id = fm.family_id
      and public.owns_family(hr.family_id)
  ) then raise exception 'Record or family member not found'; end if;

  insert into public.care_episodes (family_member_id, title, reason, status, start_date, end_date, primary_record_id)
  values (target_member_id, episode_title, 'Created from confirmed health record', 'active', treatment_start, treatment_start + (duration - 1), target_record_id)
  returning id into new_episode_id;

  insert into public.medications (care_episode_id, name, dose, unit, frequency_per_day, duration_days, instructions, start_date, end_date)
  values (new_episode_id, medication_input ->> 'name', (medication_input ->> 'dose')::numeric, medication_input ->> 'unit', frequency, duration, medication_input ->> 'instructions', treatment_start, treatment_start + (duration - 1))
  returning id into new_medication_id;

  insert into public.medication_doses (medication_id, scheduled_at)
  select new_medication_id, treatment_start::timestamptz + (floor(i / frequency) * interval '1 day') + ((8 + ((16.0 / frequency) * (i % frequency))) * interval '1 hour')
  from generate_series(0, (duration * frequency) - 1) as i;

  if follow_up_input is not null then
    insert into public.follow_ups (care_episode_id, family_member_id, title, due_at, source_record_id)
    values (new_episode_id, target_member_id, follow_up_input ->> 'title', treatment_start::timestamptz + interval '14 days', target_record_id);
  end if;

  update public.health_records set status = 'confirmed', confirmed_at = now() where id = target_record_id;
  return new_episode_id;
end;
$$;

grant execute on function public.confirm_prescription_care_plan(uuid, uuid, text, jsonb, jsonb) to authenticated;
