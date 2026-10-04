# Modernisation

Where the cleanup of this codebase stands, and what is left. The repository had
gone untouched for months and was generated largely by Lovable; the work below
is about making it verifiable first and tidy second.

`CLAUDE.md` holds the conventions that result from this. This file holds the
plan, so a new session can pick up without re-deriving it.

## Done

**The toolchain runs and CI gates it.** `npm ci` used to fail outright (two
drifted lock files), `npm run lint` crashed on the first file it read
(incompatible typescript-eslint), and there was no typecheck script and no CI at
all. All four now work, and `.github/workflows/ci.yml` runs install, typecheck,
lint, format check and build on every pull request.

**The generated Supabase types match the database again.** They had drifted for
months. The app still compiled, because Vite strips types without checking them;
the drift surfaced instead as `as any` casts and as columns silently read as
`undefined`. Two real bugs fell out of the regeneration — an integer column
written as a string from the admin editor, and case text that was mapped but
never selected.

**Dead code removed.** The collaboration feature (~2900 lines) was backed by
three tables that no longer exist. IMPPulse (~1600 lines) was removed at the
author's request; its broadcast sender had never worked, posting an unencrypted
payload under an `aes128gcm` header and never signing it. `no-unused-vars` went
from 173 violations to zero and is now an error.

**Security.** `npm audit` went from 21 findings (1 critical, 16 high) to 2
moderate. The critical one came from the `supabase` CLI sitting in
`dependencies`, which pulled node-tar into the production tree.

**API keys.** The browser uses the publishable key; Edge Functions read their
outbound key through `supabase/functions/_shared/supabaseKeys.ts`. Deployed and
tested.

**One question row mapper** instead of ten hand-written copies.

**`user_progress` has a service.** `UserProgressService` owns the table and the
merge with `session_question_progress` that every read of it needs. Seven files
used to do that merge by hand, and they did not agree: `TrainingConfig` read
`user_progress` alone, so the 545k question/user pairs that only ever appeared
in a saved session were invisible to its „Nur neue Fragen“ and „Nur falsche
Fragen“ filters. That is fixed; the disagreement that is not is under Not
started.

**`profiles` and `universities` have services.** `ProfileService` and
`UniversityService` own them. Five files queried the two tables directly — the
auth context, the auth page, the admin role hook, the subject reassignment
panel and the dashboard. The same email-verification update was written out
twice, in the context and the page, and had to be kept in step by hand.

The services throw on a database error rather than returning a fallback: what
a failure means differs per screen — a missing admin flag means "not an
admin", a missing profile on sign-in means the session is unusable — so the
caller decides, and the German message a user sees stays next to the screen
that shows it.

Not done here: `AuthContext` still reads the profile and then the university
name in two round trips, though `profiles_university_id_fkey` would let
PostgREST embed them in one. It is the root of auth state and the embed cannot
be tested from this repo, so it stays a separate change.

**`ai_commentary_settings` has a service.** It is a single row of app-wide
limits, and four screens read it themselves, each with its own fallback for an
empty column. Two of them disagreed about the same column: the session list
fell back to 10 free sessions, the exam list to 5 (after starting at 10). The
fallbacks now live once, in `DEFAULT_AI_COMMENTARY_SETTINGS`, and the screens
share one cached query through `useAICommentarySettings`.

Two behaviour notes. An empty daily limit used `||`, so a limit of 0 — "no free
AI comments" — silently became 50; it is `??` now and 0 means 0. The database
holds 30, so nothing changes today. And the defaults are not the configured
values: a failed read gives 10 sessions (stricter than the configured 20) but
50 daily comments (looser than the configured 30). Both are what the screens
used before; making the comment default fail closed is a product decision.

**`user_preferences` has a service.** `UserPreferencesService` owns the row
that remembers a user's settings between visits: keyboard bindings, AI models,
archived datasets, the statistics date range. The context read and wrote it
through twelve `as any` casts on the jsonb columns (see below). The service
maps them with type guards instead, and was checked against every combination
of stored values in production — 146 — to map each exactly as the context did.
A branch went with the casts: a migration from an old
`show_enhanced_ai_versions` flag, reading a column that no longer exists, so it
could not have run. The defaults live once; the keyboard settings page kept its
own copy for its reset button.

Moving the insert surfaced a bug that the API logs confirm. A new user's first
visit starts three or four preference loads at once (see `AuthContext` under
Not started), each finds no row, and each inserted the defaults: the unique
`user_id` let the first through and failed the rest with 409, and every failure
showed „Einstellungen konnten nicht geladen werden“. The logs show it on each of
the three first visits of the two weeks before the fix. The insert is
`ON CONFLICT (user_id) DO NOTHING` now, checked against the database under the
`authenticated` role.

**`subscribers` is read through a service.** `SubscriptionService` holds the
browser's one query of the table, the premium check in `SubscriptionContext`.
The context asked for its row by `user_id` _or_ `email`, which reads like a
fallback for a paid-for row the webhook has not linked to a user yet. It never
was one: RLS lets a user read only rows with their own `user_id`, so the email
could not find anything the id did not. The service asks by `user_id` alone and
says why; linking the row is the webhook's job, and today every subscribed row
is linked. The checkout and customer-portal calls stay in the context: they
call Edge Functions, not the database.

**`user_ai_comment_usage` has a service.** `AICommentUsageService` owns the
daily count of AI comments a free user has opened, which `useAICommentUsage`
checks against the limit. The hook read and wrote the table itself, with the
UTC day worked out in two places; the service has `usageDate` once, and
documents what it means: the free allowance starts over at midnight UTC — 01:00
or 02:00 in Germany — not at local midnight.

