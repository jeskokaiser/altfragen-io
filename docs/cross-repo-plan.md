# Cross-repo plan: app and backend

How to work through `docs/modernisation.md` with several agents in two
repositories without breaking the line between them. Written 2026-10-04.

- **App repo** (`jeskokaiser/altfragen-io`): the React app, the Supabase Edge
  Functions, and — through the Supabase MCP server — the database: schema,
  policies, storage, pg_cron.
- **Backend repo**: the services behind `https://api.altfragen.io` on the
  Hetzner VPS — parser, OCR, subject worker, AI backend.

## Rules that keep the two in step

1. **One owner per shared thing.**
   - The database belongs to the app repo: schema, RLS, storage buckets and
     policies, pg_cron, Vault. Only an app-repo agent changes it, as a named
     migration (CLAUDE.md). A backend agent that needs a column, a constraint
     or a policy writes the exact SQL into its report, and an app-repo agent
     applies it.
   - Secrets belong to you. Agents name the variables; you create the values
     and put them where the contract says. No agent sees or prints one.
2. **The contract below is the interface.**
   - Copy this file into the backend repo as `docs/app-contract.md`, unchanged.
   - An agent may implement the contract but not change it. If it needs to,
     it stops and proposes the change in its report. You update both copies,
     then the work continues.
3. **Expand, then switch, then contract.** Every change that crosses the line
   ships in three steps, each deployed and checked before the next:
   1. The receiving side accepts the old and the new way and logs which one it
      saw.
   2. The sending side switches to the new way.
   3. Once the logs show only the new way, the receiving side stops accepting
      the old one.

   Nothing ever depends on two deploys landing at the same moment.

4. **Merging is not deploying.**
   - The frontend deploys from `main` (Netlify).
   - Edge Functions deploy only with `supabase functions deploy <name>`, or the
     MCP server's `deploy_edge_function`.
   - The backend deploys only when you redeploy it on the VPS.

   Agents open PRs and do not deploy, unless your prompt says so. You deploy,
   in the order of the phases below.

5. **One agent per repo at a time**, unless their areas are clearly disjoint
   (the phases say which). Each agent works on its own branch and opens one PR
   per workstream. Every PR says which contract items it implements and in
   which step (expand, switch or contract).
6. **Verification is in the logs.**
   - App side: Supabase `edge_logs` and `function_edge_logs` via the MCP
     server.
   - Backend side: the `auth=` log line the contract defines.

   An agent reports what it checked, not just a green build.

## The contract (v1)

**C1. Uploads carry the user's token**

Applies to the parser and OCR, the Edge Functions `process-pdf` and
`check-pdf-status`, and the browser.

- **Browser → OCR.** The browser calls `POST /ocr-service/process` with
  `Authorization: Bearer <the user's Supabase access token>`, which
  `OCRUpload.tsx` gets from `supabase.auth.getSession()`.
- **Browser → `process-pdf`.** The browser calls `process-pdf` through
  `supabase.functions.invoke`, which already sends the user's token.
  - `process-pdf` verifies it with `auth.getUser(token)`.
  - It forwards the same `Authorization` header unchanged to
    `POST /parser/upload`.
  - It sends `userId`, `user_id` and `university_id` only during step 1; they
    are dropped in step 3.
- **Status checks.** `check-pdf-status` verifies the caller the same way and
  forwards the same header to `GET /parser/status/{task_id}`.
  - `task_id` must match `^[0-9a-f-]{36}$` and is sent URL-encoded.
  - The backend returns a task only to the user who created it.
- **What the backend does with the token:**
  - It verifies the token: via the project's JWKS
    (`https://ynzxzhpivcmkpipanltd.supabase.co/auth/v1/.well-known/jwks.json`)
    if the project signs with asymmetric keys, otherwise via
    `GET /auth/v1/user`.
  - The user is the token's `sub`. The university is that user's
    `profiles.university_id`, read with the service key; never a form field.
  - Uploading with `visibility = university` and no university is a 400.
  - The domain rule holds: `university_id` is set exactly when visibility is
    `university`.
- **Step 1:** the backend logs `auth=token|missing|invalid route=<path>` on
  every request and keeps the old behaviour when there is no token.
  **Step 3:** a missing or invalid token is a 401.
