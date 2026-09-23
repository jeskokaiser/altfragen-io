# Altfragen.io

Exam-prep app for German medical students: upload past exam questions, train
against them, get AI commentary on the answers. React SPA on Supabase.

Cursor reads this file too (`AGENTS.md` is a symlink to it). Keep it accurate --
when a convention here stops matching the code, fix one or the other, and say
which in the commit message.

This file is the conventions. `docs/modernisation.md` is the plan: what has been
cleaned up, what is next, and why. Read it before starting a larger change, and
update it when you finish one.

## Commands

```bash
npm ci               # install (not npm install -- see Lock file below)
npm run dev          # vite dev server on :8080
npm run test         # vitest; specs live next to the code as *.test.ts
npm run verify       # the whole gate: typecheck, test, lint, format, build
```

Run `npm run verify` before proposing a change. It is the same gate as
`.github/workflows/ci.yml`, so a green run locally means a green run in CI.
`npm run format` fixes formatting, `npm run lint:fix` the autofixable lint.

## Stack

Vite 7, React 18, TypeScript, Tailwind + shadcn/ui, React Router 6,
TanStack Query, Supabase (Postgres, Auth, Storage, Edge Functions), Stripe.

## Layout

```
src/pages/          route components (one per screen)
src/components/     feature folders: training/, exams/, admin/, questions/, ...
src/components/ui/  vendored shadcn primitives -- keep close to upstream
src/services/       where database access belongs (see Rules)
src/hooks/          data + UI hooks, mostly TanStack Query wrappers
src/contexts/       Auth, Subscription, Theme, UserPreferences
src/types/          hand-written domain types
src/integrations/supabase/types.ts   GENERATED -- never hand-edit
supabase/functions/ Deno Edge Functions (Stripe, PDF ingest, AI batches)
```

Routes are split: public ones in `src/App.tsx`, everything behind auth in
`src/components/layout/MainLayout.tsx`.

## Rules

**Database access goes through `src/services/`.** Still the direction of travel
rather than the finished state: 13 files outside `src/services/` query Supabase
directly -- pages, components, hooks and contexts alike. So expect to find
queries in components, but don't add more. When you touch one and the change is
small, moving that query into a service is a welcome drive-by.

Rows coming out of `questions` are mapped to the domain type by
`src/services/questionRowMapper.ts`. Use it rather than writing the snake_case
to camelCase translation again -- it used to be copied by hand at ten call
sites, each with its own subset of fields and its own defaults.

**`src/integrations/supabase/types.ts` is generated.** Regenerate it after any
schema change -- via the Supabase MCP server's `generate_typescript_types`, or
`npx supabase gen types typescript --project-id ynzxzhpivcmkpipanltd`. It had
drifted for months once: the app compiled, and the drift surfaced as `as any`
casts and columns silently read as `undefined` at runtime. If a column looks
absent from the types, regenerate before reaching for a cast.

**Don't add `as any` to silence the compiler.** It is how the drift above stayed
invisible. Fix the type, or regenerate. An existing cast commented "until the
types include ..." is usually stale -- the types were regenerated -- so check
before keeping one. And removing an annotation is not the same as typing: with
`noImplicitAny` off, a parameter that cannot be inferred silently stays `any`.

**Never hand-edit `package-lock.json`.** Change dependencies with `npm install`.

**API keys.** The browser client uses the publishable key (`sb_publishable_...`),
not the legacy anon JWT. Edge Functions read their outbound key through
`supabase/functions/_shared/supabaseKeys.ts`, which prefers the new
`SUPABASE_SECRET_KEYS` / `SUPABASE_PUBLISHABLE_KEYS` bundles and falls back to
the legacy `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`. Use those helpers
rather than reading the environment directly.

That covers outbound keys only. Who may _call_ a function is still the
platform's `verify_jwt` gate, which understands legacy JWTs only, so callers
(cron jobs, database webhooks, the client) must keep sending a legacy key until
each function authorizes requests itself. Disabling the legacy keys is
therefore a separate piece of work, not a flip of a switch.

## The lint ratchet

`npm run lint` passes with zero errors and caps warnings at a fixed number
(`--max-warnings` in `package.json`). That number is the count of pre-existing
violations still to be cleaned up, listed as `RATCHET` in `eslint.config.js`.

