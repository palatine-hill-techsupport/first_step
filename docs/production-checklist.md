# Production-readiness checklist

## Governance and service delivery

- [ ] Accountable youth-work governance body approves service model
- [ ] Worker qualifications, screening, supervision and escalation protocols approved
- [ ] Service hours, capacity and after-hours language match real operations
- [ ] Under-18 consent and capacity model approved
- [ ] Mandatory-reporting and immediate-danger procedures rehearsed
- [ ] Worker and participant safety procedures approved for every location and format

## Privacy and legal

- [ ] Privacy impact assessment completed
- [ ] Final collection notices, privacy policy, consent and terms receive Australian legal review
- [ ] Retention, deletion, access and correction procedures implemented and tested
- [ ] Sponsor contracts expressly prohibit participant-level access and influence
- [ ] Partner data-sharing agreements and withdrawal handling approved
- [ ] Photography, font, logo and demonstration-content rights confirmed

## Product and accessibility

- [ ] Co-design/usability testing completed with young people from the intended cohort
- [ ] Independent WCAG 2.2 AA audit completed
- [ ] Keyboard, screen-reader, zoom, reduced-motion, low-bandwidth and 320px testing completed
- [ ] Quick exit and safe-contact choices reviewed by family-violence specialists
- [ ] No dead controls, fake immediacy or unlabelled demonstration data

## Security and data

- [ ] Separate Supabase staging and production projects
- [ ] RLS tests cover every table and role
- [ ] Service-role key exists only in server runtime
- [ ] Guest tokens are random, hashed, expiring and rate-limited
- [ ] Appointment writes use a transaction and handle exclusion-constraint conflicts
- [ ] Message open/close periods are enforced server-side
- [ ] Audit logs, backups, recovery, monitoring and incident response tested
- [ ] Penetration test and dependency/security review completed

## Communications and operations

- [ ] Resend domain verified and safe-contact suppression tested
- [ ] Cancellation, reschedule, reminder and referral templates approved
- [ ] Resource verification owner and review cadence assigned
- [ ] Crisis details rechecked immediately before launch
- [ ] Video provider, meeting-link distribution and no-show process approved
- [ ] Referral failure and unable-to-contact handling approved

## Launch gate

- [ ] Vercel and Supabase Australian-region configuration reviewed
- [ ] Production analytics contain no sensitive free text or contact details
- [ ] Sponsor/public impact endpoints return aggregates only
- [ ] Real-world pilot capacity is small, explicit and supportable
- [ ] Named accountable person signs off go-live

Passing automated tests is necessary but not sufficient. A working booking platform does not make the organisation operationally ready to deliver youth-work services.
