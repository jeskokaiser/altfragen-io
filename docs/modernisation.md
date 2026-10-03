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

**Make the per-user database functions check who is asking.**
`ai_private_full_used_30d`, `ai_private_credits_remaining` and
`get_exam_cohort_stats` take the user as a parameter, run as
`SECURITY DEFINER` — so RLS does not apply — and are executable by `anon`.
None compares the parameter with `auth.uid()`: anyone holding the
publishable key, signed in or not, can ask for any user's AI credit balance
and quota use, and for their answered and correct counts on an exam (checked
under the `anon` role, with random ids). User ids are not secret: any
signed-in user can read the author's on every question shared with them. The fix is a guard in each function —
`p_user_id = auth.uid()`, or the service role, which
`ai-comment-credits-status` calls them with — and revoking `anon`. A schema
change, so it waits for the owner.

**Enforce visibility and `university_id` in the database.** Nothing on the
server keeps them consistent; `updateQuestion` does it in the client. A check
constraint — `(visibility = 'university') = (university_id is not null)` —
would make the rule hold for every writer. One question violates it today
(shared, without a university, from before the editor fix); it has to be
repaired or set back to private before the constraint can be added. The
update policy has a gap of its own worth a look at the same time: any
verified member of a university may update any of its shared questions,
visibility included.

**`getFilterOptions` runs into the row cap.** `QuestionSearchService` builds
the search filters' subject and exam-name lists from full reads of the
`subject` and `exam_name` columns, unordered, in one request each. For the
large university those reads pass 20,000 rows, so options can go missing at
random. `list_question_subjects()` covers the subjects as they are visible
under RLS; the per-scope lists here want the same treatment, or
`listExamNameCounts`'s paged read.

**Decide which progress row wins.** Answers live in two tables: `user_progress`
(one row per question, written by one-off runs) and `session_question_progress`
(one row per session and question, written by saved sessions). A question can
have rows in both, and the codebase carries two rules for which one counts —
the session row always, or the most recent row. `ProgressPreference` in
`UserProgressService` now holds both, so the disagreement sits in one place
instead of five — but it is still a disagreement: of the 31.7k questions with
rows in both tables, 15.1k have a newer `user_progress` row, and the training
filters report the older session result for them. Picking one rule changes
numbers users see, so it wants a deliberate decision, not a refactor.

**Decide whether the free AI-comment allowance should be enforced.** Today it
is a courtesy gate in the browser. The count is correct now, but its owner may
still write it — RLS lets a user insert and update their own usage rows — and
the comments it gates are readable by every signed-in user anyway
(`ai_answer_comments` and `ai_commentary_summaries` have a `true` read
policy). Enforcing the limit would mean revoking those writes, leaving
`increment_ai_comment_usage` as the only way to count, and serving the comments
through something that checks the count. That changes what free users get, so
it is a product decision before it is a technical one.

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

**Split the large files.** `ExamCohortComparisonSection.tsx` (~1300 lines),
`QuestionDisplayWithAI.tsx` (~1100), `pages/Auth.tsx` (~920),
`admin/CampaignManagement.tsx` (~890), `pages/ExamAnalytics.tsx` (~710). Safer
now that CI exists, but still its own change rather than part of a feature.

**More tests.** The harness exists and the riskiest logic is covered (see
Done). Still uncovered: the writes of `TrainingSessionService` —
`recordAttempt` decides what a session answer counts as, and only its reads
have specs — and the webhook's persistence half — the entitlement decisions are
tested, what they get written into is not. A Playwright smoke
test over login → training session → answer would cover the path most likely
to break silently, and needs a browser harness this repo does not have yet.

**A real logger.** ~255 `console.*` calls.

**Finish the API key migration.** The outbound half is done. Who may _call_ an
Edge Function is still the platform's `verify_jwt` gate, which understands
legacy JWTs only, so the legacy keys cannot be disabled yet. Doing so means
`verify_jwt = false` plus per-function authorization — Supabase's
`@supabase/server` SDK is built for this. It touches the checkout and webhook
endpoints, so tests should come first.

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