- **CORS on the backend** allows the `Authorization` header from these
  origins:
  - `https://altfragen.io`, `https://www.altfragen.io`;
  - `https://deploy-preview-*--altfragen-io.netlify.app`;
  - `http://localhost:8080`.

**C2. Service-to-service calls carry `AI_COMMENTARY_BACKEND_TOKEN`**

- **Routes:** `POST /ai/process-batch` (already does), `POST /ai/consume`,
  `POST /subject-worker/process-job/{id}` and
  `POST /subject-worker/process-pending`.
- **Header:** `Authorization: Bearer <AI_COMMENTARY_BACKEND_TOKEN>`. The
  backend compares it in constant time (`hmac.compare_digest`).
- **Callers:**
  - the dispatcher, which already sends it;
  - the pg_cron job that calls `/ai/consume`, which reads it from Vault
    secret `ai_commentary_backend_token`;
  - `assign-subjects` and `reassign-subjects`, which read it from their
    environment.
- `/ai/submit` and `/ai/run` are deleted.
- The backend holds a run lock, so two `/ai/consume` or `/ai/process-batch`
  runs never overlap.
- **Step 1:** log `auth=token|missing`. **Step 3:** 401.

**C3. Cron calls to Edge Functions carry `x-cron-secret`**

- **Functions:** `dispatch-next-ai-commentary-batch` and
  `reconcile-stuck-ai-commentary-jobs` compare `x-cron-secret` with the
  `CRON_SECRET` environment variable.
- **Sender:** the pg_cron jobs send it from Vault secret `cron_secret`.
- **Body parameters:** both functions clamp them (`batch_size` 1–100,
  `lease_seconds` 60–3600).
- This item stays in the app repo, but the backend must know it exists.

**C4. Subject jobs come only from the Edge Functions, filled from the
verified caller**

- **`assign-subjects`:** `user_id` is the caller from the token, and the
  question ids must be that user's.
- **`reassign-subjects`:** only for callers whose `profiles.is_admin` is true.
  `university_id` must be a real university id; null and `"all"` are refused.
- **RLS:** no client may insert into `subject_jobs` directly.
- **The worker:**
  - accepts subjects only from the canonical list;
  - always filters assign updates by `user_id`;
  - treats a job row it cannot validate as `failed`.

**C5. AI job lifecycle**

- **Accepting a batch.** `/ai/process-batch` answering 202 means "accepted",
  nothing more.
  - The dispatcher no longer rolls back on timeouts. It relies on lease
    expiry, and the reconciler runs on a schedule.
- **Resetting jobs.** No failure path in the backend leaves a job
  `processing`. These include:
  - a provider submit that throws;
  - a batch ending expired, failed or cancelled;
  - a model answering with an error.

  On failure the queue job returns to `pending` with `attempts + 1`, or goes
  to `failed` once `attempts` reaches 3, and its question follows.

- **Batch status.** `ai_commentary_batch_jobs.status` uses only `pending`,
  `submitted`, `completed`, `failed`, `expired` and `cancelled`. The
  provider's raw state goes into a new column, `provider_status text`, which
  the app-repo agent adds first.
- **Idempotent writes.** Comments are written with an upsert on
  `ai_answer_comments(question_id)`. Quota ledger rows are idempotent on
  `(user_id, question_id, kind)`. The app-repo agent adds both unique
  constraints first, after removing any duplicates.
- **Quota detector.** It disables the feature only on HTTP 402 or an explicit
  `insufficient_quota`. A 429 means back off.

**C6. Storage**

- OCR hands Mistral the PDF without a public URL (inline or a signed URL of at
  most 10 minutes) and deletes the temporary file afterwards.
- Then the app-repo agent makes the `questions` bucket private and removes the
  stored PDFs.

## Phases

### Phase 0: you, before any agent

- [ ] Make the backend repository private on GitHub.
- [ ] Supabase dashboard → Authentication: check that "Confirm email" is on,
      and that the redirect allow-list has no wildcards beyond the Netlify
      previews.
- [ ] Create `CRON_SECRET` (`openssl rand -hex 32`). Store it as an Edge
      Function secret `CRON_SECRET` and as Vault secret `cron_secret`.
