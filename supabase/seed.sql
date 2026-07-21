-- Demonstration seed. Use fictional staff and clearly labelled pilot content only.
insert into public.service_locations (id, name, address_summary, accessibility_summary, active) values
  ('10000000-0000-0000-0000-000000000001', 'Collingwood pilot room', 'Near Smith Street, Collingwood', 'Step-free entry; quiet room available', true),
  ('10000000-0000-0000-0000-000000000002', 'Footscray community room', 'Near Footscray Station', 'Step-free entry; accessible toilet', true)
on conflict do nothing;

insert into public.resources (slug, title, organisation, summary, full_description, category, urgency, formats, age_min, age_max, location, cost_summary, next_step, contact_summary, opening_hours, website_url, phone, status, source_type, last_verified_at, no_referral_required) values
('victoria-homelessness-support', 'Victoria statewide homelessness support', 'Victorian homelessness support line', '24-hour housing and support line.', 'An external statewide housing and homelessness support line.', 'Safe place tonight', 'urgent', array['phone'], null, null, 'Victoria', 'Call costs may apply', 'Call 1800 825 955.', 'An external service answers.', '24 hours, every day', null, '1800825955', 'active', 'verified_external', current_date, true),
('kids-helpline', 'Kids Helpline', 'Kids Helpline', 'Free, private and confidential support for young people aged 5–25.', 'An external phone and online support service.', 'Talk to someone', 'urgent', array['phone','online'], 5, 25, 'Australia', 'Free', 'Call 1800 55 1800.', 'A Kids Helpline counsellor responds.', '24 hours, every day', 'https://kidshelpline.com.au/', '1800551800', 'active', 'verified_external', current_date, true),
('tafe-and-vce-vm-options', 'Explore TAFE and VCE VM options', 'first_step pathway guide', 'Compare practical study routes.', 'Demonstration guide requiring provider confirmation.', 'Study and training', 'anytime', array['online','phone','in-person'], 16, 25, 'Victoria', 'Varies', 'Save questions or book a worker.', 'No automatic contact.', 'Browse any time', null, null, 'active', 'demonstration', current_date, true)
on conflict (slug) do nothing;

insert into public.service_settings (response_hours, consent_version)
select 'Monday–Friday, 9am–6pm Australia/Melbourne', 'pilot-2026-07'
where not exists (select 1 from public.service_settings);
