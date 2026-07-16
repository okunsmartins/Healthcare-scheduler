# Bank-Staff Feature Backlog & Data Model

Requirements distilled from [`BANK_STAFF_DOMAIN_REFERENCE.md`](BANK_STAFF_DOMAIN_REFERENCE.md)
and expressed as **user stories** plus a **data model** that layers onto the core roster
model already planned in [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md). It respects the
portal's multi-tenant / RLS / audit conventions in [`ARCHITECTURE.md`](ARCHITECTURE.md).

For where each epic sits against the current build, see
[`BANK_STAFF_GAP_ANALYSIS.md`](BANK_STAFF_GAP_ANALYSIS.md).

**Conventions used below**
- Roles: **Manager** (unit/ward), **Bank Admin**, **Worker** (bank/overtime), **System**.
- Priority: **P0** MVP-critical · **P1** MVP · **P2** post-MVP / roadmap.
- Every story assumes tenant + department scoping and an append-only audit event on mutation
  (per `ARCHITECTURE.md`); it is only restated where it changes acceptance.

---

## 1. Epics overview

| # | Epic | Maps to roadmap phase | Priority |
| --- | --- | --- | --- |
| A | Shift-request management | Phase 4 (rostering) | P0 |
| B | Recurrence / block booking | Phase 4 | P1 |
| C | Staff assignment & direct booking | Phase 4 / 7 | P0 |
| D | Multi-shift booking | Phase 7 | P1 |
| E | Views, filters & favourites | Phase 4 / 8 | P1 |
| F | Booking lifecycle (view, cancel, refuse, recall) | Phase 4 / 7 | P0 |
| G | Agency fill (manual MVP; cascade post-MVP) | Phase 7 / post-MVP | P2 |
| H | Timesheets | Phase 8 | P2 |
| I | Reports & exports | Phase 8 | P2 |
| J | Bank staff directory | Phase 3 | P1 |
| K | Messaging | Post-MVP (excluded) | P2 |

---

## 2. User stories

### Epic A — Shift-request management (P0)

- **A1** — *As a Manager, I want to raise a shift request for a date, time window, department
  and required grade, so that an unfilled shift enters the booking queue.*
  - **AC:** required fields validated (date, start, end, department, grade/skill); on save the
    request appears in the booking list as `unfilled`; overnight windows (end < start) are
    handled in the tenant timezone; an audit event records the creator.
- **A2** — *As a Manager, I want new requests to show in a single "booking status" list, so
  that I can see everything outstanding.*
  - **AC:** list defaults to this department's open shifts; each row shows a stable
    human-readable **Request ID**, status badge (label + icon + colour), date/time, grade.
- **A3** — *As a Manager, I want to recall an unfilled request, so that a shift no longer
  needed is withdrawn.*
  - **AC:** only `unfilled` requests are recallable; status → `recalled`; recorded with actor
    + timestamp; recalled requests leave the open queue.

### Epic B — Recurrence / block booking (P1)

- **B1** — *As a Manager, I want to block-book a shift across a daily or weekly pattern, so
  that I don't re-enter the same shift many times.*
  - **AC:** choose Daily or Weekly pattern + date range; preview the generated set; remove
    unwanted days before commit; each generated instance is an independent request that can be
    filled/cancelled on its own; the originating pattern is retained for traceability.

### Epic C — Staff assignment & direct booking (P0)

- **C1** — *As a Manager, I want to assign a bank or overtime worker while creating a
  request, so that I can pre-fill known cover in one step.*
  - **AC:** typeahead matches on first **3+** characters of first or last name; only eligible
    workers (grade/skill/department, not already booked at that time) are selectable; marking
    **confirmed** + save creates the request already `booked`.
- **C2** — *As a Manager, I want to directly book a worker onto an existing unfilled request,
  so that I can fill it from the booking list.*
  - **AC:** search by name → **Book**; a booking is created; the request moves to
    `booked/filled` and leaves the unfilled view; double-booking the same worker for
    overlapping times is rejected with a clear error.
- **C3** — *As the System, I want booking to be atomic, so that two managers cannot both fill
  the same shift.*
  - **AC:** concurrent booking of one request yields exactly one winner; the loser gets a
    clear "already filled" message; no partial writes. (See `feature/atomic-bank-booking`.)