- [ ] Store the existing `AI_COMMENTARY_BACKEND_TOKEN` also as Vault secret
      `ai_commentary_backend_token`, and as an Edge Function secret if
      `assign-subjects` and `reassign-subjects` cannot read it yet. They run
      in the same project, so they share secrets.
- [ ] Copy this file into the backend repo as `docs/app-contract.md`.

### Phase 1: in parallel, no cross-dependency

| Agent | Repo                 | Prompt | Deploy                                                                                               |
| ----- | -------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| A1    | app, database only   | A1     | Migrations apply directly, after a rolled-back trial; a PR with the doc updates.                     |
| A2    | app, frontend config | A2     | Netlify, on merge.                                                                                   |
| B1    | backend              | B1     | On the VPS, after A1 has applied the C5 migrations (the upsert needs the constraint to exist first). |

A1 and A2 can run at the same time: A1 touches the database and
`src/services/ProfileService.ts`, A2 `index.html`, `public/` and
`vite.config.ts`.

**Gate 1** must hold before Phase 2:

- A1's migrations are live.
- B1 is deployed in step 1 (logging, not rejecting).
- `auth=missing` shows up in the backend logs for the current traffic, which
  proves the logging works.

### Phase 2: the app switches

| Agent | Repo                                   | Prompt | Deploy                                                                                      |
| ----- | -------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| A3    | app, Edge Functions + client + pg_cron | A3     | Edge Functions per function; frontend via Netlify; pg_cron through a migration (by A3/you). |

Deploy the Edge Functions before the frontend. The functions accept both
shapes during the switch.

**Gate 2:**

- For 3 days, real traffic shows only `auth=token` in the backend logs:
  uploads, OCR, consume and the subject worker.
- Any `auth=missing` left is from a caller you can name (or an attacker).

### Phase 3: the backend contracts

| Agent | Repo    | Prompt | Deploy      |
| ----- | ------- | ------ | ----------- |
| B2    | backend | B2     | On the VPS. |

After deploying, run one upload, one OCR and one subject assignment on a
Netlify preview, and check that each answers 2xx.

### Phase 4: storage and the AI pipeline

| Agent | Repo                  | Prompt | Deploy                                                                |
| ----- | --------------------- | ------ | --------------------------------------------------------------------- |
| A4    | app, database + crons | A4     | Migrations; crons turned back on only at the end, with your go-ahead. |

Run it once B1's C5 and C6 parts are live.

### Phase 5: app-only, one after another

These are from `docs/modernisation.md` sections 2–4. Each needs nothing from
the backend:

- **A5:** behaviour that loses data (session answers and the runner, account
  deletion through an Edge Function, uploads, search paging, silent failures).
- **A6:** scaling (the dashboard question download, reads by id, progress by
  user, lazy routes).
- **A7:** Lovable leftovers and maintainability (dead code, unused
  dependencies, `strictNullChecks` per directory, the error boundary).

Run them in this order, each after the previous PR is merged, because they
touch the same services and components.

## Prompts

Each prompt stands alone. The app-repo prompts rely on the agent reading
`CLAUDE.md` and `docs/modernisation.md`. The backend prompts rely on
`docs/app-contract.md` being there.

### A1: app repo, database security

```text
Read CLAUDE.md, docs/modernisation.md (section "Not started" → "1. Security"
and "2. Behaviour…") and docs/cross-repo-plan.md (contract C4–C6). You own the
Supabase database of this project (MCP server, project ynzxzhpivcmkpipanltd).

Fix, each as its own named migration, each first tried in a transaction that
ends in `raise exception` (rollback) under the roles involved, with
set_config('request.jwt.claims', …):
1. profiles: drop the user INSERT and DELETE policies; replace the recursive
   UPDATE policy with one that cannot change is_admin, is_premium,
   is_email_verified, university_id, email (column grants or a BEFORE UPDATE
   trigger); then backfill marketing_consent / marketing_consent_at from
   auth.users.raw_user_meta_data for users whose profile lacks it (counts
   only in your report). Prove: a user can no longer self-assign a
   university; updating username and marketing consent works.
2. questions: DELETE only for the owner (and admins); UPDATE by non-owner
   members may not change user_id, visibility or university_id.
3. ai_answer_comments / ai_commentary_summaries: read only where the
   question is readable (owner, public, verified member of its university).
   Prove: a private question's comment is invisible to another user, visible
   to its owner.
4. Storage: exam-images uploads limited to image types and 10 MB (bucket
   settings) and to admins or the owner of the question; drop the policies
   for the non-existent buckets question_attachments and question_images.
   Leave the `questions` bucket alone (Phase 4).
5. subject_jobs: no INSERT/UPDATE/DELETE for anon or authenticated.
6. Contract C5 preparation: add ai_commentary_batch_jobs.provider_status
   text; find and report duplicates on ai_answer_comments(question_id) and on
   the private quota ledger (user_id, question_id, kind); remove duplicates
   only with a rule you state, then add both unique constraints.

Before each change, check what reads or writes the object (code in src/ and
supabase/functions/, pg_proc, pg_policy, seven days of edge_logs) so the app
keeps working. Regenerate src/integrations/supabase/types.ts, run npm run
verify, update CLAUDE.md (domain rules) and docs/modernisation.md (move done
items to Done, with what was verified). Commit per concern with the SQL in the
message, open one PR, do not deploy Edge Functions. Report counts only, never
personal data.
```

