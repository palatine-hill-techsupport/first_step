-- first_step initial production schema
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.app_role as enum ('participant', 'youth_worker', 'admin');
create type public.age_band as enum ('16-17', '18-25');
create type public.appointment_format as enum ('phone', 'video', 'text', 'in_person');
create type public.appointment_status as enum ('requested', 'confirmed', 'cancelled_participant', 'cancelled_worker', 'completed', 'no_show');
create type public.resource_status as enum ('active', 'needs_review', 'archived');
create type public.source_type as enum ('verified_external', 'demonstration', 'future_partner');
create type public.referral_status as enum ('offered', 'consented', 'ready_to_send', 'sent', 'accepted', 'unable_to_contact', 'declined', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'participant',
  display_name text not null check (char_length(display_name) between 1 and 80),
  email text,
  phone text,
  age_band public.age_band,
  safe_to_email boolean not null default false,
  safe_to_call boolean not null default false,
  safe_to_voicemail boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.youth_workers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  slug text not null unique,
  first_name text not null,
  pronouns text,
  short_bio text not null check (char_length(short_bio) <= 400),
  supported_topics text[] not null default '{}',
  supported_formats public.appointment_format[] not null default '{}',
  active boolean not null default true,
  qualification_status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_summary text not null,
  accessibility_summary text not null,
  active boolean not null default true
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.youth_workers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  appointment_format public.appointment_format not null,
  location_id uuid references public.service_locations(id) on delete set null,
  active boolean not null default true,
  check (end_time > start_time)
);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.youth_workers(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  exception_type text not null check (exception_type in ('unavailable', 'additional')),
  reason text check (char_length(reason) <= 160),
  check ((start_time is null and end_time is null) or end_time > start_time)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.profiles(id) on delete set null,
  guest_management_token_hash text,
  worker_id uuid not null references public.youth_workers(id) on delete restrict,
  location_id uuid references public.service_locations(id) on delete set null,
  format public.appointment_format not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'requested',
  participant_name text not null check (char_length(participant_name) between 1 and 80),
  age_band public.age_band not null,
  contact_method text not null check (contact_method in ('email', 'phone', 'both')),
  email text,
  phone text,
  safe_to_email boolean not null default false,
  safe_to_call boolean not null default false,
  safe_to_voicemail boolean not null default false,
  support_topics text[] not null,
  accessibility_needs text check (char_length(accessibility_needs) <= 500),
  consent_version text not null,
  consented_at timestamptz not null,
  meeting_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check (participant_id is not null or guest_management_token_hash is not null)
);

-- Exclude overlapping active bookings for the same worker at database level.
alter table public.appointments add constraint appointments_worker_no_overlap
  exclude using gist (
    worker_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('requested', 'confirmed'));

create table public.appointment_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  organisation text not null,
  summary text not null,
  full_description text not null,
  category text not null,
  urgency text not null check (urgency in ('urgent', 'soon', 'anytime')),
  formats text[] not null,
  age_min smallint,
  age_max smallint,
  location text not null,
  cost_summary text not null,
  next_step text not null,
  contact_summary text not null,
  opening_hours text not null,
  website_url text,
  phone text,
  status public.resource_status not null default 'needs_review',
  source_type public.source_type not null,
  last_verified_at date,
  no_referral_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null,
  referral_email text,
  referral_requirements text,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete restrict,
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  worker_id uuid not null references public.youth_workers(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  status public.referral_status not null default 'offered',
  approved_contact_details jsonb not null default '{}',
  approved_topics text[] not null default '{}',
  participant_approved_summary text check (char_length(participant_approved_summary) <= 500),
  consented_at timestamptz,
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status = 'offered' and consented_at is null) or status = 'declined' or consented_at is not null)
);

create table public.saved_resources (
  participant_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (participant_id, resource_id)
);

create table public.guided_pathway_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id uuid,
  current_stage text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz
);

create table public.guided_pathway_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.guided_pathway_sessions(id) on delete cascade,
  selected_topic text not null,
  format_preference text,
  recommended_resource_ids uuid[] not null default '{}',
  saved_at timestamptz
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  route text not null,
  stage text,
  topic text,
  anonymous_session_id uuid,
  participant_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.service_settings (
  id uuid primary key default gen_random_uuid(),
  service_status text not null default 'open' check (service_status in ('open', 'closed', 'limited')),
  response_hours text not null,
  appointment_duration_minutes smallint not null default 30,
  booking_buffer_minutes smallint not null default 15,
  minimum_notice_hours smallint not null default 12,
  maximum_booking_days smallint not null default 21,
  chat_open_minutes_before smallint not null default 10,
  chat_close_minutes_after smallint not null default 60,
  consent_version text not null,
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index appointments_participant_start_idx on public.appointments(participant_id, start_at desc);
create index appointments_worker_start_idx on public.appointments(worker_id, start_at);
create index appointment_messages_appointment_created_idx on public.appointment_messages(appointment_id, created_at);
create index resources_public_filter_idx on public.resources(status, category, urgency);
create index resources_last_verified_idx on public.resources(last_verified_at);
create index referrals_participant_status_idx on public.referrals(participant_id, status);
create index referrals_worker_status_idx on public.referrals(worker_id, status);
create index analytics_event_created_idx on public.analytics_events(event_name, created_at desc);
create index audit_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);