### Epic D — Multi-shift booking (P1)

- **D1** — *As a Manager, I want to select several requests and book one worker into all of
  them at once, so that a worker doing multiple shifts is booked in a single action.*
  - **AC:** multi-select in the booking list; one worker; all-or-nothing per selection with a
    per-row result summary; overlap/eligibility checked for each; partial failures reported
    without silently dropping rows.

### Epic E — Views, filters & favourites (P1)

- **E1** — *As a Manager, I want to filter the booking list (date range, department, status,
  fill source, grade), so that I see only what's relevant.*
  - **AC:** default view = open bank/agency shifts for the next 7 days; filters are combinable
    and reflected in the URL for shareable/bookmarkable state.
- **E2** — *As a Manager, I want to choose which columns show, so that the list fits how I
  work.*
  - **AC:** column show/hide + order persists per user.
- **E3** — *As a Manager, I want to save a view as a named favourite and mark one default, so
  that my preferred view loads at login.*
  - **AC:** multiple favourites per user; exactly one default; switching favourites re-applies
    columns + filters; favourites are private to the user.

### Epic F — Booking lifecycle (P0)

- **F1** — *As a Manager, I want to see filled shifts separately, so that I can confirm cover.*
  - **AC:** filter by `filled`; each shows the booked worker + fill source; status conveyed by
    label + icon, not colour alone (WCAG 2.2, per `operational-status.ts`).
- **F2** — *As a Manager, I want to cancel a booking with a reason when a worker drops out, so
  that the shift reopens for others.*
  - **AC:** reason is required (from a lookup); status → `unfilled`; the released shift
    reappears in the open queue; prior booking retained in history/audit.
- **F3** — *As a Manager, I want to cancel-and-recall a shift that's no longer required, so
  that it isn't refilled.*
  - **AC:** reason required; status → `recalled`; does **not** reopen.
- **F4** — *As a Manager, I want to confirm an unconfirmed booking, so that provisional cover
  becomes firm.*
  - **AC:** `unconfirmed` (amber) → `filled` (green); booking `status` → `confirmed`; audit
    records who confirmed and when.
- **F5** — *As a Manager, I want to mark that the ward has been informed of who is filling a
  shift, so that the "uninformed" flag clears.*
  - **AC:** `ward_uninformed` flag toggles to false; visible as a distinct badge (not colour
    alone) until cleared.
- **F6** — *As a Manager, I want to mark a shift unfillable, so that shifts with no viable
  cover are visibly distinguished from merely-open ones.*
  - **AC:** `unfilled` → `unfillable` (grey) with a reason; excluded from active fill queues
    but retained for reporting.

### Epic G — Agency fill (P2)

