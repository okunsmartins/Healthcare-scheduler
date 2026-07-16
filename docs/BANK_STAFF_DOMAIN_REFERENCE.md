# Domain Reference — Bank / Temporary Staff Shift Filling

**Status:** Internal domain-analysis note (not a specification of what *this* portal must do,
and not shipped product design).
**Purpose:** Describe the *generic problem domain* of filling temporary/bank healthcare shifts
— the actors, the request → fill lifecycle, and the operational states a shift moves through —
so it can inform the Healthcare Scheduler Portal's **independent** design.
**Provenance:** Informed by a review of one HSE bank-staff rostering manual as a single
external data point. The states and workflows below are the general domain problem, not a
transcription of any vendor's screens, wording, or UI.

Related docs: [`BANK_STAFF_BACKLOG.md`](BANK_STAFF_BACKLOG.md) (user stories + data model
derived from this reference) · [`BANK_STAFF_GAP_ANALYSIS.md`](BANK_STAFF_GAP_ANALYSIS.md)
(how these workflows map onto our roadmap) · [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

> **⚠️ Independence & scope — read first.** [`README.md`](../README.md) states the product is
> **independently designed** and does **not** copy the source code, branding, screen layouts,
> wording, proprietary workflows, or internal architecture of any proprietary product. This
> file honours that:
>
> - It records the generic domain, not a blueprint of any vendor's UI, tab structure, or naming.
> - Our product defines its **own** vocabulary — the shipped status presentation lives in
>   `src/lib/status/operational-status.ts`, defined independently of any third-party scheme.
> - No vendor source code, screenshots, colour schemes, or verbatim UI text are reproduced here.

---

## 1. Actors

The primary operator is the **unit-side user** — the ward/department person who *requests
and fills* shifts. (A separate worker-facing experience is out of scope for this note.)

| Actor | Role in the workflow |
| --- | --- |
| **Unit / Ward Manager** | Raises shift requests, assigns and directly books staff, cancels/recalls, signs off timesheets. |
| **Bank Office / Admin** | Configures the service, enables timesheets/reports/messaging, manages the bank staff pool. |
| **Bank Worker** | An internal worker who picks up extra shifts from the staff bank (a fill source, not the operator). |
| **Overtime staff** | Existing employees taking additional paid shifts. |
| **Agency** | External supplier that can receive escalated shifts under a procurement framework. |

## 2. The shift-filling lifecycle

The system revolves around a **Shift Request** (identified by a **Request ID**) moving from
*unfilled* to *filled*, with escape hatches to cancel, recall, or cascade to agencies.

```
                 ┌─────────────┐
   create ─────► │  Unfilled   │ ◄──────────────┐
                 └──────┬──────┘                │ staff cancels
        assign / direct │ book                  │ (Unit Refuse Booking)
                        ▼                        │
                 ┌─────────────┐                 │
                 │  Booked /   │─────────────────┘
                 │   Filled    │
                 └──────┬──────┘
        no longer       │ timesheet
        required        │ sign-off
        (Recall)        ▼
                 ┌─────────────┐        auto-cascade    ┌──────────────────┐
   Unfilled ◄────│  Recalled   │        (framework)     │ Transferred to   │
                 └─────────────┘   Unfilled ──────────► │ Agency           │
                                                        └──────────────────┘
```

The domain distinguishes a shift's **base lifecycle state** from a set of **overlay flags**
that can apply on top of it — several are *not* mutually exclusive. How each is *presented*
(colour, icon, badge) is our own product decision (`src/lib/status/operational-status.ts`),
not part of this domain description.

### 2.1 Shift states and flags

**Base lifecycle states** (mutually exclusive):

| State | Meaning |
| --- | --- |
| Unfilled | Open, no worker assigned. |
| Unfillable | Cannot be filled — distinct from merely unfilled. |
| Unconfirmed | Booked, but the assignment is not yet confirmed. |
| Filled | Booked **and** confirmed by an internal (bank/overtime) worker. |
| Agency-filled | Filled by an external agency rather than the bank. |
| Recalled | Withdrawn — the shift is no longer required. |
| Timesheet entered | Post-work: hours recorded, not yet finalised. |
| Timesheet finalised | Post-work: signed off / locked. |

**Overlay flags** (booleans, may combine with an open state):

| Flag | Meaning |
| --- | --- |
| Has notes | Free-text notes are attached to the shift. |
| Ward uninformed | The ward has not yet been told who is filling the shift. |
| Recently added | Freshly created and still unfilled. |

**Modelling consequence:** *Has-notes*, *Ward-uninformed*, and *Recently-added* are orthogonal
flags layered on a base lifecycle state — not enum values. See the split into `request_status`
+ boolean flags in [`BANK_STAFF_BACKLOG.md`](BANK_STAFF_BACKLOG.md) §3.3.

## 3. Workflows (as documented)

### 3.1 Login
- Access via a per-environment URL with username/password.
- Forced password change on first login.

### 3.2 Add shift requests
- Created from a **Requests** tab; required fields are marked with a red asterisk.
- On save, new requests appear in the **Booking Status** screen as *unfilled*.

### 3.3 Block booking (recurrence)
- A request can be **block booked** across a range using a **Daily** or **Weekly Pattern**
  checkbox; unwanted days are removed from the generated set.

### 3.4 Assigning staff at creation
- While creating a request, type the **first 3 letters** of a surname or first name, pick
  the worker from the list, mark **confirmed**, and save.
- Assignment targets **Bank** or **Overtime** staff.

### 3.5 Direct booking (from Booking Status)
- Book a worker directly by ticking the checkbox beside a **Request ID**, or right-clicking
  it.
- **Multi-select:** if one worker covers several shifts, multiple requests can be ticked and
  booked together in one action.
- Search for the worker by name and **Book Staff**.

### 3.6 Home screen, filters & column views
- Default view: **all Bank + Agency unfilled shifts for the next 7 days**.
- Filters at the top of the page (applied via a magnifying-glass button) narrow the view.
- **Columns** are configurable via a column picker.

### 3.7 Favourites (saved views)
- A configured column/filter view can be saved as a **Favourite** (star icon → *Add as a
  New Favourite*).
- A favourite can be named and set as the **default** view shown at every login.
- Multiple favourites can be saved and switched between.

### 3.8 Viewing & cancelling booked shifts
- Once booked, a shift **leaves the Unfilled screen**; filter by **Filled Shifts** to see
  it (shown with a green marker).
- **Staff cancels:** select a cancellation reason and **Unit Refuse Booking** → the shift
  returns to the unfilled pool for others to book.
- **No longer required:** select a reason and tick **Recall the request**.

### 3.9 Recalling unfilled requests
- An unfilled request can be pulled back before it is filled via **Recall Request**.

### 3.10 Transfer to agency (auto-cascade)
- Unfilled shifts cascade to agencies automatically, in line with the relevant **HSE
  framework** ordering.
- The operator selects the **specific** agencies to include. Explicit warning in the guide:
  do **not** tick all agencies, or shifts are sent incorrectly.

### 3.11 Timesheets
- Worked shifts are signed off from a **Timesheets** tab or the **Booking Status** tab.
- Feature is enabled per-service on request to the bank admin.

### 3.12 Reports
- Reports can be generated across all duty requests. Enabled per-service on request.

### 3.13 Bank staff directory
- A **Bank Staff** tab lets the operator search for workers and view their details.

### 3.14 Messaging
- Messages/emails can be sent to staff from a **Messaging** tab. Enabled per-service on
  request.

## 4. Domain concepts extracted

These are the nouns the workflows imply — see [`BANK_STAFF_BACKLOG.md`](BANK_STAFF_BACKLOG.md)
for the full data model.

| Concept | Meaning in the domain |
| --- | --- |
| **Shift Request** (Request ID) | A single shift needing to be filled; the unit of work. |
| **Booking** | The assignment of a worker to a request (via confirm-at-creation or direct book). |
| **Block booking / pattern** | A recurrence rule that expands into many requests. |
| **Bank worker / Overtime staff** | Internal fill sources. |
| **Agency** | External fill source, reached by framework-ordered cascade. |
| **Cascade / framework** | The ordered escalation of an unfilled shift to agencies. |
| **Favourite (saved view)** | A named column + filter configuration, one marked default. |
| **Timesheet** | Sign-off record for a worked shift. |
| **Cancellation reason** | Required lookup value when refusing/recalling. |

## 5. What this reference deliberately does **not** assert

- It does not commit us to any screen layout, tab structure, or third-party status naming —
  our UI and vocabulary are designed independently.
- "Auto-cascade to agencies" and "messaging" are domain capabilities; whether the MVP includes
  them is decided in [`BANK_STAFF_GAP_ANALYSIS.md`](BANK_STAFF_GAP_ANALYSIS.md), not here.
  (Note: full *agency marketplaces* are on the MVP exclusion list in `IMPLEMENTATION_PLAN.md`.)
- The state/flag model in §2.1 is the general domain problem; the presentation of each state is
  defined by our own `src/lib/status/operational-status.ts`.

---

_Compiled 2026-07-16 as an internal domain-analysis note, informed by one external HSE
bank-staff rostering manual. No vendor source, screens, colour scheme, or verbatim UI text is
reproduced; the product is designed independently (see [`README.md`](../README.md))._