### A2: app repo, frontend security and Lovable leftovers

```text
Read CLAUDE.md and docs/modernisation.md (sections 1 and 4). Work only in
index.html, public/, vite.config.ts, package.json and the files named below;
another agent is changing the database at the same time.

1. Remove the Lovable script (index.html, cdn.gpteng.co) and the
   lovable-tagger plugin and dependency.
2. Add public/_headers for Netlify: Content-Security-Policy (script-src
   'self'; connect-src 'self' https://ynzxzhpivcmkpipanltd.supabase.co
   wss://ynzxzhpivcmkpipanltd.supabase.co https://api.altfragen.io plus
   whatever the build and Stripe redirects need — find out, don't guess;
   frame-ancestors 'none'), X-Content-Type-Options, Referrer-Policy. Verify
   with `npm run build && npx vite preview` and a headless browser
   (Playwright with /opt/pw-browsers/chromium) that the landing page, login
   and dashboard load without CSP violations in the console.
3. Campaign action URLs: allow only http(s) (CampaignBanner.tsx,
   CampaignToast.tsx, and the admin form).
4. Remove unused dependencies (@radix-ui/react-toast, baseline-browser-mapping,
   caniuse-lite, @types/papaparse moved to devDependencies if used) — verify
   each with a grep and a build; never hand-edit package-lock.json.
5. Fix the missing assets referenced by manifest.json and index.html, or
   remove the references.

npm run verify must pass. One commit per concern, one PR, describe what you
verified in the browser.
```

### B1: backend repo, hardening and step 1 of the contract

```text
Read docs/app-contract.md (the contract with the Altfragen.io app; you may
implement it, not change it — propose changes in your report instead) and
docs/security-review-2026-10.md if present (the review of this repo).

Do not deploy, do not touch the Supabase schema (request SQL in your report).

1. VPS hardening (review H3, M1, M2, M6): bind Prometheus, Grafana and OCR
   ports to 127.0.0.1, drop --web.enable-lifecycle, require
   GRAFANA_ADMIN_PASSWORD; Caddy request_body max_size 50MB; per-container
   mem_limit; restart: unless-stopped with healthchecks; non-root USER in
   every Dockerfile; read-only source mounts; one env file per service;
   upgrade the parser's FastAPI/Starlette/python-multipart and pin the other
   services; delete prometheus-entrypoint.sh.
2. Contract C1 and C2, step 1 only: verify tokens when present and use the
   token's user and that user's profiles.university_id; without a token keep
   today's behaviour; log `auth=token|missing|invalid route=…` on every
   request. CORS per C1. Constant-time token compare. Run lock for consume
   and process-batch. Delete /ai/submit and /ai/run.
3. C4 worker side: canonical subject list, refuse university_id null/"all",
   filter assign updates by user_id, failed status for invalid jobs, claim
   jobs with UPDATE … WHERE status='pending' RETURNING.
4. C5: reset jobs on every failure path, normalized batch status plus
   provider_status, upserts on the unique keys (they will exist before you
   deploy — the app agent adds them), quota detector only on 402 /
   insufficient_quota.
5. C6: OCR without a public URL; delete temporary files.
6. Review lows L1–L9 where cheap; remove the dead code the review lists.

Add tests where the repo has a harness; otherwise a script that exercises
each route locally with and without a token. One commit per concern, a PR
that lists, per contract item, "implemented, step 1" and how you verified it.
```