The count is raised in the database now, by `increment_ai_comment_usage`: one
`INSERT … ON CONFLICT DO UPDATE SET usage_count = usage_count + 1` that returns
the new count. The hook used to read the count and write count + 1, so two tabs
could both write the same number and lose a view. The function is
`SECURITY INVOKER`, so the table's RLS still applies, takes the user from the
session, and can be called by `authenticated` only. It was applied as the
named migration `increment_ai_comment_usage`; this repository keeps no
migration files, so the database is where it lives.

**The analytics pages read through services.** `ExamAnalytics` and
`TrainingSessionAnalytics` read `training_sessions` and
`session_question_progress` through `TrainingSessionService` now, and every
`upcoming_exams` query outside the service — the analytics page, the exam-name
selector dialog, the dashboard and the OCR upload — went into
`UpcomingExamService`. The "latest result per exam question" had been written
out twice, in the page and in `getExamStatsForUser`, batching and dedup
included; it is `fetchLatestResults` now, and the exam link inside the
`filter_settings` jsonb is read in one place, `examIdOf`.

The sessions of an exam are filtered in the database
(`filter_settings->>source`, `->>examId`) instead of loading all of a user's
sessions and filtering them in the browser; over the 9,448 sessions in
production the two predicates pick the same 9,441. `ExamAnalytics` still reads
all progress rows of an exam's sessions in one request, up to 5,465 for one
user today. That is within the API's row cap — responses of 20,000 rows appear
in the logs, so the cap is not the default 1,000 — but it is the first read to
watch if exams grow.

Two defects fell out. The page and the selector dialog both cached under
`['exam', examId]`, one the whole row, the other only `exam_name`; with a
five-minute `staleTime` whichever read first decided what the other got, so the
statistics page could show no title and "Invalid Date". Both go through
`useUpcomingExam` now. And the OCR upload's "linked to exam" toast compared the
whole `exam_name` column, so it missed the 93 exams linked to several names and
failed in the 49 cases of one user giving the same name to more than one
exam, telling them to create an exam they had.

**Per-user database functions check who is asking.**
`ai_private_full_used_30d`, `ai_private_credits_remaining` and
`get_exam_cohort_stats` take the user as a parameter and run as
`SECURITY DEFINER`, so RLS does not apply. They answered for any user, to
anyone holding the publishable key, signed in or not — AI credit balance,
quota use, and answered and correct counts on an exam. Each now raises
`42501` unless the parameter is the caller (`auth.uid()`) or the caller is
the service role, and `anon` lost `EXECUTE` (migration
`guard_per_user_functions`). The service role has to stay allowed:
`ai_commentary_claim_next_batch` asks about every premium user, called by the
dispatcher with the secret key, which the API gateway turns into a
`service_role` token. Verified in a rolled-back transaction under each role
before applying, and again on the live database: answers about oneself
unchanged (a non-zero credit balance and a full cohort result compared
value for value), answers about anyone else and every signed-out call
refused, the claim function still running under the service role. The
dispatcher's cron job (`Process AI Comments`) has been inactive since
1 June, so that path is proven only in the database, not by a live run.

**No `SECURITY DEFINER` function is open to the API any more without
need.** 21 more of them bypassed RLS and were executable by anyone holding
the publishable key, signed in or not: the AI batch claim, which claims and
requeues jobs; `update_question_answer_stats`, which recomputes statistics
over every answer; functions answering about any user or question
(`is_premium_user`, `has_role`, `check_user_university_match`,
`ai_question_content_hash`, ...); the exam reconstruction's nine (dead, see
Not started); and four trigger functions. None is called through the API —
no code calls them, and seven days of API logs show no call — so `EXECUTE`
went to the service role only, and to nobody for the trigger functions
(migration `restrict_security_definer_functions`). Their real callers run
inside the database and need no caller's `EXECUTE`: the claim calls its
helpers as their owner, and a trigger fires whatever the firing role may
execute. Verified in rolled-back transactions — every signed-out and
signed-in call refused, the service role's calls and the claim still
working, and editing a shared question as its owner, with no `EXECUTE` on the
trigger function, still set its AI status to `pending` — and by production
data: the auth service has never had `EXECUTE` on
`sync_profile_email_verified`, and all 7 email confirmations of the last 30
days reached the profile. The security advisor now lists no function
callable signed out, and only the three guarded ones above signed in.

Default privileges still grant `EXECUTE` on every new function in `public` to
`anon` and `authenticated`, so a new function is open until its migration
revokes it (CLAUDE.md says so). Changing the defaults instead would close
that for good, at the cost of a grant for every function the client calls.

**The API row cap is handled where it bites.** The API returns at most 20,000
rows per response and cuts the rest off without an error. That had been
losing data: the dashboard's question list read each of its three sets in one
request, newest first, so one university's 1,003 users lost up to 3,600 of its
23,600 shared questions, and one user 981 of their own — from the dashboard
and from training built on it. The logs showed 5 responses of exactly 20,000
rows in a day. `fetchAllRows` (`src/services/fetchAllRows.ts`) reads past the
cap: its first request asks for everything with `{ count: 'exact' }`, and if
the total says rows are missing, the response length is the cap and the rest
loads in parallel pages of that size. A read under the cap still costs one
request. Any read that can grow past 20,000 rows should go through it —
or, better, ask for less: the subject picker needs 121 names, not 24,333
rows, and gets them from `list_question_subjects()`, a `SECURITY INVOKER`
function that returns one array, which no row cap applies to.

