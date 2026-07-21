# Data model

The canonical schema is `supabase/migrations/0001_initial.sql`.

## Identity and roles

`profiles` extends Supabase Auth and holds a server-controlled role. `youth_workers` stores public worker information and administrative qualification status. Role helper functions support RLS without trusting browser state.

## Scheduling

`availability_rules` stores weekly availability. `availability_exceptions` records leave and additional hours. `appointments` stores minimal booking data. A GiST exclusion constraint prevents overlapping requested or confirmed appointments for one worker.

Guest management tokens are hashed. Guest actions are server-only and never rely on browser-side RLS claims.

## Messages

`appointment_messages` belongs to one appointment. RLS permits only the assigned participant and worker. Production must enforce configured open and read-only times in server code.

## Useful options

`resources` includes status, source type and verification date. Public RLS exposes active rows only. `partners` is separate so demonstration and real referral relationships remain explicit.

## Referrals

`referrals` records participant, appointment, worker, partner, approved fields, approved summary and timestamped status. It deliberately excludes unrestricted worker notes.

## Pathways and saved items

`guided_pathway_sessions`, `guided_pathway_results` and `saved_resources` support anonymous progress and signed-in saving without sensitive free text.

## Analytics and audit

`analytics_events` contains allowlisted event fields. Public and sponsor reporting must query aggregate functions or protected server endpoints. `audit_events` records administrative actions, not participant narratives.

## RLS boundaries

- Participants: own appointments, messages, saved items and referrals
- Workers: appointments/messages/referrals assigned to them and their availability
- Admins: operational records through protected administration
- Public: active workers, locations, resources, partners and service settings
- Sponsors: no database role and no participant-level access; aggregate reports only
- Service role: server-only
