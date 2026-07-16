# Bank-Staff Gap Analysis

Compares the bank-staff workflows in
[`BANK_STAFF_DOMAIN_REFERENCE.md`](BANK_STAFF_DOMAIN_REFERENCE.md) (and the backlog in
[`BANK_STAFF_BACKLOG.md`](BANK_STAFF_BACKLOG.md)) against **what the scaffold supports today**
and **where the roadmap already accounts for it**
([`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md),
[`implementation-status.md`](implementation-status.md)).

**Snapshot date:** 2026-07-16 · **Branch:** `feature/supabase-authentication`

---

## 1. What the scaffold provides today

Grounded in the actual tree (`src/`), not the plan:

| Capability | State | Evidence |
| --- | --- | --- |
| Next.js App Router + strict TS + Tailwind | ✅ | `package.json`, `src/app` |
| Responsive app shell (sidebar + mobile nav) | ✅ merged | `src/components/shell/*` |
| Nav destinations: Dashboard, Roster, People, Settings | ✅ (stubs) | `src/components/shell/nav-items.ts` |
| Supabase auth (sign-in/up/reset/verify), route protection | 🟨 in progress | `src/lib/auth/*`, `src/middleware.ts` |
| Env validation, theming, status-badge primitive | ✅ | `src/lib/env`, `src/lib/theme`, `src/components/ui/status-badge.tsx` |
| Operational status vocabulary (label+icon+colour) | ✅ | `src/lib/status/operational-status.ts` |
| **Tenant data model / RLS** | ❌ not started | Phase 2; "no tenant-owned tables" yet |
| **Any domain tables (workers, shifts, bookings)** | ❌ none exist | no `src/features/*`, no migrations |
| **Roster / booking UI** | ❌ placeholder page only | `src/app/(app)/roster/page.tsx` is a stub |
| **People / directory UI** | ❌ placeholder page only | `src/app/(app)/people/page.tsx` is a stub |

**Bottom line:** the foundation (auth, shell, status vocabulary, timezone-aware utilities) is
real and directly reusable. **No bank-staff domain capability exists yet** — there are no
tenant tables, no workers, no shifts, no bookings. Every workflow in the reference is
greenfield.

## 2. Workflow-by-workflow gap table

Legend: **Have** ✅ · **Planned** 🗓️ (roadmap branch exists) · **Gap** ❌ (not in scaffold *or*
needs new scope).

| Ref § | Workflow | Backlog | Roadmap branch | Today | Gap / notes |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Login, forced password change | — | `feature/supabase-authentication` | 🟨 | Auth exists; **forced first-login password change is not implemented** — new requirement. |
| 3.2 | Add shift request → booking list | A1–A2 | `feature/shift-instances` | ❌ | Needs `shift_requests` table + create form + list. |
| 3.3 | Block booking (daily/weekly) | B1 | *(none)* | ❌ | **No roadmap branch** — add `feature/booking-patterns`. |
| 3.4 | Assign at creation (3-char search) | C1 | `feature/shift-assignment` | ❌ | Needs worker directory + typeahead + eligibility. |
| 3.5 | Direct booking from list | C2 | `feature/atomic-bank-booking` | ❌ | Needs bookings + atomicity. |
| 3.5 | Multi-shift booking | D1 | *(none)* | ❌ | **No roadmap branch** — add to bank-shift phase. |
| 3.6 | Filters + default 7-day view | E1 | `feature/roster-*` | ❌ | Needs list + filter state in URL. |
| 3.6 | Column configuration | E2 | *(none)* | ❌ | New; persist per user. |
| 3.7 | Favourites (named, default) | E3 | *(none)* | ❌ | **No roadmap branch** — add `feature/saved-views`. |
| 3.8 | View filled shifts | F1 | `feature/roster-publication` | ❌ | Status vocabulary ✅, but no data. |
| 3.8 | Cancel / Unit Refuse (reopen) | F2 | `feature/shift-swap-*` adjacent | ❌ | Needs `cancellation_reasons` + reopen transition. |
| 3.8 | Cancel + Recall (no reopen) | F3 | *(none)* | ❌ | Part of request lifecycle; fold into `feature/shift-instances`. |
| 3.9 | Recall unfilled request | A3 | *(none)* | ❌ | Same lifecycle work. |
| 3.10 | Agency cascade (framework order) | G1 | *(post-MVP)* | ❌ | **Decided:** auto-cascade engine deferred post-MVP (§6 decision #1). MVP models `agency_filled` status + manual agency-fill recording only. |
| 3.11 | Timesheets sign-off | H1 | `feature/operational-reports` era | ❌ | Phase 8; tenant-configurable; **no payroll** (excluded). |
| 3.12 | Reports / exports | I1 | `feature/operational-reports`, `feature/csv-exports` | 🗓️ | Planned Phase 8. |
| 3.13 | Bank staff directory | J1 | `feature/employee-directory` | ❌ | Maps to Phase 3 directory; "People" nav stub is the landing spot. |
| 3.14 | Messaging to staff | K1 | *(excluded)* | ❌ | MVP-excluded (SMS out); in-app/email via `src/lib/notifications` later. |

## 3. Terminology reconciliation

The external/source-domain vocabulary and our roadmap vocabulary describe the same things with
different names. Adopt **our** names in code; keep this crosswalk for domain conversations.

| Source-domain term | Our model / roadmap term |
| --- | --- |
| Shift Request / Request ID | `shift_requests` (a `shift_instance` opened for filling) |
| Direct Booking / Book Staff | `bookings` / `feature/atomic-bank-booking` |
| Bank / Overtime staff | `bank_workers` (`worker_type`) / employee directory |
| Block Booking / Pattern | `booking_patterns` (new) |
| Favourite (view) | `saved_views` (new) |
| Unit Refuse Booking | cancel booking → request `unfilled` (reopen) |
| Recall | request → `recalled` (no reopen) |
| Transfer to Agency / cascade | `agency_filled` status (MVP, manual) · `agency_cascades` + `agency_frameworks` (post-MVP) |
| Timesheet | `timesheets` (Phase 8) |

## 4. Gaps the roadmap does *not* yet cover

Net-new items surfaced by the reference that have **no** existing branch — candidates to add
to [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md):

1. **`feature/booking-patterns`** — daily/weekly block booking with previewed expansion (§3.3).
2. **`feature/saved-views`** — named favourites, per-user default, column config (§3.6–3.7).
3. **`feature/multi-shift-booking`** — one worker → many requests atomically (§3.5).
4. **Forced first-login password change** — small add to the auth epic (§3.1).
5. **Agency-transfer scope** — *resolved* (§6 decision #1): auto-cascade deferred post-MVP;
   MVP models `agency_filled` + manual recording only. No blocking decision remains.
6. **`cancellation_reasons` lookup + reopen/recall transitions** — cross-cutting, needed by
   F2/F3/A3; fold into the shift-instance lifecycle branch.

## 5. Recommended sequencing

Bank-staff features are **downstream of tenancy** — none can land safely before Phase 2 (RLS)
because they are all tenant-owned data. Suggested order once Phase 2 exists:

```
Phase 3: employee-directory (→ bank_workers)  ┐ prerequisites
Phase 4: shift-types, shift-instances         ┘  (data + lifecycle: unfilled/recall/cancel)
Phase 4: shift-assignment (assign-at-creation, C1)
Phase 7: atomic-bank-booking (C2, C3) → multi-shift-booking (D1)
Phase 4/8: roster views + saved-views + column config (E1–E3)
Phase 8: timesheets, reports/exports
Post-MVP: agency-cascade engine (MVP: manual agency-fill recording only)
Excluded: messaging/SMS
```

## 6. Risks & decisions to resolve

| # | Decision / risk | Owner | Status | Why it matters |
| --- | --- | --- | --- | --- |
| 1 | Is agency cascade in the MVP? | Product | **Decided (plan-consistent default)** — see below | Marketplace is excluded; keep the door open without building the engine. |
| 2 | Verify shift status codes & remaining source pages | — | **Resolved** — see below | Enum was built on a guess; now built on the source. |
| 3 | Reuse `operational-status.ts` for presentation vs. lifecycle enum | Eng | Open | Keep lifecycle (`request_status`) separate from presentation; map, don't overload (backlog §3.3). |
| 4 | Overlap prevention: DB exclusion constraint vs. app-level check | Eng | Open | Invariant #4 (backlog §3.4); affects data integrity under concurrency. |
| 5 | Bank worker identity: link to `profiles`/auth or standalone records | Eng | Open | Not every bank worker is a portal login; `bank_workers.profile_id` is nullable for this reason. |
| 6 | Rename/generalise the vendor-named reference doc | Product/Eng | **Resolved (2026-07-16)** | Renamed to `BANK_STAFF_DOMAIN_REFERENCE.md`, generalised the status model to vendor-neutral states/flags, removed the vendor colour transcription, and added an independence banner. All cross-links updated. |

**Decision #1 — Agency cascade (plan-consistent default).** Because `IMPLEMENTATION_PLAN.md`
explicitly excludes agency *marketplaces* from the MVP, the automated framework-ordered
**cascade engine is deferred to post-MVP**. However, an agency-filled shift is a real domain
status, so the MVP **does** model agency as a first-class `fill_source` and
`agency_filled` status, and allows a manager to **record** an agency fill manually. This keeps
the data model forward-compatible with a future cascade engine without building excluded
functionality now. `agency_frameworks` / `agency_framework_steps` / `agency_cascades` tables
are **post-MVP**; only a minimal `agencies` reference table is needed for manual recording.
*Revisit if Product wants automated cascade in scope.*

**Decision #2 — Status codes (resolved 2026-07-16).** The full status model was recovered from
the source and captured, vendor-neutrally, in
[`BANK_STAFF_DOMAIN_REFERENCE.md`](BANK_STAFF_DOMAIN_REFERENCE.md) §2.1; the enum in
`BANK_STAFF_BACKLOG.md` §3.3 was rebuilt to match (base `request_status` +
`has_notes`/`ward_uninformed`/`is_recently_added` flags, `unconfirmed`/`unfillable`/
`agency_filled` states, and two timesheet stages). No open action remains.

---

_Gap analysis produced 2026-07-16. Reflects the scaffold at commit on
`feature/supabase-authentication`; re-run after Phase 2 (tenancy) lands._
