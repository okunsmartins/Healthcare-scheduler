# Architecture

## Overview

The Healthcare Scheduler Portal is a **modular monolith** deployed as a single Next.js
(App Router) application backed by Supabase (PostgreSQL, Auth, Storage, Realtime). This
keeps operational complexity low for the MVP while preserving clean internal seams that
could later be extracted into services (e.g. a scheduling-optimisation worker).

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (React Server + Client Components)                    │
│   - Employee experience (mobile-first)                         │
│   - Manager/admin experience (desktop-first, responsive)       │
└───────────────▲───────────────────────────┬───────────────────┘
                │ HTML / RSC payloads         │ mutations (Server Actions / Route Handlers)
┌───────────────┴───────────────────────────▼───────────────────┐
│  Next.js server (App Router)                                    │
│   src/app          routes & server actions                     │
│   src/features/*   feature modules (UI + application services)  │
│   src/lib/*        cross-cutting: env, auth, tenancy, audit,    │
│                    rules, notifications, data access            │
└───────────────▲───────────────────────────┬───────────────────┘
                │ anon/authed client (RLS)    │ service-role (server-only, trusted)
┌───────────────┴───────────────────────────▼───────────────────┐
│  Supabase / PostgreSQL                                          │
│   - Row Level Security on every tenant-owned table              │
│   - SECURITY DEFINER helper functions (membership/permission)   │
│   - Append-only audit_events                                    │
│   - Auth, Storage (isolated buckets), Realtime                  │
└────────────────────────────────────────────────────────────────┘
```

## Layering

The codebase separates concerns explicitly. Business rules never live only in UI
components, and data access is never scattered ad hoc through components.

| Layer | Location | Responsibility |
| --- | --- | --- |
| UI | `src/app`, `src/features/*/components` | Rendering, interaction, accessibility |
| Application services | `src/features/*/services` | Use-case orchestration, transactions |
| Domain rules | `src/lib/rules`, `src/lib/status`, `src/features/*/domain` | Pure, testable business logic |
| Data access | `src/lib/supabase`, `src/features/*/data` | Typed queries; RLS-aware clients |
| Authorisation | `src/lib/auth`, `src/lib/tenancy` | Centralised permission & tenant-context resolution |
| Validation | `src/lib/validation`, Zod schemas per feature | Input validation at every boundary |
| Notifications | `src/lib/notifications` | Provider-abstracted delivery |
| Audit | `src/lib/audit` | Append-only event writes |
| Background jobs | `src/lib/jobs` | Queued, retryable work |

## Rendering strategy

- **Server Components by default** — data fetching, authorisation, and most rendering.
- **Client Components only where interactivity requires it**: drag-and-drop rostering,
  calendars, realtime updates, filters, mobile navigation, and interactive forms.
- The Supabase **service-role key is referenced only from server-only modules** and is
  never imported into any client component (enforced by `src/lib/env` split + review).

## Tenant-context resolution

Tenant context is derived from the authenticated user's **active memberships** — never
from a browser-supplied `tenant_id` or from the route slug alone. The slug selects a
candidate tenant; the server then verifies membership before any data is returned. See
[`SECURITY_MODEL.md`](SECURITY_MODEL.md).

## Time & timezone

Absolute instants are stored in UTC; each tenant has an IANA timezone. Display and
duration calculations use timezone-aware utilities (`date-fns` / `date-fns-tz`), never
naive string arithmetic. Overnight shifts and DST transitions are covered by unit tests
(target zone: `Europe/Dublin`).

## Accessibility

WCAG 2.2 AA is the target. Cross-cutting rules baked into the design system:

- Status is communicated by **label + icon + colour**, never colour alone
  (`src/lib/status/operational-status.ts`).
- Every drag-and-drop interaction has a keyboard/menu alternative.
- Visible focus rings, semantic HTML, skip links, and reduced-motion support are global.
- Default touch targets are ≥ 44×44px.

## Extension points (post-MVP)

- **Scheduling optimisation**: an async job produces *suggested* assignments that a
  manager reviews — the request path never runs long CPU work. A future solver (Python /
  OR-Tools in a container) can plug into the job interface without changing the MVP.
- **Email**: `EmailProvider` interface with a console dev provider; Resend can be added
  without touching domain logic.
- **Error reporting**: a Sentry-compatible abstraction; disabled when `SENTRY_DSN` is unset.
