# Altfragen.io

Exam-prep app for German medical students: upload past exam questions, train
against them, get AI commentary on the answers. React SPA on Supabase.

Cursor reads this file too (`AGENTS.md` is a symlink to it). Keep it accurate --
when a convention here stops matching the code, fix one or the other, and say
which in the commit message.

## Commands

```bash
npm ci               # install (not npm install -- see Lock file below)
npm run dev          # vite dev server on :8080
npm run verify       # typecheck + lint + format:check + build -- what CI runs
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

**New database access goes through `src/services/`.** This is the direction of
travel, not the current state: 29 files outside `src/services/` query Supabase
directly today -- pages, components, hooks and contexts alike. So expect to
find queries in components, but don't add more. When you touch a component that
queries directly and the change is small, moving that query into a service is a
welcome drive-by; when it isn't, leave it.

**`src/integrations/supabase/types.ts` is generated.** Regenerate it after any
schema change -- via the Supabase MCP server's `generate_typescript_types`, or
`npx supabase gen types typescript --project-id ynzxzhpivcmkpipanltd`. It had
drifted for months once: the app compiled, and the drift surfaced as `as any`
casts and columns silently read as `undefined` at runtime. If a column looks
absent from the types, regenerate before reaching for a cast.

**Don't add `as any` to silence the compiler.** It is how the drift above stayed
invisible. Fix the type, or regenerate.

**Never hand-edit `package-lock.json`.** Change dependencies with `npm install`.

## The lint ratchet

`npm run lint` passes with zero errors and caps warnings at a fixed number
(`--max-warnings` in `package.json`). That number is the count of pre-existing
violations still to be cleaned up, listed as `RATCHET` in `eslint.config.js`.

So: a new violation pushes the count over the cap and fails CI. Cleaning up
old ones lets the cap be lowered -- **lower it in the same commit as the
cleanup**, otherwise the slack invites new violations. When a RATCHET rule
reaches zero, move it to `ENFORCED` (`"error"`) so it can never come back.

`no-unused-vars` has already made that trip: it is an error everywhere, with no
exceptions. Still in RATCHET: `no-explicit-any` (181) and `ban-ts-comment` (8),
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

**Questions** are `src/types/Question.ts`. Note the DB uses snake_case
(`option_a`, `exam_year`) while the domain type is camelCase (`optionA`) --
services do the mapping. `question_case` is an **integer** case-group number,
not a string.

**Training sessions** (`training_sessions`, `session_question_progress`) back
the `/training/session/*` routes via `TrainingSessionService`. A one-off run
and a saved session share the same runner.

**AI commentary** is a batch pipeline, not a request/response call: questions
are queued (`ai_commentary_job_queue`), dispatched to providers in batches
(`dispatch-next-ai-commentary-batch`), and a reconciler
(`reconcile-stuck-ai-commentary-jobs`) recovers jobs that hang. Results land in
`ai_answer_comments` / `ai_commentary_summaries`. Multiple models per question.

**Monetisation** is Stripe: subscription, lifetime, and consumable AI credits,
with `stripe-webhook` as the source of truth for entitlements. Free users get a
limited AI-comment allowance (`usePremiumFeatures`, `user_ai_comment_usage`).

**There are no push notifications.** IMPPulse was removed, together with its
page, service worker handlers and four Edge Functions. The `push_subscriptions`
and `broadcast_logs` tables still exist and still hold rows; nothing reads or
writes them. Don't build on them without deciding their fate first.

## Landmines

- **No tests.** There is no safety net beyond typecheck and build. Changes to
  `stripe-webhook` (entitlements), `TrainingSessionService` (progress) and
  `utils/cohortScoring.ts` carry real risk -- say so rather than assuming a
  green build means correct.
- **Some files are very large**: `ExamCohortComparisonSection.tsx` (~1300
  lines), `QuestionDisplayWithAI.tsx` (~1100), `pages/Auth.tsx` (~920),
  `admin/CampaignManagement.tsx` (~890), `pages/ExamAnalytics.tsx` (~830).
  Splitting them is welcome as its own change, not smuggled into a feature.
- **`console.*` is used for logging throughout** (~300 calls). Don't add more;
  a real logger is a pending cleanup.
- **Edge Functions are Deno**, not Node -- different globals, URL imports, and
  they deploy separately from the frontend.

## Conventions

German UI strings, English code and comments. Commit messages: imperative
subject, and a body explaining _why_ when the reason isn't obvious from the
diff. Keep changes reviewable -- one concern per commit.