create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() = 'admin', false) $$;

create or replace function public.current_worker_id() returns uuid
language sql stable security definer set search_path = public
as $$ select id from public.youth_workers where profile_id = auth.uid() and active = true $$;

alter table public.profiles enable row level security;
alter table public.youth_workers enable row level security;
alter table public.service_locations enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_messages enable row level security;
alter table public.resources enable row level security;
alter table public.partners enable row level security;
alter table public.referrals enable row level security;
alter table public.saved_resources enable row level security;
alter table public.guided_pathway_sessions enable row level security;
alter table public.guided_pathway_results enable row level security;
alter table public.analytics_events enable row level security;
alter table public.service_settings enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = public.current_app_role());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy workers_public_active on public.youth_workers for select using (active = true or profile_id = auth.uid() or public.is_admin());
create policy workers_self_update on public.youth_workers for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy workers_admin_all on public.youth_workers for all using (public.is_admin()) with check (public.is_admin());

create policy locations_public_active on public.service_locations for select using (active = true);
create policy locations_admin_all on public.service_locations for all using (public.is_admin()) with check (public.is_admin());

create policy availability_public_read on public.availability_rules for select using (active = true);
create policy availability_worker_manage on public.availability_rules for all using (worker_id = public.current_worker_id()) with check (worker_id = public.current_worker_id());
create policy availability_admin_all on public.availability_rules for all using (public.is_admin()) with check (public.is_admin());
create policy exceptions_worker_manage on public.availability_exceptions for all using (worker_id = public.current_worker_id()) with check (worker_id = public.current_worker_id());
create policy exceptions_admin_all on public.availability_exceptions for all using (public.is_admin()) with check (public.is_admin());

create policy appointments_participant_read on public.appointments for select using (participant_id = auth.uid());
create policy appointments_participant_update on public.appointments for update using (participant_id = auth.uid()) with check (participant_id = auth.uid());
create policy appointments_worker_read on public.appointments for select using (worker_id = public.current_worker_id());
create policy appointments_worker_update on public.appointments for update using (worker_id = public.current_worker_id()) with check (worker_id = public.current_worker_id());
create policy appointments_admin_all on public.appointments for all using (public.is_admin()) with check (public.is_admin());
-- Guest token access is intentionally server-only. The browser never receives a policy based on a raw token.

create policy messages_participant_access on public.appointment_messages for select using (
  exists (select 1 from public.appointments a where a.id = appointment_id and a.participant_id = auth.uid())
);
create policy messages_participant_insert on public.appointment_messages for insert with check (
  sender_profile_id = auth.uid() and exists (select 1 from public.appointments a where a.id = appointment_id and a.participant_id = auth.uid())
);
create policy messages_worker_access on public.appointment_messages for select using (
  exists (select 1 from public.appointments a where a.id = appointment_id and a.worker_id = public.current_worker_id())
);
create policy messages_worker_insert on public.appointment_messages for insert with check (
  sender_profile_id = auth.uid() and exists (select 1 from public.appointments a where a.id = appointment_id and a.worker_id = public.current_worker_id())
);

create policy resources_public_active on public.resources for select using (status = 'active');
create policy resources_admin_all on public.resources for all using (public.is_admin()) with check (public.is_admin());
create policy partners_public_active on public.partners for select using (active = true);
create policy partners_admin_all on public.partners for all using (public.is_admin()) with check (public.is_admin());

create policy referrals_participant_read on public.referrals for select using (participant_id = auth.uid());
create policy referrals_participant_consent on public.referrals for update using (participant_id = auth.uid() and status = 'offered') with check (participant_id = auth.uid() and status in ('consented', 'declined'));
create policy referrals_worker_access on public.referrals for all using (worker_id = public.current_worker_id()) with check (worker_id = public.current_worker_id());
create policy referrals_admin_all on public.referrals for all using (public.is_admin()) with check (public.is_admin());

create policy saved_resources_self on public.saved_resources for all using (participant_id = auth.uid()) with check (participant_id = auth.uid());
create policy pathway_sessions_self on public.guided_pathway_sessions for all using (participant_id = auth.uid()) with check (participant_id = auth.uid());
create policy pathway_results_self on public.guided_pathway_results for all using (
  exists (select 1 from public.guided_pathway_sessions s where s.id = session_id and s.participant_id = auth.uid())
) with check (
  exists (select 1 from public.guided_pathway_sessions s where s.id = session_id and s.participant_id = auth.uid())
);

create policy analytics_insert_valid_user on public.analytics_events for insert with check (participant_id is null or participant_id = auth.uid());
create policy analytics_admin_aggregate_source on public.analytics_events for select using (public.is_admin());
create policy settings_public_read on public.service_settings for select using (true);
create policy settings_admin_all on public.service_settings for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin_read on public.audit_events for select using (public.is_admin());

-- Profile creation is driven by the authenticated user. Role is always participant here.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name, email)
  values (new.id, 'participant', coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