**There are tests.** vitest runs from `npm run test`, inside `npm run verify`
and in CI. 228 specs cover the places where a mistake is both plausible and
invisible: the Stripe entitlement decisions, the user progress merge and
answer recording, the cohort scoring, the profile and university reads, the
AI commentary settings, the user preferences mapping, the subscription read,
the AI comment allowance and credit reads, the exam and session reads behind
the statistics pages, the exam cohort comparison, the dashboard's question
list, and the paging past the API row cap.
The entitlement decisions had to be lifted out of `stripe-webhook/index.ts`
first — the function is Deno and imports Stripe over URL, so nothing in it is
reachable from a Node runner. They now live in
`stripe-webhook/entitlements.ts`, which imports nothing; the extraction was
checked against the old logic over all 14,580 input combinations before the
specs were written.

Specs sit next to the code. They import from `vitest` explicitly rather than
enabling globals, so the eslint config needs no exception for them. A service
spec drives the Supabase query builder through the double in
`src/test/supabaseDouble.ts`, which records the payload each call would have
sent, so writes are asserted rather than the mock.

## Data access into services

No file outside `src/services/` queries a table or calls a database function
any more — slices 7 and 8 finished that. Scattered queries were the root
cause of the type drift above: each grew its own casts and its own row
mapping. What is left outside the services are calls of Storage and Edge
Functions, which are not database access.

Count them with a pattern that sees through casts and aliases, across line
breaks:

```bash
rg -lU '\(?\b(supabase|sb)( as any\))?\s*\.from\(' src -g '!src/services/**'
```

`supabase.from(` alone misses `(supabase as any).from(`. The pattern used
until slice 6 caught that, but not `const sb: any = supabase; sb.from(…)`, and
two files queried only that way: `OCRUpload` and `ExamQuestionSelectorDialog`.
The earlier figure of 9 was therefore 11. Before trusting the count, check
that no other alias has appeared: `rg '=\s*supabase\s*;' src`. Database
functions: `rg -lU '\.rpc\b' src -g '!src/services/**' -g '!src/test/**'`.

Suggested slices, roughly in order of value:

1. ~~**`user_progress`**~~ — done, see above.
2. ~~**`profiles` / `universities`**~~ — done, see above.
3. ~~**`ai_commentary_settings`**~~ — done, see above.
4. ~~**Contexts**~~ — `UserPreferencesContext` and `SubscriptionContext`,
   done, see above.
5. ~~**`user_ai_comment_usage`**~~ — done, see above.
6. ~~**The analytics pages**~~ — done, see above.
7. **`questions` from components** — in parts.
   - ~~An exam's questions and exam names~~ — done: `Dashboard` and
     `ExamAnalytics` read an exam's questions through
     `fetchQuestionsForExamNames` (with `questionRowMapper`, checked against
     the two hand-written mappings over all 135 stored value shapes: only
     fields neither path reads differ), and `ExamQuestionSelectorDialog`'s
     three tabs through `listExamNameCounts`, one paged read instead of one
     read plus a count per name.
   - ~~`useSubjects`~~ — done: it read the subject of every visible question,
     sorted by subject, so the large university's members lost 24 of their
     121 subjects past the cap. `list_question_subjects()` returns them as
     one array (applied as a named migration; the SQL is in the commit).
   - ~~`ArchivedDatasets`~~ — removed with the whole dataset archive, at the
     owner's decision. The feature was dead end to end: no link to the page,
     no way to archive anywhere in the app, and all 6 archive entries (5
     users) were exam names while the page compared file names, so it showed
     nothing to anyone. The `archived_datasets` column stays, unread.
   - ~~The question editors~~ — done. `EditQuestionModal` saves through
     `updateQuestion`; doing so showed it changed `visibility` without
     `university_id`, which left one production question shared with no
     one. `updateQuestion` now writes the two together. `QuestionEditorPanel`
     lists exam names through `list_question_exam_names()`, the sibling of
     the subjects function (its admin sees 24,059 named questions).
   - ~~The uploads~~ — done. `PDFUpload` and `BatchPDFUpload` read the saved
     questions through `fetchQuestionsByFilename` and save the review through
     `updateQuestion`; the payload was compared with the old one over 1,458
     combinations of values. Exam-name suggestions are
     `suggestExamNames`.
8. ~~**Database functions from components**~~ — done. The AI credit
   overview in `Dashboard` reads through `AICreditsService`, the exam cohort
   comparison through `ExamCohortService`, without the stale
   `(supabase.rpc as any)`. Its typed mapping was compared with the old one
   over 110 value shapes, including the two the function returns in
   production (123 complete results and 17 rows of nulls, asking for each of
   the 140 exams with a university and linked questions as its creator). Typing it showed that the cohort median line
   never appeared: the mapping read `score_median`, which the function does
   not return; the line is gone. The camelCase fallbacks and the parsing of
   histograms sent as strings were dead too — the function returns neither.
   `utils/cohortScoring.ts` has drifted from the function it copies
   (`COHORT_N_REF` 3000 there, 2000 in the database), harmlessly, as nothing
   calls it; it should go, or be brought in line, as its own change.

`no-explicit-any` was expected to fall as this proceeds. It mostly does not:
slices 1 and 2 left it at 161, because those casts sit in the components
around the queries. Slice 3 moved it to 157, because there the casts sat on
the queries themselves — left over from before the types were regenerated,
each commented "may not be in generated types yet". Where a cast guards a
query, moving the query removes it; elsewhere the casts are a separate job.

The same leftover had widened a whole service: `UpcomingExamService` cast its
client to `any` "until Supabase types include upcoming_exams", long after
they did, which switched type checking off for 13 queries. Typing it, and
moving the last `upcoming_exams` query out of `TrainingSessionsList`, took
`no-explicit-any` to 149. One callback there stays `any` on purpose, with a
comment saying why: removing the annotation would have hidden it, not typed it.