### A3: app repo, the switch (Phase 2)

```text
Read CLAUDE.md, docs/modernisation.md and docs/cross-repo-plan.md, contract
C1–C4. The backend now accepts tokens and logs `auth=…` (step 1).

1. process-pdf, check-pdf-status: verify the caller with auth.getUser(token),
   forward the Authorization header unchanged; check-pdf-status validates and
   encodes task_id. Keep sending userId/university_id for now (step 3
   removes them).
2. OCRUpload.tsx: send Authorization: Bearer <session access token>.
3. dispatch-next-ai-commentary-batch, reconcile-stuck-ai-commentary-jobs:
   require x-cron-secret == CRON_SECRET; clamp body parameters.
4. assign-subjects, reassign-subjects: verify the caller; take user_id from
   the token; reassign only for profiles.is_admin; validate university_id;
   cap array sizes; send Authorization: Bearer AI_COMMENTARY_BACKEND_TOKEN to
   the worker.
5. pg_cron: change the jobs that call the Edge Functions and /ai/consume to
   read their secrets from Vault (vault.decrypted_secrets) — as a migration,
   tried in a rolled-back transaction first; leave the dispatcher job
   inactive.
6. Remove AIAnswerCommentaryService.triggerProcessing (calls a function that
   does not exist).

Specs for every Edge Function you change, if they can be lifted into pure
modules as stripe-webhook/entitlements.ts was. npm run verify must pass. Open
one PR; list the deploy order (Edge Functions first, then the frontend) and
the exact functions to deploy. After I deploy, check edge_logs and
function_edge_logs for 401s from real users for an hour and report.
```

### B2: backend repo, step 3 of the contract

```text
Read docs/app-contract.md. The app now sends tokens everywhere (step 2 is
deployed). Confirm from the logs I paste below (or the log files on this
host, if you have them) that real traffic only shows auth=token, then:
make missing or invalid tokens a 401 on every route in C1 and C2; stop
reading userId / user_id / university_id from forms; remove the step-1
logging noise but keep a counter of 401s per route. Add or update the tests
or the local script from B1 to prove a request without a token is refused
and one with a token works. One PR; do not deploy.
```

### A4: app repo, storage and the AI pipeline (Phase 4)

```text
Read CLAUDE.md, docs/modernisation.md ("The AI commentary pipeline…") and
docs/cross-repo-plan.md C5–C6. The backend now resets failed jobs, writes
normalized statuses and no longer uses public URLs for OCR.

1. Make the `questions` storage bucket private and delete its objects
   (report the count before and after; confirm in edge logs that nothing
   reads them).
2. Release the stuck AI jobs: a one-off migration that returns expired-lease
   `processing` jobs and their questions to `pending` (counts before and
   after, and how many users' quota changes).
3. Make ai_private_full_used_30d count only jobs with a live lease.
4. Fix the reconciler (status and lease predicate on its updates, checked
   update results) and schedule it with x-cron-secret.
5. Prepare, but do not run, the re-enabling of `Process AI Comments`: write
   the exact statement and what to watch in the logs for the first hour, and
   stop for my go-ahead.

Each database change: rolled-back trial, named migration, SQL in the commit.
Update docs/modernisation.md. One PR.
```

### A5–A7: app repo, Phase 5

```text
Read CLAUDE.md and docs/modernisation.md. Take the items of section
<2 "Behaviour that is broken or loses data" | 3 "Scaling" | 4 "Lovable
leftovers and maintainability"> in the order listed, one PR per item or per
small group. For each: reproduce or measure first (a spec through
src/test/supabaseDouble.ts that fails, a query count, a bundle size), then
fix, then show the same check passing — "How a slice is verified" in
docs/modernisation.md is the standard. Database changes as named migrations
after a rolled-back trial. Move finished items to Done with what was
verified. Stop and ask before anything that changes numbers users see (the
progress-row decision, the AI allowance).
```

## After each phase

- Update this file's checkboxes and `docs/modernisation.md`.
- If a contract item changed, bump it to v2 in both copies, and say in each
  repo's PR which version it implements.
