# Hosted deployment (shareable preview)

How to put the app on a public URL so others can try it. It has two moving parts: the **hosted
Supabase project** (database + auth) and the **frontend** (Next.js on Vercel).

> **Why some steps are yours to run.** A few steps need credentials or third-party sign-in that an
> assistant must not perform on your behalf — your Supabase **database password**, and your **Vercel
> login**. Those are marked **[you]**. Everything else is either already done or scriptable.

Current state: the hosted Supabase project (`rawqtkwsvjzmhshkjpve`) carries migrations `0001–0011`.
The app code is at `0013`, so **employees + skills tables are missing on hosted** until Part A runs.
There is no frontend deploy yet.

---

## Part A — Bring the hosted database up to `0013`

1. **[you] Un-pause the project.** Free-tier Supabase projects pause after ~1 week idle; the CLI
   currently times out connecting, which is the classic "paused" symptom. Open the
   [dashboard](https://supabase.com/dashboard/project/rawqtkwsvjzmhshkjpve) and restore it if paused.

2. **[you] Get the database password.** Dashboard → **Project Settings → Database → Connection string**
   (or reset the password there). Then set it for the CLI session:

   ```bash
   export SUPABASE_DB_PASSWORD='your-db-password'   # macOS/Linux/Git-Bash
   # PowerShell:  $env:SUPABASE_DB_PASSWORD = 'your-db-password'
   ```

3. **Push the new migrations** (`0012` employees, `0013` skills). Additive only — creates tables,
   touches no existing rows:

   ```bash
   supabase db push
   supabase migration list        # expect Local == Remote for 0001–0013
   ```

   > If you set `SUPABASE_DB_PASSWORD` in this terminal, I can run these for you.

Hosted has **no seed data** (that's local-only, by design), so a fresh hosted DB starts empty — you
create your own account and workspace in Part D.

---

## Part B — Deploy the frontend to Vercel

1. **[you] Sign in to Vercel** and import the GitHub repo
   `okunsmartins/Healthcare-scheduler` (New Project → Import). Framework preset: **Next.js**
   (auto-detected). Root directory: repo root. Build command / output: defaults.

2. **Set environment variables** (Vercel → Project → Settings → Environment Variables). Values come
   from Supabase dashboard → **Project Settings → API**. The app validates these at startup and
   refuses to boot if any are missing (see `src/lib/env`).

   | Variable | Scope | Value |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Public | `https://rawqtkwsvjzmhshkjpve.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase → API → **anon/public** key |
   | `NEXT_PUBLIC_APP_URL` | Public | your Vercel URL, e.g. `https://<project>.vercel.app` |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase → API → **service_role** key (never client-side) |
   | `EMAIL_PROVIDER` | Server | `console` for now (no real email), or `resend` |
   | `RESEND_API_KEY` | Server | only if `EMAIL_PROVIDER=resend` |
   | `CRON_SECRET` | Server | any random string ≥ 16 chars |
   | `SENTRY_DSN` | Server | optional; leave blank |

   > `NEXT_PUBLIC_APP_URL` is a chicken-and-egg: deploy once to learn the URL, set it, redeploy — or
   > assign a custom/known domain first.

3. **Deploy.** Vercel builds on push to `main` automatically once connected. (The production build is
   verified green locally, so it should build cleanly.)

Alternative via CLI, if you prefer: `npm i -g vercel` → `vercel login` **[you]** → `vercel --prod`.
Once you're logged in on this machine, I can run the non-interactive `vercel --prod`.

---

## Part C — Point Supabase Auth at the hosted URL

Supabase must know the deployed URL or sign-in/redirects break. Dashboard →
**Authentication → URL Configuration**:

- **Site URL** → your Vercel URL (`https://<project>.vercel.app`).
- **Redirect URLs** → add `https://<project>.vercel.app/auth/confirm`.

Keep **Confirm email** ON (it already is). Note the built-in email sender is rate-limited and was the
reason two auth flows stayed unverified — for real invites/resets, wire up Resend (Part B env vars).

---

## Part D — Create a test account and share

1. Visit `https://<project>.vercel.app/sign-up`, register, confirm the email.
2. Sign in → you'll be sent to `/workspaces` → **Create workspace**.
3. You now have an owner workspace: add departments (Settings → Departments), staff (People), skills
   (Settings → Skills), assign skills on a staff member's page, scope department access.
4. Share the URL. Each tester makes their own account + workspace — RLS keeps every workspace isolated.

---

## What testers can exercise

Auth (sign-up/in/out, route protection) · workspace onboarding + switching · People directory
(add/edit/search/archive, detail view, **assign skills**) · Departments (CRUD + member access
scoping) · Skills (catalog CRUD) · Settings hub · role-based gating (owner vs viewer).

**Not yet built:** rostering/shifts (Phase 4), member invites, employee grade/contracts, availability.
