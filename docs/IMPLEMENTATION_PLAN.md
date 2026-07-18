# Implementation Plan

This plan delivers the Healthcare Scheduler Portal MVP **incrementally**, through small,
independently reviewable feature branches. **No phase is implemented in a single branch**,
and no feature is implemented directly on `main`.

Legend: ⬜ not started · 🟨 in progress · ✅ merged

---

## Delivery model

```
feature branch → local checks → commit → (authorised) push → PR → CI → review
→ (authorised) merge to main → staging → smoke tests → (authorised) production
```

`main` must remain **stable, buildable, tested, and free of known critical
tenant-isolation failures** after every merge. See
[`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md) and
[`PULL_REQUEST_PROCESS.md`](PULL_REQUEST_PROCESS.md).

Suggested semantic-version milestones:

| Version | Milestone |
| --- | --- |
| v0.1.0 | Application & tenancy foundation |
| v0.2.0 | Workforce management |
| v0.3.0 | Roster management |
| v0.4.0 | Employee self-service |
| v0.5.0 | Swaps & bank shifts |
| v0.6.0 | Reporting & hardening |

---

## Phase 1 — Foundation

| Branch | Scope | Status |
| --- | --- | --- |
| `chore/initial-project-foundation` | Next.js + TS strict + Tailwind + shadcn primitives, env validation (Zod), app shell, health check, Vitest + first unit test, ESLint/Prettier, core docs | 🟨 |
| `feature/application-shell` | Responsive shell, desktop sidebar, mobile bottom nav, theming tokens | ✅ |
| `feature/supabase-authentication` | Supabase Auth: sign-in / sign-up / reset / verify, session handling, route protection. *(Add: forced password change on first login — see bank-staff ref §3.1.)* | 🟨 |
| `ci/initial-quality-pipeline` | GitHub Actions: format, lint, typecheck, unit, build (expanded once Supabase lands) | ⬜ |

## Phase 2 — Multi-tenancy & security

| Branch | Scope | Status |
| --- | --- | --- |
| `feature/tenant-data-model` | `tenants`, `tenant_settings`, `profiles` tables + migrations | 🟨 |
| `feature/tenant-memberships` | Memberships, `role_definitions`, `permission_definitions`, `role_permissions` | 🟨 |
| `feature/workspace-switcher` | Membership-verified tenant switcher & `/workspaces` | ✅ |
| `feature/department-access` | Departments, `department_memberships`, department-scoped access | 🟨 |
| `security/tenant-rls-policies` | RLS + helper functions on all tenant-owned tables | 🟨 |
| `test/tenant-isolation-suite` | Automated cross-tenant / cross-department isolation tests | 🟨 |
| `feature/audit-foundation` | Append-only `audit_events` + write API + viewer skeleton | ⬜ |

> **Delivery note — the `feature/tenant-data-model` branch spans three rows above.** A
> meaningful isolation *proof* needs tables **and** memberships **and** helper functions
> **and** policies together, so that branch deliberately delivers migrations `0001–0007`
> (profiles, tenants, RBAC + seed, memberships, `app.*` helpers, RLS policies) plus a first
> pgTAP cross-tenant isolation test (8/8 passing locally). What remains for each row:
>
> - `feature/tenant-memberships` — schema + seed done; **membership management UI/services** not built.
> - `feature/department-access` (🟨) — migrations `0008–0009` deliver `departments`,
>   `department_memberships`, the `app.is_department_member` helper (unrestricted when a member
>   has no department links), and department-scoped RLS. **Department management UI is not
>   built** (arrives with Phase 3 `feature/department-management`).
> - `security/tenant-rls-policies` — policies now cover tenants, memberships, **and
>   departments**; the hardening pass must still re-run over `audit_events` and every later
>   tenant-owned table (nothing may ship without RLS).
> - `test/tenant-isolation-suite` — the pgTAP suite now covers **cross-tenant and
>   department-scoping** cases (14/14) and **runs in CI** on every PR. Cross-department cases
>   for future tables are added as those tables land.
>
> Local Supabase ports are remapped to `553xx` (the `5432x` defaults collide with a Windows
> reserved range). See [`DATA_MODEL.md`](DATA_MODEL.md).

## Phase 3 — Organisation & workforce

`feature/tenant-onboarding` · `feature/facility-management` ·
`feature/department-management` · `feature/employee-directory` ·
`feature/employee-contracts` · `feature/employee-skills` ·
`feature/employee-availability`

## Phase 4 — Rostering

`feature/shift-type-management` · `feature/staffing-requirements` ·
`feature/roster-periods` · `feature/shift-instances` ·
`feature/booking-patterns` · `feature/shift-assignment` ·
`feature/roster-approval` · `feature/roster-publication` ·
`feature/roster-versioning` · `feature/saved-views`

> Bank-staff additions (from [`BANK_STAFF_GAP_ANALYSIS.md`](BANK_STAFF_GAP_ANALYSIS.md) §4):
> `feature/booking-patterns` (daily/weekly block booking, ref §3.3) and `feature/saved-views`
> (named favourites + column config + per-user default, ref §3.6–3.7). `feature/shift-instances`
> also owns the request lifecycle: `unfilled`/`unconfirmed`/`filled`/`unfillable`/`recalled`
> states, `cancellation_reasons`, and the reopen/recall transitions.

## Phase 5 — Rules engine

`feature/scheduling-rule-foundation` · `feature/hard-constraint-validation` ·
`feature/soft-constraint-warnings` · `feature/employee-suggestions` ·
`feature/rule-overrides`

## Phase 6 — Employee self-service

`feature/mobile-employee-dashboard` · `feature/personal-schedule` ·
`feature/leave-request-workflow` · `feature/availability-self-service` ·
`feature/employee-notifications`

## Phase 7 — Swaps & bank shifts

`feature/shift-swap-request` · `feature/shift-swap-approval` ·
`feature/bank-shift-publication` · `feature/bank-shift-eligibility` ·
`feature/atomic-bank-booking` · `feature/multi-shift-booking` ·
`feature/bank-shift-waitlist`

> `feature/multi-shift-booking` (from [`BANK_STAFF_GAP_ANALYSIS.md`](BANK_STAFF_GAP_ANALYSIS.md)
> §4): book one worker into several selected requests atomically (ref §3.5). Agency **cascade**
> is **post-MVP** — the MVP records agency fills manually (`agency_filled` status); see gap
> analysis §6 #1.

## Phase 8 — Reporting & hardening

`feature/operational-reports` · `feature/csv-exports` ·
`security/application-hardening` · `test/accessibility-suite` ·
`test/end-to-end-regression` · `infrastructure/vercel-deployment-preparation` ·
`docs/production-readiness`

---

## Excluded from the MVP (roadmap only)

Payroll & HSE integrations, patient/diagnosis data, fully-automatic roster generation,
complex billing, SMS, native mobile apps, demand forecasting, agency marketplaces,
biometric clock-in, formal certification, per-tenant databases, and a full report
builder. Extension points are documented in [`FUTURE_ROADMAP.md`](FUTURE_ROADMAP.md).

## Current status

- ✅ Repo initialised; `main` baseline (README, LICENSE, .gitignore, this plan).
- ✅ `chore/initial-project-foundation` — merged (Next.js foundation, tooling, docs).
- ✅ `feature/application-shell` — merged (responsive shell, nav, theming).
- ✅ `feature/supabase-authentication` — merged (PR #4). Auth flows, session, route
  protection. **Two flows remain unverified** (password recovery → update, unconfirmed-email
  sign-in) — blocked by the Supabase built-in email rate limit; see
  [`implementation-status.md`](implementation-status.md).
- ✅ `ci/initial-quality-pipeline` — merged (PR #3). GitHub Actions runs format, lint,
  typecheck, unit tests, and build on push to `main` and every PR.
- 🟨 **Phase 2 started** — `feature/tenant-data-model` delivers the tenancy/RBAC/RLS core with
  a passing cross-tenant isolation test (see the Phase 2 delivery note above).
