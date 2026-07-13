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
| `feature/application-shell` | Responsive shell, desktop sidebar, mobile bottom nav, theming tokens | 🟨 |
| `feature/supabase-authentication` | Supabase Auth: sign-in / sign-up / reset / verify, session handling, route protection | ⬜ |
| `ci/initial-quality-pipeline` | GitHub Actions: format, lint, typecheck, unit, build (expanded once Supabase lands) | ⬜ |

## Phase 2 — Multi-tenancy & security

| Branch | Scope | Status |
| --- | --- | --- |
| `feature/tenant-data-model` | `tenants`, `tenant_settings`, `profiles` tables + migrations | ⬜ |
| `feature/tenant-memberships` | Memberships, `role_definitions`, `permission_definitions`, `role_permissions` | ⬜ |
| `feature/workspace-switcher` | Membership-verified tenant switcher & `/workspaces` | ⬜ |
| `feature/department-access` | Departments, `department_memberships`, department-scoped access | ⬜ |
| `security/tenant-rls-policies` | RLS + helper functions on all tenant-owned tables | ⬜ |
| `test/tenant-isolation-suite` | Automated cross-tenant / cross-department isolation tests | ⬜ |
| `feature/audit-foundation` | Append-only `audit_events` + write API + viewer skeleton | ⬜ |

## Phase 3 — Organisation & workforce

`feature/tenant-onboarding` · `feature/facility-management` ·
`feature/department-management` · `feature/employee-directory` ·
`feature/employee-contracts` · `feature/employee-skills` ·
`feature/employee-availability`

## Phase 4 — Rostering

`feature/shift-type-management` · `feature/staffing-requirements` ·
`feature/roster-periods` · `feature/shift-instances` ·
`feature/shift-assignment` · `feature/roster-approval` ·
`feature/roster-publication` · `feature/roster-versioning`

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
`feature/atomic-bank-booking` · `feature/bank-shift-waitlist`

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
- 🟨 `chore/initial-project-foundation` — in progress (first vertical slice).
