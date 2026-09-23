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

**There are tests.** vitest runs from `npm run test`, inside `npm run verify`
and in CI. 107 specs cover the places where a mistake is both plausible and
invisible: the Stripe entitlement decisions, the user progress merge and
answer recording, the cohort scoring, the profile and university reads, and
the AI commentary settings.
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

## In progress: data access into services

12 files outside `src/services/` still query Supabase directly. This is the
root cause of the type drift above — scattered queries each grew their own
casts and their own row mapping.

Count them with a pattern that sees through a cast: `supabase.from(` alone
misses `(supabase as any).from(`, and a file whose only direct query is written
that way drops out of the count while still querying. The count above uses
`\(?supabase( as any\))?[[:space:]]*\.from\(`, which agrees with the old
pattern on every earlier figure.

Suggested slices, roughly in order of value:

1. ~~**`user_progress`**~~ — done, see above.
2. ~~**`profiles` / `universities`**~~ — done, see above.
3. ~~**`ai_commentary_settings`**~~ — done, see above.
4. **Contexts** — `UserPreferencesContext`, `SubscriptionContext`.

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

## Not started

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

**Split the large files.** `ExamCohortComparisonSection.tsx` (~1300 lines),
`QuestionDisplayWithAI.tsx` (~1100), `pages/Auth.tsx` (~920),
`admin/CampaignManagement.tsx` (~890), `pages/ExamAnalytics.tsx` (~830). Safer
now that CI exists, but still its own change rather than part of a feature.

**More tests.** The harness exists and the riskiest logic is covered (see
Done). Still uncovered: `TrainingSessionService`, which writes session
progress, and the webhook's persistence half — the entitlement decisions are
tested, what they get written into is not. A Playwright smoke
test over login → training session → answer would cover the path most likely
to break silently, and needs a browser harness this repo does not have yet.

**A real logger.** ~270 `console.*` calls.

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
