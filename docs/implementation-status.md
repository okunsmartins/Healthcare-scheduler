# Implementation Status

Living status of the build against the specification in [`README.md`](../README.md),
[`ARCHITECTURE.md`](ARCHITECTURE.md), and [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

- **Current focus:** Phase 2 (multi-tenancy & security) — on `main` via PRs #6, #7.
- **Base:** `main` (Phase 1 ✅ merged: foundation, shell, auth, CI).
- **Verification backends:** a hosted Supabase project (auth flows) + a **local** Supabase
  stack via the CLI (migrations, RLS, tenancy — Docker required).

**How to read this:** a requirement is only listed under **Completed** if it was
**exercised end-to-end against the live backend**. Anything implemented but not yet run
against a real Supabase response is under **Implemented but not verified** — it is not
"done".

---

## Latest — 2026-07-19: switcher browser E2E verified + seed auth fix

The workspace switcher was walked **end-to-end in a real browser**, which caught and fixed a
real seed bug. Local E2E ran the app against the local Supabase stack via a gitignored
`.env.development.local` (so `.env.local` is untouched — delete that file when finished).

### ✅ Completed requirements (verified)

- **Switcher browser flow — verified end-to-end.** Signed in as the seeded demo user →
  redirected to `/workspaces`, which listed both workspaces with the correct roles (St Mary's
  Hospital · Owner, Riverside Clinic · Viewer) → clicked through to `/st-marys/dashboard` with
  the tenant chrome, styled. Corroborated in the gateway/server logs: `POST /auth/v1/token 200`,
  `GET /rest/v1/memberships…!inner… 200`, `GET /workspaces 200`, `GET /st-marys/dashboard 200`.
  (The non-member-slug 404 remains covered by the isolation test + the `notFound()` guard in
  `[tenantSlug]/layout.tsx`; not separately clicked.)
- **Seed auth bug fixed** (`supabase/seed.sql`): the demo user was inserted with `NULL` auth
  token columns (`confirmation_token`, `recovery_token`, …), which crashed GoTrue's password
  grant with a 500 (*"converting NULL to string is unsupported"*) — meaning **login worked
  nowhere**. Fixed by inserting those columns as `''`. Only a real browser login exercised this
  path; the pgTAP suite (which uses JWT claims, not a password grant) never would have caught it.

### ⬜ Outstanding / notes

- **Two Phase 1 auth flows** still unverified (recovery → update, unconfirmed sign-in) — blocked
  by the Supabase email rate limit.
- Local browser E2E needs the fuller stack (`supabase start -x storage-api` on Windows — the
  storage health check is flaky) plus the dev server pointed at local via `.env.development.local`.

---

## 2026-07-18: department-scoped access + switcher data-path verification

Adds department-scoped access (**PR #9**) and closes most of the switcher's verification gap
by exercising its data path against the real HTTP API. The remaining gap is narrow and stated
below.

### ✅ Completed requirements (verified)

- **Department-scoped access** (migrations `0008–0009`): `departments`,
  `department_memberships`, and the `app.is_department_member()` SECURITY DEFINER helper — a
  member with **no** department links is unrestricted (sees all departments in their tenant);
  once scoped, they see only their linked ones — plus department/department-membership RLS
  (writes gated on `departments.manage`). Verified: `supabase db reset` applies `0001–0009` +
  seed; the pgTAP suite is now **14/14**, proving cross-tenant department isolation **and**
  within-tenant scoping (a scoped user sees only their department, not an unscoped sibling nor
  another tenant's). CI's `db-isolation` job runs this, so the department boundary is gated.
- **Switcher data path over HTTP — now verified.** Queried the local REST API **as the demo
  user** (minted JWT): `getMyMemberships`'s embedded-select returns the exact object shape the
  code maps, with the correct two workspaces + roles (`st-marys:owner`, `riverside-clinic:
  viewer`); the cross-tenant control (a tenant the user isn't in) returned `[]`. So **RLS holds
  over the real API**, not just in in-DB simulation. This retires the main runtime risk flagged
  in the previous entry.

### ❌ NOT verified — do not treat as done

- **Switcher browser click-through** — _superseded: verified end-to-end on 2026-07-19 (see the
  entry above), which also caught and fixed a real seed auth bug._
- **Department management UI** — out of scope for `feature/department-access` (arrives with
  Phase 3 `feature/department-management`).
- **Two Phase 1 auth flows** — password recovery → update, and unconfirmed-email sign-in —
  still blocked by the Supabase email rate limit.

### ⬜ Outstanding work

- ~~Complete the switcher **browser click-through**~~ — done 2026-07-19 (see the latest entry).
- Remaining Phase 2: `feature/audit-foundation` (append-only `audit_events`), then a final RLS
  **hardening pass** over `audit_events` and any later tenant-owned table.
- **Test-coverage gaps** unchanged: no unit tests for `src/lib/tenancy` or the server actions.

### Manual configuration steps

- **Local E2E** (to run the app against the local stack): bring up a fuller local stack but
  **exclude `storage-api`** — its container health check is flaky on Windows and otherwise
  rolls the whole stack back. Run the dev server with a **local env override** (does not touch
  `.env.local`): `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321` plus the local anon/service
  keys from `supabase status -o env`. Demo login: `demo@local.test` / `DemoPass123!`.
- Prior Docker / Supabase-CLI steps and the Windows `553xx` port remap still apply.

### Security considerations

- **Department scoping is RLS-enforced** (`is_department_member`, unrestricted only when a
  member has no department links) and proven by the 14-assertion test that gates CI.
- **RLS verified over the real HTTP API** — the cross-tenant control returned `[]` through
  PostgREST, confirming isolation isn't only an in-database property.
- **Local dev keys / JWT secret are the well-known shared defaults** (`supabase-demo` issuer) —
  local only, never a hosted/production project.
- The **switcher UI remains unproven in a browser** (above) — treat the running UI as
  unverified until the click-through is done.

### Exact commands to continue

```bash
# App gate (matches CI Quality gate)
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build

# DB / RLS (Docker running)
supabase start -x storage-api            # storage health check is flaky on Windows
supabase db reset                        # migrations 0001-0009 + seed
supabase test db                         # pgTAP isolation suite (expect 14/14)

# Switcher browser E2E (human logs in):
#   run dev server with local env, open http://localhost:3005,
#   sign in demo@local.test / DemoPass123!, walk /workspaces -> /[slug]/dashboard -> 404 on a bad slug

# Next roadmap branch:
#   feature/audit-foundation  (append-only audit_events + app.log_audit + src/lib/audit)
```

---

## 2026-07-18: Phase 2 tenancy — data model, RLS, workspace switcher

The multi-tenant security core and the first tenant-aware UI. Merged to `main` in **PR #6**
(tenant data model + RLS + isolation test) and **PR #7** (workspace switcher + path-based
routing). CI runs an isolation test on every PR, so tenant isolation is enforced, not just
asserted.

> Verification note: DB/RLS work is verified against a **local** Supabase stack (Docker). The
> switcher's **browser** flow is **not** yet verified end-to-end — see "NOT verified" below.

### ✅ Completed requirements (verified)

- **Tenancy schema** (migrations `0001–0007`): `profiles` (+ auto-create trigger), `tenants`,
  `tenant_settings`, RBAC catalog (`permission_definitions`, `role_definitions`,
  `role_permissions`) with a system role seed (owner→viewer), `memberships`, and RLS policies.
- **RLS with no recursion**: `SECURITY DEFINER` helpers in a private `app` schema
  (`is_member`, `has_permission`, `shares_tenant`); RLS enabled deny-by-default at table
  creation, member policies added alongside the helpers. Verified: `supabase test db` runs a
  pgTAP **cross-tenant isolation test, 8/8** — each user sees exactly their own tenant's rows
  and zero of the other's (both directions), and still passes with seed data present.
- **CI enforces isolation**: a `db-isolation` job applies the migrations to a real Postgres and
  runs the isolation test on every push/PR. Green on `main`.
- **Tenant-context resolution** (`src/lib/tenancy`): `getMyMemberships()` /
  `resolveTenantContext(slug)` via the RLS-aware server client. The route slug is only a
  *candidate* until membership is verified — matches `ARCHITECTURE.md`. Verified at the
  SQL/RLS level: querying as the seeded demo user resolves exactly `st-marys:owner` +
  `riverside-clinic:viewer`.
- **Path-based routing + membership guard**: app routes live under `/[tenantSlug]/*`; the
  tenant layout resolves the tenant and **404s non-members** (no info leak). `/workspaces`
  lists memberships (auto-forwards on a single one). Middleware flips to a public-allowlist
  model (`requiresAuth`) since slugs are dynamic. Verified: format, lint, typecheck, **31
  tests**, build all green; route tree confirmed by the build output.

### ❌ NOT verified — do not treat as done

- **Workspace switcher browser flow** — _superseded by the entry above._ The HTTP
  embedded-select was since verified over the real API; only the **browser click-through**
  remains unverified.
- **Two auth flows** still unverified from Phase 1 (password recovery → update, unconfirmed
  sign-in) — blocked by the Supabase email rate limit.

### ⬜ Outstanding work

- **Collaborative browser E2E** of the switcher (needs the app pointed at the local stack + a
  login, which must be done by a human).
- Remaining Phase 2: `feature/department-access` (departments + department-scoped RLS), an RLS
  **hardening pass** over the new tables, `feature/audit-foundation`, and **department-level**
  isolation cases in the test suite.
- **Test-coverage gaps**: no unit tests for `src/lib/tenancy` or the server actions (would need
  a mocked Supabase client); covered by the isolation test + manual checks only.
- Minor: CI shows one **informational** annotation — GitHub deprecating the Node 20 *runtime*
  for actions. Not fixable via our `node-version` input; revisit when action majors update.

### Manual configuration steps

- **Local development now requires Docker + the Supabase CLI**: `supabase start` boots the
  local stack; `supabase db reset` applies migrations + `supabase/seed.sql`; `supabase test db`
  runs the pgTAP isolation test.
- **Windows only**: the Supabase default local ports (`5432x`) fall in a reserved range and
  cannot bind — `config.toml` remaps them to `553xx`.
- **Local demo login** (seed): `demo@local.test` / `DemoPass123!` (owner of St Mary's, viewer
  of Riverside). Local stack only — never applied to a hosted project.
- No hosted-project changes were needed for this phase.

### Security considerations

- **Isolation enforced at the database**, not just the app — RLS on every tenant-owned table,
  proven by an automated test that now gates merges. This is the core security property of the
  product and it is exercised in CI.
- **No client-trusted tenant id**: the `[tenantSlug]` slug is verified against the user's
  memberships server-side before any data is returned; a non-member gets a 404.
- **`SECURITY DEFINER` helpers** live in a private `app` schema (not exposed via PostgREST);
  the service-role key is server-only and unused in this feature path.
- **`/api` is currently in the public allowlist** (only `/api/health` exists). Any future API
  route that needs auth must be handled explicitly — flagged so it isn't overlooked.
- The **switcher browser flow is unverified** (above); treat the running UI as unproven until
  the E2E pass is done.

### Exact commands to continue

```bash
# App quality gate (matches CI's Quality gate job)
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build

# Database / RLS (Docker must be running)
supabase start                 # boot local stack (Windows: ports are remapped to 553xx)
supabase db reset              # apply migrations 0001-0007 + seed.sql
supabase test db               # run the pgTAP cross-tenant isolation test (expect 8/8)

# Collaborative browser E2E of the switcher (human logs in):
#   run the dev server pointed at the LOCAL stack, sign in as demo@local.test / DemoPass123!,
#   confirm /workspaces -> pick a tenant -> /[slug]/dashboard, and that a non-member slug 404s.

# Next roadmap branch:
#   feature/department-access  (departments + department_memberships + department-scoped RLS)
```

---

## 2026-07-16: auth flow verification + CI pipeline

Verified the email-dependent auth flows against the **live** backend (email confirmation ON
+ a real inbox), landed a fix required to make them work with Supabase's default email, and
stood up CI. **Two flows remain unverified and must not be treated as done** (see below).

> Git note: the auth branch and `ci/initial-quality-pipeline` were merged to `main` (PRs #4
> and #3). `main` therefore already carries the two **unverified** flows below — merged before
> verification completed. Low risk (they share the verified `/auth/confirm` path) but flagged.

### ✅ Completed requirements (verified end-to-end against live Supabase)

- **Supabase config applied:** "Confirm email" ON; Site URL `http://localhost:3000`; Redirect
  URLs `…/auth/confirm` and `…/auth/confirm?next=/update-password`.
- **Sign-up with confirmation ON** → "check your email", **no session** created. Proof:
  `POST /sign-up 200` (no redirect to dashboard).
- **Email confirmation link** → session established → `/dashboard`. Proof:
  `GET /auth/confirm?code=… 307 → GET /dashboard 200`; user email shown in the shell.
- **Stale/again-clicked link** correctly rejected → `/sign-in?error=verification` (no token
  leak). Proof: `GET /auth/confirm?error=…otp_expired… 307`.
- **Password reset request** → generic "if an account exists…" message (no user enumeration).
  Proof: `POST /reset-password 200`.
- **Fix — `/auth/confirm` now accepts the PKCE `?code=` links** that Supabase's *default*
  (built-in email) templates send, via `exchangeCodeForSession`, keeping the `token_hash`
  path as a fallback. This is what made confirmation work. Commit `68c9756`, merged in PR #4.
- **CI pipeline (`ci/initial-quality-pipeline`)** — GitHub Actions runs the gate
  (`format:check → lint → typecheck → test → build`) on push to `main` and every PR. Merged
  in PR #3; the `main` badge reads **passing** (runs CI #1–#4 all green).
- **Local gate re-run green:** `format:check`, `lint`, `typecheck`, **28/28** tests, `build`.

### ❌ NOT verified — do not treat as done

- **Password recovery link → `/update-password` → `updateUser`** — **blocked by Supabase's
  built-in email rate limit** (a few emails/hour; exhausted during testing, no reset email
  delivered). The reset *request* is verified; the recovery-specific routing
  (`next=/update-password`) and the password update itself were **not** exercised end-to-end.
- **Unconfirmed-email sign-in** — the generic-error path for an unconfirmed account was not
  exercised.

### ⬜ Outstanding work

- Verify the two flows above — either wait for the email limit to reset and re-run, or
  configure custom SMTP (also raises the limit).
- **Test-coverage gap:** no automated tests cover the `/auth/confirm` route or the server
  actions (manual live verification only). Add a mocked-client unit test for the route's
  `code`-vs-`token_hash` branching.
- **Cleanup:** delete throwaway test users (`martins.okuonghae+hcs1@…`, `+hcs2@…`) in
  Supabase → Authentication → Users.

### Manual configuration steps

- **Done:** "Confirm email" ON; Site URL + the two `/auth/confirm` Redirect URLs.
- **Email templates cannot be edited on the free tier without custom SMTP** — this is *why*
  the app must handle the default PKCE `?code=` flow (above). Setting up custom SMTP (Resend)
  is a Phase-8 item and would unlock template editing **and** higher email limits.
- **Before deploying:** add the production origin's `/auth/confirm` URLs to Redirect URLs and
  set the Site URL to the production origin.

### Security considerations

- **No user enumeration** across sign-in, sign-up, and reset — verified with generic messages.
- **`/auth/confirm`** establishes a session from either a PKCE `code` or a `token_hash`, and on
  failure redirects to `/sign-in?error=verification` without leaking token details — verified,
  including rejection of an expired link.
- **`main` carries two unverified flows** (recovery→update, unconfirmed sign-in), merged via
  PR #4 before verification finished. Flagged; finish verification before relying on them.
- **Email rate limiting** (built-in Supabase mailer) throttles to a few/hour — revisit with
  custom SMTP + app-level throttling in Phase 8 hardening.
- A **browser-extension hydration warning** (`fdprocessedid` on the theme toggle) observed
  during testing is environmental, not an app defect — it does not reproduce in an
  extension-free browser and no app code emits that attribute.

### Exact commands to continue

```bash
# Full quality gate (matches CI)
npm run format:check && npm run lint && npm run typecheck && npm run test
npm run build            # requires a valid .env.local

# Finish auth verification once the email limit resets:
#   /reset-password -> emailed link -> /update-password -> set new password -> sign in
#   (also: sign up a fresh +tag but DON'T confirm -> try sign-in -> expect generic error)

# Then continue the roadmap:
#   Phase 2 -> feature/tenant-data-model, security/tenant-rls-policies (RLS gates all
#   tenant-owned data, including every bank-staff feature)
```

---

## 2026-07-16: bank-staff domain docs + quality-gate review

This entry covers a **documentation & planning** deliverable, not a runtime feature. No
application source was added or changed in it; the only code in the working tree is the
pre-existing auth change described later in this file. Because it is documentation, it is
verified by review + a green quality gate — **no auth "not verified" item below was promoted
to done, and no bank-staff feature was implemented or marked complete.**

### ✅ Completed and verified

- **Quality gate — all green (run 2026-07-16 against local `.env.local`):**
  | Step | Result |
  | --- | --- |
  | `format:check` (Prettier) | pass — *note: `.prettierignore` excludes `*.md`, so Markdown is not auto-checked* |
  | `lint` (`next lint`) | pass — no warnings/errors |
  | `typecheck` (`tsc --noEmit`) | pass |
  | `test` (Vitest) | pass — **28/28** across 6 files |
  | `build` (`next build`) | pass — 13 routes generated |
- **Bank-staff domain documentation created** and cross-linked from the README docs table:
  - [`BANK_STAFF_DOMAIN_REFERENCE.md`](BANK_STAFF_DOMAIN_REFERENCE.md) — vendor-neutral domain
    reference; the full status model (states + flags) recovered from the source, in §2.1.
  - [`BANK_STAFF_BACKLOG.md`](BANK_STAFF_BACKLOG.md) — 11 epics / user stories + a data model
    that layers on the planned core; base `request_status` split from orthogonal flags
    (`has_notes`, `ward_uninformed`, `is_recently_added`) to match the domain status model.
  - [`BANK_STAFF_GAP_ANALYSIS.md`](BANK_STAFF_GAP_ANALYSIS.md) — workflows vs. current
    scaffold, terminology crosswalk, sequencing, open decisions.
- **Roadmap kept as single source of truth** — `IMPLEMENTATION_PLAN.md` updated with net-new
  branches surfaced by the gap analysis: `feature/booking-patterns`, `feature/saved-views`
  (Phase 4), `feature/multi-shift-booking` (Phase 7), and a forced first-login password-change
  note on the auth branch.
- **Three open questions resolved** during review: shift status vocabulary (recovered from the
  source), agency scope (plan-consistent default: model `agency_filled` + manual recording in
  the MVP; defer the auto-cascade engine to post-MVP, since agency marketplaces are
  MVP-excluded), and the independence-claim tension below.

### ✅ Review finding — spec-compliance (resolved)

- **Independence-claim tension — resolved.** `README.md`'s scope disclaimer says the product
  copies no proprietary workflows/wording/layouts of any proprietary product. The original
  reference doc was vendor-named and transcribed a vendor status guide. **Fixed:** renamed to
  `BANK_STAFF_DOMAIN_REFERENCE.md`, generalised the status model to vendor-neutral states +
  flags, removed the vendor colour transcription, added an independence banner, and updated all
  cross-links. Tracked as decision #6 (resolved) in the gap analysis.

### ⬜ Outstanding (from this deliverable)

- Three engineering decisions deferred to build time (gap analysis §6 #3–#5): presentation-enum
  mapping, overlap-prevention (DB exclusion constraint vs. app check), and bank-worker identity
  (`bank_workers.profile_id` nullable).
- **No bank-staff feature is started.** All of it is downstream of Phase 2 (tenancy + RLS) —
  every table is tenant-owned and cannot reach `main` before isolation exists.

### Manual configuration steps

- **None** for this documentation deliverable — nothing to configure to "use" the docs.
- The auth-phase manual steps later in this file (enable email confirmation, URL configuration,
  test-user cleanup) still stand and are unchanged.

### Security considerations (this deliverable)

- **No new runtime attack surface** — documentation only; no routes, queries, or auth paths
  changed.
- **IP / independence** — the compliance finding above is the security-adjacent item: keep the
  product design first-principles and vendor-neutral to hold the README's independence claim.
- **Forward guard** — the bank-staff data model is specified as tenant-owned + RLS-protected
  with append-only audit (per `ARCHITECTURE.md`); this must be honoured when the features are
  actually built in Phase 3/4/7 — not before Phase 2 lands.

### Exact commands to continue

```bash
# Re-run the full quality gate (what was run above)
npm run format:check && npm run lint && npm run typecheck && npm run test
npm run build            # requires a valid .env.local

# Finish the in-progress auth phase (verify the "not verified" items below):
#   enable "Confirm email" in Supabase, then exercise sign-up/reset via a real inbox.
# Then continue the roadmap in order:
#   ci/initial-quality-pipeline  ->  Phase 2 (feature/tenant-data-model, security/tenant-rls-policies)
# Bank-staff features (Phase 3/4/7) come AFTER Phase 2 — do not branch them earlier.
```

---

## Phase 1 — Foundation

| Branch | Status |
| --- | --- |
| `chore/initial-project-foundation` | ✅ merged |
| `feature/application-shell` | ✅ merged |
| `feature/supabase-authentication` | 🟨 in progress (this branch) |
| `ci/initial-quality-pipeline` | ⬜ not started |

---

## `feature/supabase-authentication`

Scope per the plan: *Supabase Auth — sign-in / sign-up / reset / verify, session
handling, route protection.*

### ✅ Completed and verified (exercised live)

- **Environment validation & boot** — app fails fast without valid env; boots with
  `.env.local`. Verified.
- **Sign-in (valid credentials)** — real account → session established → lands on
  dashboard. Verified with a real user.
- **Sign-in (invalid credentials)** — generic `Invalid email or password.` (no user
  enumeration). Verified.
- **Sign-up with email confirmation OFF** — account created, session returned, redirect to
  `/dashboard`. Verified (throwaway accounts).
- **Route protection (middleware)** — unauthenticated request to `/dashboard`, `/settings`,
  etc. → `/sign-in?redirectTo=<path>`. Verified; confirmed middleware intercepts *before*
  the route renders.
- **`redirectTo` preservation** — the intended path is carried on the sign-in URL and in a
  hidden field. Verified.
- **Signed-in bounce** — an authenticated user visiting `/sign-in` → `/dashboard`. Verified.
- **Session persistence** — session survives navigation across protected routes. Verified.
- **Sign-out** — clears the session and returns to `/sign-in`; protected routes redirect
  again afterwards. Verified.
- **Form validation** — Zod server-side validation for email/password with inline,
  accessible field errors (`aria-invalid`, `aria-describedby`). Verified (invalid email,
  empty password).
- **Landing page session-awareness** — signed-out shows Sign in / Create account;
  signed-in shows "Go to your workspace". Verified.
- **Shell session wiring** — user email + Sign out in the sidebar (desktop) and top bar
  (mobile); `(app)` layout guards with `requireUser()`. Verified.
- **Quality gate** — `format`, `lint`, `typecheck`, 28 unit tests, and a production
  `build` all pass.

### ✅ Since verified (updated 2026-07-16 — proof in the "Latest" section)

Previously "not verified"; now exercised against the live backend:

- **Sign-up with email confirmation ON** — verified.
- **Email confirmation link** — verified. Note: it works via the **PKCE `code`** flow of
  Supabase's default email templates (exchanged in `/auth/confirm`), not the
  `token_hash`/`verifyOtp` path originally assumed — see the fix in the "Latest" section.
- **Password reset request** — verified (generic message, no user enumeration).

### 🟨 Still NOT verified (do not treat as done)

- **Password recovery + update** — `/auth/confirm?next=/update-password&code=…` →
  `/update-password` → `updateUser({ password })`. **Blocked by the Supabase email rate
  limit**; not exercised end-to-end.
- **Unconfirmed-email sign-in** — with confirmation ON, an unconfirmed user signing in
  surfaces the generic error. Not exercised.

### ⬜ Not in scope for this branch (later phases)

- Tenant data model, memberships, RLS policies, tenant-context resolution (Phase 2).
- Per-tenant workspace onboarding / "create a workspace" (Phase 3). "Create an account"
  here only creates an auth user.
- Custom transactional email (Resend) — `EMAIL_PROVIDER` is scaffolding; auth emails are
  sent by Supabase, not the app.
- ~~CI pipeline (`ci/initial-quality-pipeline`)~~ — **done**: merged in PR #3, gating `main`
  (see the "Latest" section).

---

## Manual configuration required

### 1. Environment variables (`.env.local`, gitignored)

Copy the template and fill in real values from Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL        = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = <anon/public key>
SUPABASE_SERVICE_ROLE_KEY       = <service_role key>   # not used yet; needed in Phase 2
NEXT_PUBLIC_APP_URL             = http://localhost:3000
CRON_SECRET                     = <16+ char random string>
EMAIL_PROVIDER                  = console
```

### 2. Supabase dashboard

- **Authentication → Providers → Email:** ensure Email is enabled.
  - **Turn "Confirm email" back ON** before any non-local use. It was turned OFF only to
    verify the signed-in flow without an inbox. With it OFF, anyone can create accounts
    with unverified/fake addresses.
- **Authentication → URL Configuration** (required for the verify/reset email links):
  - Site URL: `http://localhost:3000`
  - Redirect URLs: add `http://localhost:3000/auth/confirm`
  - Add the production origin's `/auth/confirm` before deploying.

### 3. Cleanup (test data)

Delete the throwaway users created during verification (Authentication → Users):
`throwaway-shell-test@example.com`, `throwaway-shell-test3@example.com`.

---

## Security considerations

- **No user enumeration** — sign-in, sign-up (existing address), and password reset all
  return generic messages that don't reveal whether an account exists.
- **Open-redirect guard** — `safeRedirectPath` restricts post-auth redirects to in-app
  absolute paths (rejects external and protocol-relative `//host` targets). Unit-tested.
- **JWT-validated gating** — server code uses `supabase.auth.getUser()` (revalidates with
  Supabase), never the cookie-trusting `getSession()`, before granting access.
- **Defence in depth** — middleware blocks protected routes *and* the `(app)` layout
  re-checks with `requireUser()`.
- **Service-role key** — referenced only via server-only env; not used anywhere in the auth
  code and never imported by client components.
- **Email confirmation must be ON in any shared/prod environment** (see manual steps).
- **Rate limiting / brute-force** — currently relies on Supabase's built-in auth rate
  limits. Revisit app-level throttling in hardening (Phase 8).
- **Password policy** — minimum 8 characters, max 72 (bcrypt limit) enforced by Zod on
  sign-up and password update. No composition/breach checks yet.
- **RLS / tenant isolation** — NOT in this branch. Arrives in Phase 2; until then there are
  no tenant-owned tables.
- **Dependency audit** — `npm audit` reports 7 advisories, all in **dev-only tooling**
  (vitest/vite/esbuild/postcss/next dev server), none in the production runtime. Do not run
  `npm audit fix --force` (forces breaking major bumps); address via deliberate tooling
  upgrades.

---

## Known issues / tech debt

- **React Hook Form** is listed in the README tech stack but not used; forms use React 19
  `useActionState` + server actions. Acceptable for these simple forms — revisit if forms
  grow complex.
- Referenced docs not yet written: `SECURITY_MODEL.md`, `THREAT_MODEL.md`,
  `DATA_MODEL.md`, `TEST_STRATEGY.md`, `BRANCHING_STRATEGY.md`, `DEPLOYMENT.md`,
  `PRODUCTION_READINESS.md`.
- No automated tests cover the server actions (they require Supabase mocking); they are
  covered by manual live verification only. Consider a mocked-client test in a later pass.

---

## Commands to continue

```bash
# --- First-time setup ---
npm install
cp .env.example .env.local        # then fill in Supabase URL + anon + service_role keys

# --- Develop ---
npm run dev                       # http://localhost:3000

# --- Quality gate (run before every commit) ---
npm run validate                  # format:check + lint + typecheck + test
# or individually:
npm run format                    # auto-fix formatting
npm run lint
npm run typecheck
npm run test
npm run build                     # production build (requires a valid .env.local)

# --- Ship this branch ---
git add -A
git commit -m "feat: ..."         # .env.local is gitignored
git push -u origin feature/supabase-authentication
# then open a PR into main on GitHub

# --- Verify the unverified flows (after enabling "Confirm email") ---
# 1. Sign up at /sign-up with a real inbox -> expect "check your email"
# 2. Click the emailed link -> should land via /auth/confirm at sign-in
# 3. Sign in -> dashboard
# 4. /reset-password -> request link -> emailed link -> /update-password -> sign in
```

---

_Next roadmap item after this branch merges: `ci/initial-quality-pipeline` (GitHub Actions
running format, lint, typecheck, unit, build), then Phase 2 (tenant data model + RLS)._