`UserPreferencesContext` took it to 137. Its twelve casts sat on the jsonb
columns. On the reads they stood in for a check: the columns come back as
`Json`, and the casts passed them on as bindings, a date range and a model list
without looking — and one read a column that no longer exists. On the writes,
three were needed only because `KeyboardBindings` and `StatisticsDateRange`
were interfaces, which have no index signature and so are not assignable to
`Json`; as type aliases they are. The other four were not needed at all.

Slice 6 took it to 114. Of the 23, 15 were callbacks over session and progress
rows annotated `any`; some were needed because the queries ran inside
`Promise.allSettled` with a `Promise.resolve` fallback, where the row type did
not survive the union — that includes the one in `UpcomingExamService` kept
`any` on purpose, and the construction that forced it is gone. Four were casts
on the `filter_settings` jsonb, now `examIdOf`, and four were
`const sb: any = supabase`.

The first part of slice 7 took it to 104: the hand-written row mappings'
`(q: any)`, the exam-name dialog's `sb` aliases and callbacks, and the `any[]`
the dashboard's question list was collected into. The rest took it to 100:
`updateQuestion`'s payload is `TablesUpdate<'questions'>` instead of `any`.
Slice 8 took it to 99: the cast on the cohort call.

## Not started

A full review on 2026-10-04 added most of what follows. Five reviews ran in
parallel — Edge Functions, browser security, data flows, performance (all
four on Sonnet), and a sweep for dead code and Lovable leftovers (on Haiku) —
while the database was checked directly: every RLS policy, storage, grants,
the advisors, `pg_stat_statements`. Their claims were spot-checked before going
in here; one did not hold and was dropped (`tailwindcss-animate` is in use).
"Verified" below means shown on the live database, with counts only; the rest
is from reading the code, with file and line. The backend behind
`api.altfragen.io` — parser, OCR, subject worker and AI backend on a Hetzner
VPS, in a repository of its own — was reviewed the same day by a separate
agent (read-only, at its commit `6dbdeb0`); its findings are merged below and
marked _backend review_. Not reviewed: settings that live only in dashboards —
Supabase Auth ("Confirm email", the redirect allow-list), Netlify headers,
`verify_jwt` per function — and the VPS host itself (its `.env`, firewall,
what actually runs).

The order is the suggested order of work.

### 1. Security

**Anyone can make themselves a member of any university** (verified). The
`profiles` policies let a user delete their own row and insert a new one, and
the insert check pins only `is_admin` and `is_premium` — so `university_id`
and `is_email_verified` are the user's to choose. In a rolled-back test, a user
of another university deleted and re-inserted their profile as a verified
member of the largest one. The `questions` policies then give them what every
member has: read, update and **delete** on all 23,600 of its shared questions,
and the same for the university's comments. The fix is in the database: drop
the user INSERT and DELETE policies on `profiles` (`handle_new_user` creates
the row; account deletion belongs in an Edge Function, below), and keep
`university_id` and `is_email_verified` out of the user's reach — a trigger
that derives them from `auth.users`, or column grants. Independently of that,
a member should not be able to delete or take over other people's shared
questions: delete for the owner (and moderators), and an update check that
keeps `user_id`, `visibility` and `university_id` as they are for non-owners.
This extends the visibility item in section 2.

**AI commentary on private questions is readable by every signed-in user**
(verified). `ai_answer_comments` and `ai_commentary_summaries` have a `true`
read policy. 9,218 comments and 2,653 summaries belong to private questions,
and 4,534 of those comments carry a regenerated copy of the private question
text. The read policy should follow the question's own visibility (the
`questions` predicate, through the foreign key). This is separate from the
allowance question further down: that one is about free users, this one is
about other people's private content.

**Edge Functions that act for whoever calls them.** Six never verify the
caller (`getUser` appears in none of them), and the publishable key — public
by design — is enough to pass the platform's `verify_jwt` gate:

- `dispatch-next-ai-commentary-batch` and `reconcile-stuck-ai-commentary-jobs`:
  anyone can trigger paid AI batches (100 jobs per call, leases up to 24 h) or
  dead-letter jobs. Both list an `x-cron-secret` header in CORS and never read
  it (`dispatch:9`, `reconcile:9`).
- `process-pdf`: takes `userId` and `visibility` from the form
  (`process-pdf/index.ts:52`), so anyone can put questions into another user's
  account and university pool. `OCRUpload.tsx:158-181` posts the same ids
  straight to `api.altfragen.io` with no credential at all.
- `assign-subjects` and `reassign-subjects`: unauthenticated job creation with
  the service key, attributed to any user id; reassign is the admin panel's
  action and rewrites subjects across a university.
- `check-pdf-status`: an unencoded task id is put into the upstream URL
  (`:64,92`), reaching other paths on `api.altfragen.io`.
  Each needs the caller from the verified token (and `is_admin` for reassign),
  and the cron-called two a shared secret. This is the per-function
  authorization the API key migration needs anyway (last item).

**The backend's own endpoints are open as well** (_backend review_).
Authenticating the Edge Functions is not enough, because the backend can be
called directly, and its repository is public on GitHub and documents the
endpoints:

- **Uploads:** `POST /parser/upload` and `POST /ocr-service/process` have no
  authentication. They take the user id, `university_id` and `visibility`
  from the form and insert questions with a privileged key. Anyone can plant
  questions in any account, any university's pool, or the public pool. OCR
  also costs one or more Mistral calls per request, and it answers on
  plain-HTTP port 8002 as well.
- **AI runs:** `/ai/submit`, `/ai/run` and `/ai/consume` need no credential.
  Each call starts another background run, nothing stops runs from
  overlapping, and `/submit` and `/run` claim questions outside the queue.
