# Implementation Status

Living status of the build against the specification in [`README.md`](../README.md),
[`ARCHITECTURE.md`](ARCHITECTURE.md), and [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

- **Current branch:** `feature/supabase-authentication`
- **Base:** `main` (foundation ✅ + application shell ✅ merged)
- **Verification backend:** a hosted Supabase project (EU / West Ireland)

**How to read this:** a requirement is only listed under **Completed** if it was
**exercised end-to-end against the live backend**. Anything implemented but not yet run
against a real Supabase response is under **Implemented but not verified** — it is not
"done".

---

## Latest — 2026-07-16: bank-staff domain docs + quality-gate review

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

### 🟨 Implemented but NOT yet verified (do not treat as done)

These are code-complete and compile, but have **not** been exercised against a live
Supabase response. They need the manual steps below (email confirmation ON + a real inbox)
to verify.

- **Email confirmation (verify)** — `signUp` sends a confirmation link; `/auth/confirm`
  exchanges the token (`verifyOtp`). The handler and redirects compile, but no real
  confirmation email has been clicked. Confirmation was OFF during testing.
- **Sign-up with email confirmation ON** — the "check your email" branch (no session
  returned). Not exercised (confirmation was OFF).
- **Password reset request** — `resetPasswordForEmail` + generic success message. Not
  exercised; no reset email sent/received.
- **Password recovery + update** — `/auth/confirm?type=recovery` → `/update-password` →
  `updateUser({ password })`. Not exercised end-to-end.
- **Unconfirmed-email sign-in** — with confirmation ON, an unconfirmed user signing in
  surfaces the generic error. Not exercised.

### ⬜ Not in scope for this branch (later phases)

- Tenant data model, memberships, RLS policies, tenant-context resolution (Phase 2).
- Per-tenant workspace onboarding / "create a workspace" (Phase 3). "Create an account"
  here only creates an auth user.
- Custom transactional email (Resend) — `EMAIL_PROVIDER` is scaffolding; auth emails are
  sent by Supabase, not the app.
- CI pipeline (`ci/initial-quality-pipeline`).

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
