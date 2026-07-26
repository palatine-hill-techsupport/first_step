-- Expand booking eligibility and make each contact channel explicit.
alter type public.age_band rename value '16-17' to '15-17';

alter table public.appointments
  add column safe_to_text boolean not null default false,
  add column safe_contact_notes text;

alter table public.appointments
  add constraint appointments_safe_contact_notes_length_check
  check (safe_contact_notes is null or char_length(safe_contact_notes) <= 500);

-- Preserve one usable channel for legacy "both" bookings before removing that value.
alter table public.appointments
  drop constraint if exists appointments_contact_method_check;

update public.appointments
set contact_method = case
  when nullif(btrim(email), '') is not null and safe_to_email then 'email'
  when nullif(btrim(phone), '') is not null and safe_to_call then 'phone'
  when nullif(btrim(email), '') is not null then 'email'
  else 'phone'
end
where contact_method = 'both';

do $$
begin
  if exists (
    select 1
    from public.appointments
    where contact_method not in ('email', 'phone', 'sms')
  ) then
    raise exception 'Unsupported appointment contact method remains after migration';
  end if;

  if exists (
    select 1
    from public.appointments
    where (contact_method = 'email' and nullif(btrim(email), '') is null)
       or (contact_method in ('phone', 'sms') and nullif(btrim(phone), '') is null)
  ) then
    raise exception 'Appointment is missing the contact detail required by its selected method';
  end if;
end
$$;

alter table public.appointments
  add constraint appointments_contact_method_check
  check (contact_method in ('email', 'phone', 'sms')),
  add constraint appointments_contact_detail_required_check
  check (
    (contact_method = 'email' and nullif(btrim(email), '') is not null)
    or
    (contact_method in ('phone', 'sms') and nullif(btrim(phone), '') is not null)
  );

comment on column public.appointments.safe_to_text is
  'Whether the young person confirmed that SMS/text contact is safe.';

comment on column public.appointments.safe_contact_notes is
  'Optional booking-only instructions for safer contact; maximum 500 characters.';