- **Subject worker:** it does whatever a `subject_jobs` row says. A job with
  `university_id` null or `"all"` spans every university, private questions
  included, and `available_subjects[0]` is written verbatim whenever the
  model's answer is invalid.

The fix spans both sides:

- **Backend:** verify the Supabase JWT and take the user from it and the
  university from `profiles`; require a token or secret on the `/ai/*` and
  worker routes, compared in constant time, with a run lock; accept reassign
  jobs only from admins.
- **App:** `OCRUpload` and `process-pdf` send the user's token; pg_cron sends
  its token from Vault.
- **First step:** make the backend repository private until this ships.

**A third-party script runs on every page.** `index.html:53` loads
`https://cdn.gpteng.co/gptengineer.js` — Lovable's editor script — in
production, unpinned, with no integrity hash. It can read the Supabase session
from `localStorage`. There is no Content-Security-Policy and no
`frame-ancestors`, so the app can also be framed. Remove the script; add
`public/_headers`.

**Storage.** (verified)

- The `questions` bucket is **public** and holds 43 uploaded exam PDFs. OCR
  stores each one there to hand Mistral a URL, and never deletes it. 42 are
  named `ocr_temp_` plus 64 random bits, so they cannot be guessed, but any
  URL that leaks downloads (_backend review_). Nothing needs the bucket
  public: give Mistral a short-lived signed URL or the file inline, delete
  the file after OCR, make the bucket private, and remove the stored PDFs.
- `exam-images` (2,161 images, ~800 MB): any signed-in user may upload any
  file of any size and type, and read every image, including those of private
  questions.
- Policies grant public read and any upload on `question_attachments` and
  `question_images`, buckets that do not exist — they would apply the moment
  one is created. Drop them.

**Stripe webhook.** It returns 200 after swallowing failed writes — the
credit ledger (`stripe-webhook/index.ts:540-546`), the `subscribers` upsert,
`is_premium` — so Stripe never retries and a paid purchase can go missing. It
grants on `checkout.session.completed` without checking `payment_status`, and
handles no refund or dispute. Subscription events are applied from the payload
alone, so a late `active` after `deleted` re-grants access. The billing portal
finds the Stripe customer by e-mail (`customer-portal:45`); if "Confirm email"
is off in Supabase Auth, an unverified sign-up with someone else's address
opens their portal — check the setting.

**The VPS** (_backend review_).

- **Exposed ports:** Prometheus (port 9090, no authentication, lifecycle API
  on), Grafana (port 3000; the password defaults to `admin` if it was never
  set) and OCR (port 8002) listen on all interfaces. Docker bypasses ufw.
- **Memory:** request bodies are read whole into memory with no size limit at
  Caddy or in the parser, and the containers have no memory limits. One huge
  upload can exhaust the host, and there is no restart policy to bring it
  back.
- **Dependencies:** the parser pins FastAPI and Starlette versions with known
  denial-of-service CVEs (`pip-audit`: 51 advisories in 7 packages).
- **Containers:** all services get every secret and run as root, with their
  source mounted writable.
- **Fixes:** bind the ports to localhost, limit the body size and memory,
  restart unless stopped, upgrade, give each service its own env file, then
  rotate keys.