**Scope decision (see `BANK_STAFF_GAP_ANALYSIS.md` §6 #1):** the automated cascade **engine** is
**post-MVP** (agency marketplaces are MVP-excluded). The MVP models agency as a first-class
`fill_source`/`agency_filled` status and supports **manual** recording of an agency fill only.

- **G1 (MVP)** — *As a Manager, I want to record that an unfilled shift was filled by a named
  agency, so that agency cover is visible and reportable.*
  - **AC:** select an agency from the tenant's `agencies` reference; status → `agency_filled`;
    `fill_source = agency`; audited. No framework/cascade automation.
- **G2 (post-MVP)** — *As a Bank Admin, I want unfilled shifts to escalate to selected agencies
  in a framework-defined order, so that external cover is sought without manual chasing.*
  - **AC:** admin selects **specific** agencies (never "all"); order follows the configured
    framework; each cascade step recorded; a guard prevents an accidental all-agency broadcast.
    Requires `agency_frameworks` / `agency_framework_steps` / `agency_cascades`.

### Epic H — Timesheets (P2)

- **H1** — *As a Manager, I want to sign off worked shifts, so that hours can be processed.*
  - **AC:** sign-off from the booking view; produces an immutable timesheet record; feature is
    tenant-configurable (off by default). No payroll integration in the MVP (excluded).

### Epic I — Reports & exports (P2)

- **I1** — *As a Bank Admin, I want reports/CSV exports across duty requests, so that I can
  analyse fill rates and agency spend.*
  - **AC:** filterable report; CSV export (`feature/csv-exports`); no PII beyond what the role
    may already see; tenant-scoped.

### Epic J — Bank staff directory (P1)

- **J1** — *As a Manager, I want to search the bank staff pool and view a worker's grade,
  skills and contact details, so that I know who I can book.*
  - **AC:** search by name; results scoped to the tenant; detail view shows grade, skills,
    department eligibility, active/suspended status.

### Epic K — Messaging (P2, excluded from MVP)

- **K1** — *As a Manager, I want to message/notify eligible workers about open shifts.* —
  Tracked for the roadmap only; SMS is explicitly MVP-excluded. In-app/email notifications
  ride on `src/lib/notifications`.

---

## 3. Data model

Layers onto the planned core (`tenants`, `profiles`, `departments`, `shift_types`,
`shift_instances`, `shift_assignments`). Every tenant-owned table carries `tenant_id` and is
RLS-protected; timestamps are UTC; mutations emit `audit_events`.

### 3.1 Entity summary

| Entity | Purpose | Key relationships |
| --- | --- | --- |
| `bank_workers` | The bank/overtime staff pool | → `profiles` (optional), `worker_skills` |
| `worker_skills` | Grade/skill/competency a worker holds | `bank_workers` × `skills` |
| `shift_requests` | A shift needing to be filled (the "Request ID") | → `departments`, `shift_types` |
| `booking_patterns` | A daily/weekly recurrence that generated requests | 1 → many `shift_requests` |
| `bookings` | Assignment of a worker to a request | `shift_requests` × (`bank_workers` \| agency) |
| `agencies` | External supplier (MVP: reference for manual fill) | → `agency_frameworks` (post-MVP) |
| `agency_frameworks` | Ordered cascade config · **post-MVP** | 1 → many `agency_framework_steps` |
| `agency_cascades` | A request's escalation history · **post-MVP** | `shift_requests` × `agencies` |
| `cancellation_reasons` | Lookup for refuse/recall | referenced by `bookings`/`shift_requests` |
| `timesheets` | Sign-off record for a worked booking | 1 ↔ 1 `bookings` |
| `saved_views` | User's named column+filter favourite | → `profiles` |

### 3.2 Core tables (proposed columns)

**`shift_requests`** — the unit of work (the "Request ID": one shift to fill).
```
id                uuid pk
tenant_id         uuid  -> tenants
department_id     uuid  -> departments
shift_type_id     uuid  -> shift_types        (day/night/long-day…)
reference         text  -- human-readable Request ID, unique per tenant
required_grade    text                         -- or skill_id
required_skill_id uuid? -> skills
starts_at         timestamptz                  -- UTC
ends_at           timestamptz                  -- may cross midnight
status            request_status               -- base lifecycle state; see enum below
fill_source       fill_source?                 -- bank | overtime | agency (once filled)
has_notes         bool  default false          -- flag: notes attached
ward_uninformed   bool  default false          -- flag: ward not told who is filling
is_recently_added bool  default false          -- flag: freshly created & still unfilled
notes             text?                         -- free-text when has_notes
pattern_id        uuid? -> booking_patterns    -- null if ad-hoc
recall_reason_id  uuid? -> cancellation_reasons
created_by        uuid  -> profiles
created_at        timestamptz
updated_at        timestamptz
```

**`bookings`** — assignment of a worker (internal or agency) to a request.
```
id                uuid pk
tenant_id         uuid
shift_request_id  uuid -> shift_requests
worker_id         uuid? -> bank_workers        -- null when agency-filled
agency_id         uuid? -> agencies            -- null when internally filled
fill_source       fill_source                  -- bank | overtime | agency
status            booking_status               -- confirmed | cancelled | refused
booked_by         uuid -> profiles
booked_at         timestamptz
cancelled_at      timestamptz?
cancel_reason_id  uuid? -> cancellation_reasons
-- exactly one of (worker_id, agency_id) is non-null (CHECK)
-- unique active booking per request (partial unique index on status='confirmed')
```

**`bank_workers`**
```
id, tenant_id, profile_id?, full_name, grade, worker_type (bank|overtime),
contact_email?, contact_phone?, status (active|suspended|archived), created_at
```

**`booking_patterns`** — block booking.
```
id, tenant_id, cadence (daily|weekly), byweekday int[]?, range_start date,
range_end date, template (department_id, shift_type_id, times, required_grade),
created_by, created_at
```

**`agencies`** is MVP (reference table for manual agency-fill recording).
**`agency_frameworks` / `agency_framework_steps` / `agency_cascades` are post-MVP** (cascade
engine — see gap analysis §6 #1).
```
agencies:               id, tenant_id, name, active, framework_id?
agency_frameworks:      id, tenant_id, name
agency_framework_steps: id, framework_id, agency_id, position int  -- cascade order
agency_cascades:        id, tenant_id, shift_request_id, agency_id, step_position,
                        sent_at, outcome (pending|accepted|declined|expired)
```

**`saved_views`** (favourites)
```
id, tenant_id, profile_id, name, is_default bool, columns jsonb, filters jsonb, created_at
-- partial unique index: one is_default=true per (tenant_id, profile_id)
```

**`timesheets`**
```
id, tenant_id, booking_id (unique), worked_start, worked_end, signed_off_by,
signed_off_at, notes?
```

**`cancellation_reasons`** (lookup)
```
id, tenant_id?, code, label, applies_to (refuse|recall|both), active
```

### 3.3 Enumerations & flags

The domain status model (see
[`BANK_STAFF_DOMAIN_REFERENCE.md`](BANK_STAFF_DOMAIN_REFERENCE.md) §2.1) distinguishes a
**base lifecycle state** from **orthogonal overlay flags**. Model them separately — do not
collapse the flags into the status enum.

```
-- Base lifecycle state (mutually exclusive)
request_status : draft            -- being created, not yet open
               | unfilled         -- open, no worker
               | unfillable        -- cannot be filled
               | unconfirmed       -- booked, awaiting confirmation
               | filled            -- booked & confirmed (bank/overtime)
               | agency_filled     -- filled by an agency
               | recalled          -- withdrawn, no longer required
               | timesheet_entered -- worked; hours recorded
               | timesheet_final   -- worked; timesheet finalised

booking_status : unconfirmed | confirmed | cancelled | refused
fill_source    : bank | overtime | agency

-- Orthogonal flags on shift_requests (booleans, may combine with any open state)
has_notes         -- free-text notes attached
ward_uninformed   -- ward not yet told who is filling
is_recently_added -- freshly created & still unfilled
```

> **Mapping to existing status vocabulary.** `src/lib/status/operational-status.ts` already
> defines a *presentation* vocabulary (`pending`, `approved`, `published`, `draft`, …). The
> bank-shift `request_status` above is a **domain lifecycle**, distinct from that presentation
> layer. Keep `request_status` as the source of truth and add a small mapping to an
> `OperationalStatus` for badge rendering, e.g.:
>
> | `request_status` | → `OperationalStatus` |
> | --- | --- |
> | `unfilled` | `warning` |
> | `unfillable` | `critical` |
> | `unconfirmed` | `pending` |
> | `filled` / `agency_filled` | `safe` / `approved` |
> | `recalled` | `archived` |
> | `timesheet_entered` | `changed` |
> | `timesheet_final` | `published` |
>
> Overlay flags (`has_notes`, `ward_uninformed`, `is_recently_added`) render as **additional**
> badges/icons, never by replacing the base-state badge. Do not overload the presentation enum
> with lifecycle or flag semantics.

### 3.4 Key invariants (enforce in DB + domain layer)

1. A request has **at most one** `confirmed` booking at a time (partial unique index).
2. A booking references **exactly one** of `worker_id` / `agency_id` (CHECK constraint).
3. Cancel/recall **requires** a reason (`cancel_reason_id` / `recall_reason_id` NOT NULL for
   those transitions).
4. No worker holds two `confirmed` bookings with **overlapping** time windows (checked in the
   application/booking transaction; consider an exclusion constraint).
5. Agency cascade must target **explicitly selected** agencies — never an implicit "all".
6. Status transitions follow the state machine in
   [`BANK_STAFF_DOMAIN_REFERENCE.md`](BANK_STAFF_DOMAIN_REFERENCE.md) §2; illegal
   transitions are rejected in the domain layer, not just the UI.

---

_Backlog derived 2026-07-16 from the bank-staff domain reference. Priorities/scope are a
starting proposal — reconcile with `IMPLEMENTATION_PLAN.md` before committing branches._
