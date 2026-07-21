# Product decisions

## Start with direction, not disclosure

The first interaction asks what would make today easier. Urgent housing selections bypass the remaining pathway. Non-urgent paths ask only preference questions and keep free text out of analytics.

## Separate verified details from pilot content

Every resource has a `source_type` and `last_verified_at`. Crisis details are labelled external and checked; project guides are labelled demonstration; uncontracted organisations are described as future partners. Admin receives a stale-content warning.

## Booking is low pressure

Guests can book without creating an account. The form collects a chosen name, age band, broad topics, safe-contact choices and optional communication needs. It does not ask for date of birth, legal name, address, proof or trauma history.

## Availability is deterministic

Recurring rules, exceptions, appointment duration, buffer, minimum notice, booking window and existing bookings generate slots. Postgres adds an exclusion constraint so concurrent requests cannot overlap an active worker booking.

## Warm referral requires a visible consent moment

The participant sees the partner, purpose, fields and approved summary. Booking consent is not reused as referral consent. Sponsors have no referral access.

## Demo roles stay out of production navigation

`/demo` is the sole role-switch surface. Production roles derive from authenticated profiles and are enforced server-side.

## Merchandise stays secondary

Drop 001 is visually strong but has no fake checkout. The form records interest only and explains sponsor placement transparently.

## Analytics measure the bridge

Events cover pathway completion, bookings, attendance and referral progress. The analytics validator is allowlisted, strict and redacts identifier-like keys. Dashboards show aggregates, never private timelines.