**Smaller.** A role `Hetzner VPS` has `BYPASSRLS`; nothing on the VPS logs in
with it, but the parser's `SUPABASE_KEY` probably carries it as its role
(inferred — decode the key's payload on the host), which would let that key
bypass RLS everywhere, not only on `exam-images`. The disposable-address
check runs only in the browser and fails open (`Auth.tsx:179-210`). Edge
Functions return raw error messages and log e-mail addresses. Admin-set
campaign URLs are opened without a scheme check (`CampaignBanner.tsx:93`).
Legacy anon JWTs are in the git history; they are public by design, but they
are what keeps the functions above callable until the legacy keys go.

### 2. Behaviour that is broken or loses data

**Profile updates have never worked** (verified). The `profiles` UPDATE policy
reads `profiles` in its own check, and Postgres rejects every update with
"infinite recursion detected in policy". So the browser's writes of
`is_email_verified` fail (harmlessly — a trigger keeps it), and so does the
sign-up form's marketing consent: since February, 64 of 516 new users ticked
it, and not one profile records it — it survives only in the sign-up
metadata, without a timestamp. Fix the policy (with the first security item),
then backfill from the metadata.

**Deleting an account half-deletes it.** `AccountService.ts:44-98` deletes
the user's questions — university-shared ones included, though the UI says
private — then progress, preferences and the profile, and then calls
`auth.admin.deleteUser` from the browser, which needs the service key and
fails. The user sees an error; the account remains without a profile.
Account deletion belongs in an Edge Function that authenticates the caller.

**Answers in saved sessions can be lost.** `recordAttempt`
(`TrainingSessionService.ts:241-327`) reads the row, then inserts or updates
`attempts_count + 1`; two tabs or quick answers race, and the caller swallows
every error by design (`QuestionDisplayWithAI.tsx:428-431`), so a failed save
is invisible while the session moves on. One database function with
`INSERT … ON CONFLICT DO UPDATE`, and a visible error. This is the write that
CLAUDE.md already calls the one that matters most and has no spec.

**The session runner loses questions.** `fetchQuestionDetails`
(`DatabaseService.ts:322-360`) wraps query builders in `Promise.allSettled`;
they never reject, so the 30% failure rule is dead and a failed batch drops up
to 300 questions with a log line. The runner indexes `question_ids` but
renders the loaded list, so after a gap it shows the wrong question and the
session never reaches `completed`. Its load effect also refetches on every
`updated_at` change and resets the index from a stale value, so quick clicks
on "Weiter" can jump back (`TrainingSessionRunner.tsx:28-40`).

**Rating a question's difficulty counts as answering it.** It inserts a
`user_progress` row with `attempts_count: 0` (`UserProgressService.ts:424`),
and the "new only" filters and dashboard counts treat any row as an answer.
The one-off training flow that used to write `user_progress` is unreachable
(`Training.tsx:27` reads a `localStorage` key nothing writes), so these rating
rows are now that table's only new writes.

**Uploads mix old and new.** After processing, the batch and OCR uploads
re-read "all my questions with this file name" (`BatchPDFUpload.tsx:142-146`),
so a re-upload of the same file shows old and new rows and the review
overwrites the old ones. The "batches of 20" start every request at once
(`:332-367`). After the AI subject job finishes, the review keeps the stale
subject in memory and saves it over the job's result.

**Search pages are wrong.** The same range is applied to each of three scope
queries and the results concatenated (`QuestionSearchService.ts:190-219`): a
page holds up to three pages' worth, the total is overstated, sorts have no
`id` tie-breaker, a failed scope vanishes silently, and its row mapping is a
hand copy without the case fields.

**Failures that look like data.** A failed progress read becomes "never
answered" (`UserProgressService.ts:141-146`), so a "new only" session includes
answered questions. A failed profile read leaves `universityId` null, so the
user silently sees only their own questions (`AuthContext.tsx:117`). A failed
subscription read downgrades a paying user to free, and the previous user's
entitlement survives a sign-out until the next read lands
(`SubscriptionContext.tsx:78-82,242-246`).

**Smaller.**

- Deleting an exam deletes its sessions and the exam in separate requests.
- Exams link to several exam names joined with `', '`, so a name containing a
  comma splits.
- Two quick preference changes overwrite each other
  (`UserPreferencesContext.tsx:50-62`).
- Saving a private note duplicates older notes into it
  (`CommentsSection.tsx:51-89`).
- "Ignore" on a question already marked unclear un-marks it.
- Exam analytics shows "NaN%" for an exam without questions.
- Exam days count as overdue from 02:00, because `due_date` is parsed as UTC
  midnight; "today" on the dashboard is UTC as well.
- Other authors' comments show as "Unbekannt", because their `profiles` rows
  are not readable.
- `/training/sessions` loads the whole dashboard data set for a dialog that
  never opens.

**Enforce visibility and `university_id` in the database.** Nothing on the
server keeps them consistent; `updateQuestion` does it in the client. A check
constraint — `(visibility = 'university') = (university_id is not null)` —
would make the rule hold for every writer. One question violates it today
(shared, without a university, from before the editor fix); it has to be
repaired or set back to private before the constraint can be added.
`process-pdf` can create more: it forwards `visibility = 'university'` without
a university when the profile lookup fails (`process-pdf/index.ts:75-81`). The
update policy's gap is now part of the first security item.

**`getFilterOptions` runs into the row cap.** `QuestionSearchService` builds
the search filters' subject and exam-name lists from full reads of the
`subject` and `exam_name` columns, unordered, in one request each — twelve
reads, ~96k rows for the large university to produce ~120 names. Past 20,000
rows options go missing at random. `list_question_subjects()` covers the
subjects as they are visible under RLS; the per-scope lists here want the same
treatment, or `listExamNameCounts`'s paged read.

**Decide which progress row wins.** Answers live in two tables: `user_progress`
(one row per question, written by one-off runs) and `session_question_progress`
(one row per session and question, written by saved sessions). A question can
have rows in both, and the codebase carries two rules for which one counts —
the session row always, or the most recent row. `ProgressPreference` in
`UserProgressService` now holds both, so the disagreement sits in one place
instead of five — but it is still a disagreement: of the 31.7k questions with
rows in both tables, 15.1k have a newer `user_progress` row, and the training
filters report the older session result for them. Picking one rule changes
numbers users see, so it wants a deliberate decision, not a refactor. The
rating rows above belong in the same decision.

**The AI commentary pipeline has stood still since 1 June.** A plan for it
is still to be made with the owner; this is where it stands (2026-10-03,
counts only):

- The dispatcher's cron job, `Process AI Comments` (every 10 minutes, calls
  `dispatch-next-ai-commentary-batch`), is inactive. Its last run, the last AI
  comment written and the last batch were all on 1 June; the last entry in the
  private quota ledger is from 19 May.
- 48,961 questions are `pending`, 402 `processing`, 1,418 `failed`, 28,405
  `completed`. The job queue holds 142 pending and 341 processing jobs, all
  untouched since 1 June, and 1,187 failed ones.
- **Stuck jobs eat users' quota.** `ai_private_full_used_30d` counts a private
  question's `processing` full job as used, with no time limit. 313 such jobs,
  from 12 December to 16 May, all with expired leases, count against 9 users
  for as long as they stay stuck. Recovering them is the reconciler's job
  (`reconcile-stuck-ai-commentary-jobs`), but no cron job calls it.
- **Why jobs get stuck** (_backend review_; the link to the 313 is
  inferred): the backend answers `/process-batch` with 202 before doing any
  work. So the dispatcher's rollback on a non-2xx reply only ever catches
  authentication errors, and rolling back on a timeout would be unsafe,
  because the batch may still run. Once questions are `processing`, nothing
  resets them when a provider submit throws, a batch ends `expired`, `FAILED`
  or `TIMEOUT_EXCEEDED`, or a model answers with an error. Every failure path
  in the backend has to reset the job, the quota count should count only
  live leases, and a one-off update has to release today's stuck rows.
- The reconciler's updates have no status or lease predicate, so a job
  re-claimed between its read and its write is reset and runs twice.
