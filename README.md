# first_step

first_step is an Australian pilot platform that makes the first practical step easier for young people aged 16–25 facing housing instability, homelessness risk or barriers to financial stability.

It sits before existing services. It helps someone choose a direction, understand what will happen, book a qualified youth worker and consent to a warm referral. It does not replace housing services, youth workers, TAFE, social enterprises or specialist support.

> A technically working booking system does not make an organisation ready to deliver youth-work services. Production launch requires qualified governance, safeguarding, legal, privacy, under-18 consent, retention and crisis-escalation review.

## Product principles

- Dignity without disclosure
- All work is paid work
- Practicality over performance
- Partnership over ego
- Small enough to test
- Human support, not fake automation

## What is built

- Public service site with guided pathway, urgent-support bypass, resources, about, partner, impact and merch pages
- Six-step guest appointment booking with generated availability, buffer handling, confirmation, ICS export and demo email preview
- Participant account for appointments, cancellation, rescheduling, saved steps and referral consent
- Worker dashboard for availability, appointments, broad outcomes and referrals
- Admin dashboard for resources, workers, locations, service settings and aggregate pilot measures
- Demo repository using device-local storage behind the same repository interface used by production adapters
- Supabase Postgres migration, exclusion constraint preventing overlapping worker bookings, seed data and row-level security
- Supabase magic-link client, server-only service-role client and Resend-compatible email adapter
- Privacy-conscious first-party analytics validation and redaction
- Vitest domain tests and Playwright end-to-end/accessibility tests

## Architecture

The application uses the Next.js App Router with TypeScript strict mode. A root optional catch-all route renders the coherent service shell while preserving every requested URL. Interactive demo state lives behind `FirstStepRepository`; production writes belong in server actions/route handlers using Supabase and the same domain types.

```text
app/                    App Router pages, API routes, global design system
components/             Product UI and flows
lib/                    Domain logic, demo repository, validation, email, analytics
lib/supabase/           Browser and server Supabase clients
public/brand/           Preserved supplied brand artwork
public/images/          Supplied service photography
supabase/migrations/    Postgres schema, constraints and RLS
supabase/seed.sql       Demonstration seed content
tests/unit/             Vitest domain and privacy tests
tests/e2e/              Playwright journeys and axe checks
docs/                   Product, safeguarding, data and launch decisions
```

The workspace includes a Sites-compatible Vinext build for portable preview hosting. The code remains standard App Router code. For the intended Vercel target, use the documented Next build command after production Supabase configuration.

## Local setup

Requirements: Node.js 22.13+ and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Demo mode

Demo mode requires no external credentials. Keep:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Open `/demo` to switch between seeded personas:

- Participant: Jamie, 19 — exploring stable work and TAFE
- Youth worker: Maya — housing, work and study conversations
- Administrator: first_step pilot administrator

Demo records stay in browser `localStorage`. Do not enter real sensitive data. Role switching is never rendered in production mode.

Useful routes:

- `/start` guided pathway
- `/pathways/safe-tonight` immediate external support
- `/book` booking flow
- `/resources` useful options
- `/account`, `/worker`, `/admin` role views

## Environment variables

See `.env.example`.

- `NEXT_PUBLIC_DEMO_MODE`: `true` for device-local demo; `false` for production adapters
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: server only; never expose to browser bundles
- `RESEND_API_KEY`: server-only email delivery key
- `EMAIL_FROM`: verified sender
- `NEXT_PUBLIC_APP_URL`: canonical app URL
- `NEXT_PUBLIC_SERVICE_STATUS`: `open`, `closed` or `limited`
- `NEXT_PUBLIC_QUICK_EXIT_URL`: neutral quick-exit destination

## Supabase setup

1. Create a Supabase project in the Australian region selected by governance review.
2. Apply `supabase/migrations/0001_initial.sql` with the Supabase CLI or SQL editor.
3. Apply `supabase/seed.sql` only to a non-production or clearly labelled pilot environment.
4. Enable email magic-link authentication and add the deployed `/account` redirect URL.
5. Add environment variables to Vercel.
6. Create worker/admin users as normal authenticated users, then promote their `profiles.role` through a protected administrative process. Never expose role choice publicly.
7. Insert `youth_workers` records linked to approved worker profiles.

Generate TypeScript database types after schema changes:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

Guest management tokens must be generated with cryptographic randomness, stored only as hashes, and validated in server-only code. RLS intentionally does not accept raw guest tokens.

## Resend setup

Verify the sender domain, set `RESEND_API_KEY` and `EMAIL_FROM`, and call `createEmailDelivery()` only from server code. When credentials are absent, `DemoEmailDelivery` returns preview content and does not send.

## Tests and quality checks

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Playwright uses installed Google Chrome and runs mobile plus 1440px desktop projects. Axe checks target key pages. `npm run test:all` runs the full sequence.

## Deployment

### Vercel + Supabase (intended production target)

1. Connect the repository to Vercel.
2. Configure the environment variables above.
3. Use the standard Next.js build (`next build`) after the production adapter is enabled.
4. Add the Vercel URL to Supabase authentication redirect allowlists.
5. Verify email, quick exit, time zone, booking overlap and RLS in a staging project.
6. Run the production-readiness checklist before enabling real bookings.

The included Sites/Vinext build is suitable for a demonstration deployment. It is not the authority for production data handling.

## Known limitations

- The UI is a working demonstration; real service delivery, authenticated writes and server-validated guest management endpoints must be connected before launch.
- Demo cancellation/rescheduling uses local storage. Production must verify a magic link or management token server-side.
- Video links are never generated publicly; production staff add a private meeting URL later.
- Scheduled text-chat UI and schema are present, but production needs a real-time delivery channel, open/close enforcement and moderation procedures.
- Demonstration partner content is not a claim of partnership.
- Some supplied photography is high resolution; production should generate responsive derivatives and confirm licences/consent.
- Merchandise records interest only. Stripe is intentionally not configured.
- Generated privacy and terms copy is not legal advice.

## Mandatory production reviews

- Qualified youth-work governance review
- Privacy impact assessment
- Safeguarding and worker screening review
- Australian legal review
- Under-18 consent review
- Records-retention and deletion review
- Crisis-escalation and after-hours review
- Resource verification ownership and cadence
- Referral partner agreements and secure delivery
- Accessibility audit with young people using assistive technology
- Security review, penetration test and incident-response exercise

See [production checklist](docs/production-checklist.md) and [safeguarding assumptions](docs/safeguarding-assumptions.md).
