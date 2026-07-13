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

> Full setup instructions live in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Once the
> foundation branch is merged:

```bash
npm install
cp .env.example .env.local   # fill in local Supabase values
npm run dev
```

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

## Licence

[MIT](LICENSE). Uses only synthetic data — no real personal information is included.