- A second cron job, `AI comments comsume` (every 7 minutes), is active: it
  posts to `https://api.altfragen.io/ai/consume`, without authentication and
  with a 1-second timeout, and gets 200 or 202. It polls open provider
  batches and writes their results: comments, statuses and quota
  (_backend review_). It answers 202 at once, so the timeout is harmless. It
  must keep running while any batch is open, but with a token.
- `ai_commentary_batch_jobs.status` mixes the providers' own vocabularies
  (`completed`, `failed`, `FAILED`, `JOB_STATE_FAILED`, `SUCCESS`,
  `TIMEOUT_EXCEEDED`, `expired`), so a status check against one of them misses
  the rest. The backend stores whatever state the provider reports. `SUCCESS`
  comes from code before November 2025, which marked successful Mistral
  batches that way without reading their results.
- **Other backend findings** (_backend review_):
  - Any error text containing `429`, `quota` or `billing` switches
    `feature_enabled` off for everyone. The flag is on today, so that is not
    why the pipeline stopped; the cron job is.
  - Comments and quota ledger rows are written read-then-write, so
    overlapping runs duplicate them. Unique keys are needed on
    `ai_answer_comments(question_id)` and the ledger.
  - The backend never writes `ai_commentary_summaries`. Its 19k rows come
    from elsewhere or from the past.
- `ai_commentary_claim_next_batch` is executable by the service role only
  (see Done). That is proven in the database, not by a live run, because the
  dispatcher has not run since. Both pipeline functions are callable by anyone
  (section 1).

**Decide whether the free AI-comment allowance should be enforced.** Today it
is a courtesy gate in the browser. The count is correct now, but its owner may
still write it — RLS lets a user insert and update their own usage rows — and
the comments it gates are readable by every signed-in user anyway. Enforcing
the limit would mean revoking those writes, leaving
`increment_ai_comment_usage` as the only way to count, and serving the comments
through something that checks the count. That changes what free users get, so
it is a product decision before it is a technical one.

### 3. Scaling

**The dashboard downloads every visible question and uses none of them.**
`Dashboard.tsx:84` takes only the loading and error flags from
`useDashboardData`, and shows its skeleton until all rows — 16 columns, full
question text, ~18–24 MB for a member of the large university — have arrived
in two serial requests. A read of `questions` with that column list is the
third-heaviest query in `pg_stat_statements` (35k calls, 227 ms mean) —
very likely this one. Drop it from the dashboard; the session dialog needs
six columns, or one database function that filters and picks ids.

**Questions are fetched by id, with every column, millions of times.** The
heaviest query in the database is `select questions.*` by id: 3.3 million
calls, ~7.5 hours of database time since the statistics were reset. It
matches `fetchQuestionDetails` (sessions, analytics) and the per-question
reads in training. Narrow the columns, page the session runner (the current
question ± a few), and stop re-downloading for the analytics page.

**Progress lookups scale with the question pool, not with the user.**
`UserProgressService.ts:127` asks by question id in 300-id batches, serially:
for 24k questions that is 80 batches and 160 requests, rerun on filter
changes. Read the user's progress by `user_id` instead.

**One 1.4 MB bundle for every page.** No route is lazy-loaded
(`App.tsx`, `MainLayout.tsx`): 1,397 kB raw, 398 kB gzip, admin pages
included, for a visitor of the landing page. With lazy routes the entry chunk
measured 105 kB gzip. Add a reload on `vite:preloadError`, since
`_redirects` answers a missing chunk with HTML.

**Smaller.**

- **Dashboard statistics:** four of its ten reads duplicate others, are
  unpaged, and are counted in the browser. One counting function would do.
- **Exam analytics:** `includes` and `find` sit inside loops
  (`ExamAnalytics.tsx:143,169`), about 2.7 s at 5,000 questions.
- **Training:** each question costs about ten requests. They include a
  network `getUser()` and a storage `list` search per image.
- **Service worker:** it caches every bundle forever under one name, network
  first, so it grows by ~1.4 MB per deploy and never speeds anything up.
- **Startup:** `AuthContext` adds a network `getUser()` and `useAuthGuard` a
  fixed 100 ms before the app renders. The context values are not memoized.
- **Images:** the landing poster is a 505 kB PNG.

**Stop `AuthContext` announcing the same user over and over.** It sets `user`
from `getSession()` and again on every auth event, each time as a new object,
so every effect keyed on `user` reruns for a user who has not changed. On a new
user's first visit that came to seven `profiles` reads, five reads of each
progress table, four preference loads and four `subscribers` reads within one
minute. The preference insert has been made safe against it (see Done);
the redundant reads remain. Keying the effects on `user?.id`, or having the
context keep its `user` while the id is unchanged, would end them — but this
is the root of auth state, so it wants its own change and a careful look at
what `USER_UPDATED` must still refresh.

### 4. Lovable leftovers and maintainability

**Lovable artefacts.** The `gptengineer.js` script (security, above) and the
`lovable-tagger` dev plugin (`vite.config.ts:4,13`). The manifest and
`index.html` reference images that do not exist (`/Screenshot_*.png`,
`/og-image.png`).

**Dead code.**

- **Unreachable:** `PDFUpload.tsx` (no tab opens it, and it would send
  the file as `pdf` where `process-pdf` reads `file`), and the one-off
  training flow (`Training.tsx`, `recordAnswerAttempt`).
- **Not called:** `AIAnswerCommentaryService.triggerProcessing` (it invokes a
  function that does not exist), `getProcessingStats`,
  `updateQuestionVisibility`, and the Edge Function
  `ai-comment-credits-status`, which has no caller.