So: a new violation pushes the count over the cap and fails CI. Cleaning up
old ones lets the cap be lowered -- **lower it in the same commit as the
cleanup**, otherwise the slack invites new violations. When a RATCHET rule
reaches zero, move it to `ENFORCED` (`"error"`) so it can never come back.

`no-unused-vars` has already made that trip: it is an error everywhere, with no
exceptions. Still in RATCHET: `no-explicit-any` (150) and `ban-ts-comment` (8),
plus `react-hooks/exhaustive-deps` and `react-refresh/only-export-components`,
which warn by design.

## Lock file

npm only. `bun.lockb` was removed -- the two lock files had drifted apart and
`npm ci` refused to install. A text lock file also produces reviewable diffs
and merge conflicts an agent can resolve, which the binary one does not.

## Domain

**Question visibility** is `private | university | public`. `university_id` is
set only when visibility is `university`, and cleared otherwise -- the two
fields must stay consistent or questions leak across universities. RLS enforces
this server-side; keep the client in step.

**Universities** come from the user's profile (`AuthContext` exposes
`universityId`). Shared questions and public comments are scoped to it.
`ProfileService` and `UniversityService` own the two tables. A university is
matched to a sign-up by an **exact** email domain; a suffix match was tried once
and put people into universities they did not belong to.

**Questions** are `src/types/Question.ts`. Note the DB uses snake_case
(`option_a`, `exam_year`) while the domain type is camelCase (`optionA`) --
services do the mapping. `question_case` is an **integer** case-group number,
not a string.

**Training sessions** (`training_sessions`, `session_question_progress`) back
the `/training/session/*` routes via `TrainingSessionService`. A one-off run
and a saved session share the same runner, but not the same table: a one-off run
records into `user_progress`, a session into `session_question_progress`. Reading
a user's progress therefore means merging both, which is what
`UserProgressService` is for -- including the choice of which row wins when a
question has both (`ProgressPreference`, see `docs/modernisation.md`).

**AI commentary** is a batch pipeline, not a request/response call: questions
are queued (`ai_commentary_job_queue`), dispatched to providers in batches
(`dispatch-next-ai-commentary-batch`), and a reconciler
(`reconcile-stuck-ai-commentary-jobs`) recovers jobs that hang. Results land in
`ai_answer_comments` / `ai_commentary_summaries`. Multiple models per question.

**Monetisation** is Stripe: subscription, lifetime, and consumable AI credits,
with `stripe-webhook` as the source of truth for entitlements. Free users get a
limited AI-comment allowance (`usePremiumFeatures`, `user_ai_comment_usage`).
The limits themselves -- free sessions, free daily comments, whether the
lifetime offer is showing -- are one admin-edited row, `ai_commentary_settings`.
Read it through `useAICommentarySettings`, which shares one cached query and
one set of fallbacks; do not read the row directly.

**There are no push notifications.** IMPPulse was removed in full: the page,
the service worker handlers, four Edge Functions, and the `push_subscriptions`
and `broadcast_logs` tables.

## Landmines

- **Thin test coverage.** There are specs for the Stripe entitlement decisions
  (`stripe-webhook/entitlements.ts`), `utils/cohortScoring.ts`, and the
  services that own `user_progress`, `profiles`, `universities` and
  `ai_commentary_settings` -- those through the Supabase double in
  `src/test/supabaseDouble.ts`. React and
  Stripe itself are uncovered, and so is `TrainingSessionService` (progress),
  which matters most. Say what a change was actually verified against rather
  than assuming a green run means correct.
- **Some files are very large**: `ExamCohortComparisonSection.tsx` (~1300
  lines), `QuestionDisplayWithAI.tsx` (~1100), `pages/Auth.tsx` (~920),
  `admin/CampaignManagement.tsx` (~890), `pages/ExamAnalytics.tsx` (~830).
  Splitting them is welcome as its own change, not smuggled into a feature.
- **`console.*` is used for logging throughout** (~270 calls). Don't add more;
  a real logger is a pending cleanup.
- **Edge Functions are Deno**, not Node -- different globals, URL imports, and
  they deploy separately from the frontend.

## Conventions

German UI strings, English code and comments. Commit messages: imperative
subject, and a body explaining _why_ when the reason isn't obvious from the
diff. Keep changes reviewable -- one concern per commit.
