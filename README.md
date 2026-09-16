# Healthcare Scheduler Portal

> A secure, multi-tenant healthcare **workforce scheduling** platform. Independently
> designed for the Ireland / EU market.

Separate hospitals, clinics, care organisations, healthcare groups, and authorised
independent departments create and manage their own staff schedules inside fully
isolated workspaces, without affecting any other tenant.

---

## ⚠️ Status & scope disclaimer

This is an **early-stage MVP built with synthetic demonstration data only**. It is
**not**, and does not claim to be:

- GDPR-certified
- HSE-approved
- Clinically certified or clinically risk-assessed
- ISO-certified
- Production-ready for real healthcare or personal data
- A replacement for independent security, legal, clinical, or data-protection review

See [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) for the full gap
analysis before any real-data use is considered.

This product is **independently designed**. It does not copy the source code, branding,
screen layouts, wording, proprietary workflows, or internal architecture of Allocate,
HealthRoster, RLDatix, or any other proprietary product.

---

## Design principles

- **Security by design** — server-side authorisation on every mutation; RLS at the DB layer.
- **Privacy by design** — data minimisation; no medical-diagnosis fields; synthetic data only.
- **Accessibility by design** — WCAG 2.2 AA target; keyboard alternatives for every interaction.
- **Tenant isolation by design** — PostgreSQL Row Level Security, not just frontend filtering.
- **Explainable scheduling** — deterministic rules engine; no opaque AI assignment.
- **Auditability** — append-only audit events for all sensitive actions.

## Technology

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · shadcn-style UI ·
Supabase (Postgres, Auth, Storage, Realtime) · Zod · React Hook Form · date-fns ·
Vitest · Playwright · GitHub Actions.

## Getting started

The app talks to Supabase over env vars, so it runs against **either** a hosted project or a
local stack. **Hosted is the default dev workflow** — no Docker needed. Database isolation
(RLS) tests run in **CI** on every PR (see below), so you don't need to run them locally.

### Recommended: hosted for dev

```bash
npm install
cp .env.example .env.local   # fill in your HOSTED Supabase project values
npm run dev
```

Point `.env.local` at your hosted project (URL + anon key from Supabase → Project Settings →
API; service-role key for server-only use). Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`
for local dev. Full hosted setup — migrations, Vercel, auth URLs — is in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### Optional: local Supabase stack (needs Docker)

Only for offline work or a fast, disposable, pre-seeded DB. Requires Docker Desktop.

```bash
supabase start                 # boots Postgres + Auth + PostgREST in Docker
supabase db reset              # applies migrations + seed (demo login: demo@local.test / DemoPass123!)
# Point the dev server at it WITHOUT touching .env.local:
#   create .env.development.local with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321 (+ local keys)
#   (that file is gitignored and overrides .env.local in `next dev`; delete it to return to hosted)
npm run dev
```

> On Windows, Supabase's default ports collide with a reserved range — this repo remaps them to
> `553xx` in `supabase/config.toml`, and the storage container's health check is flaky
> (`supabase start -x storage-api` to skip it).

### Tests

```bash
npm run test        # unit tests (Vitest) — no DB needed
npm run build       # production build
supabase test db    # RLS isolation suite (pgTAP) — needs the local stack (Docker)
```

The **RLS isolation suite runs in CI** (`.github/workflows/ci.yml` → *RLS isolation test*) on
every pull request, in a clean container. That is the verification of record for tenant
isolation, so running it locally is optional.

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Phased, branch-by-branch delivery roadmap |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System & module architecture |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Entities, relationships, constraints |
| [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) | AuthN/AuthZ, RLS, tenant isolation |
| [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) | Threats, mitigations, assumptions |
| [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md) | Test pyramid & isolation suite |
| [`docs/BRANCHING_STRATEGY.md`](docs/BRANCHING_STRATEGY.md) | Git workflow & branch naming |
| [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) | What is / isn't ready |
| [`docs/BANK_STAFF_DOMAIN_REFERENCE.md`](docs/BANK_STAFF_DOMAIN_REFERENCE.md) | Domain reference: bank-staff shift-filling workflows |
| [`docs/BANK_STAFF_BACKLOG.md`](docs/BANK_STAFF_BACKLOG.md) | Bank-staff user stories & data model |
| [`docs/BANK_STAFF_GAP_ANALYSIS.md`](docs/BANK_STAFF_GAP_ANALYSIS.md) | Bank-staff workflows vs. current scaffold |

## Licence

[MIT](LICENSE). Uses only synthetic data — no real personal information is included.