- **Legacy writes:** the webhook still writes the legacy
  `user_private_ai_quota` counter.

**Unused dependencies.**

- No imports at all: `@radix-ui/react-toast`, `baseline-browser-mapping` and
  `caniuse-lite` (tooling, listed under `dependencies`), and `@types/papaparse`
  (also under `dependencies`).
- Reachable only from 14 unused `components/ui` files: `recharts`, `vaul`,
  `input-otp`, `next-themes`, `react-resizable-panels`.

**Remove the exam reconstruction's leftovers.** Thirteen `exam_recon_*`
functions remain in `public`, nine of them `SECURITY DEFINER`, but the tables
they work on exist in no schema, so every call fails. Nobody can call them any
more (see Done); dropping them, and anything else of that feature still in
the database, is a cleanup of its own. Twelve indexes have never been used
(performance advisor); review them at the same time.

**TypeScript is not strict.** `strict`, `strictNullChecks` and `noImplicitAny`
are off (`tsconfig.app.json:18-21`, `tsconfig.json:9-14`). Most defects in
section 2 are of the kind `strictNullChecks` reports — a field read from a
response that may be null, an error that is never looked at. Turn it on per
directory, services first, with the same ratchet as lint.

**No safety nets.** No error boundary, so one render error blanks the app.
Unknown routes silently redirect to the dashboard. No global query error
handler. About 20 components still fetch in `useEffect` instead of TanStack
Query.

**Edge Functions on old foundations.** `supabase-js@2.7.1`, `std@0.168.0` and
an `xhr` polyfill in `assign-subjects`, `reassign-subjects` and `process-pdf`;
`// @ts-nocheck` on the dispatcher and the reconciler.

**Split the large files.** `ExamCohortComparisonSection.tsx` (~1200 lines),
`QuestionDisplayWithAI.tsx` (~1100), `pages/Auth.tsx` (~880),
`admin/CampaignManagement.tsx` (~890), `pages/ExamAnalytics.tsx` (~660), and
three upload components (`PDFUpload`, `BatchPDFUpload`, `OCRUpload`, ~1,800
lines together) that each do the same thing their own way. Safer now that CI
exists, but still its own change rather than part of a feature.

**More tests.** The harness exists and the riskiest logic is covered (see
Done). Still uncovered: the writes of `TrainingSessionService` —
`recordAttempt` decides what a session answer counts as, and only its reads
have specs — and the webhook's persistence half — the entitlement decisions are
tested, what they get written into is not. A Playwright smoke
test over login → training session → answer would cover the path most likely
to break silently, and needs a browser harness this repo does not have yet.

**A real logger.** 244 `console.*` calls; some log e-mail addresses and user
objects (`Auth.tsx:193,318`).

**Finish the API key migration.** The outbound half is done. Who may _call_ an
Edge Function is still the platform's `verify_jwt` gate, which understands
legacy JWTs only, so the legacy keys cannot be disabled yet. Doing so means
`verify_jwt = false` plus per-function authorization — Supabase's
`@supabase/server` SDK is built for this. It touches the checkout and webhook
endpoints, so tests should come first. Section 1's unauthenticated functions
are the same work.

## How the lint ratchet works

Because it governs every change from here: `npm run lint` allows zero errors and
caps warnings at a fixed number in `package.json`. Cleaning violations up lets
the cap come down — **lower it in the same commit**, or the slack invites new
ones. A rule that reaches zero moves from `RATCHET` to `ENFORCED` in
`eslint.config.js` and becomes an error. `no-unused-vars` has already made that
trip.

## How a slice is verified

A green `npm run verify` shows that the code compiles and the specs pass. It
does not show that a move kept behaviour, or that the specs would notice if it
had not. Every slice so far was checked in the ways below, and its PR said which
applied — keep that bar.

- **Specs that can fail.** Once a service's specs pass, break the service on
  purpose, one plausible mistake at a time — `??` turned into `||`, a filter
  dropped, a column left out of a write — and run the specs again. Each
  mistake must fail them; one that passes means a spec is missing. Restore the
  file after each. Watch for mutations that pass by coincidence: a spec that
  uses today's date cannot tell a passed-in `date` from `usageDate()`.
- **Types that are real.** With `noImplicitAny` off, a value can be `any`
  without anything saying so, and a green typecheck proves little. Put a probe
  where a type should hold — read a column that does not exist, assign a
  result to the wrong type — run `npm run typecheck`, see it fail, and remove
  the probe.
- **Parity against production data.** When a move rewrites mapping logic, copy
  the old logic verbatim into a throwaway spec and compare old and new over
  every distinct combination of stored values: a `select distinct` over the
  columns involved, not the rows themselves. Neither the spec nor the data is
  committed.
- **Evidence before a claim.** When a change fixes something users see, show
  that it happens: the API logs (`query_logs` on `edge_logs`, by path, method
  and status) show requests and failures per user to the millisecond. Report
  counts and patterns, never the personal data around them.
- **Database changes tried before they ship.** Run a new function or policy
  first inside a `DO` block that switches to the `authenticated` role
  (`set local role authenticated`, claims via
  `set_config('request.jwt.claims', …)`), includes a control that must be
  refused, and ends in `raise exception` so that everything rolls back. Only
  then, and only with the owner's go-ahead, apply it as a named migration
  (`apply_migration`), regenerate `types.ts`, and repeat the check against the
  deployed version. The repository keeps no migration files, so the SQL goes
  into the commit message. A frontend that calls a new function must not reach
  `main` before the function exists: the merge deploys it.
- **Say what was not covered.** There is no harness for React, so a change to
  a component, hook or context is verified by reading it. Write that in the
  PR rather than let a green run imply more.
