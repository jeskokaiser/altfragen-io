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

## In progress: data access into services

26 files outside `src/services/` still query Supabase directly. This is the
root cause of the type drift above — scattered queries each grew their own
casts and their own row mapping.

Suggested slices, roughly in order of value:

1. **`user_progress`** — seven files read answers and difficulty; no service
   owns the table. `DatabaseService` already has `fetchUserDifficulty` and
   `fetchUserDifficultiesForQuestions` to build on.
2. **`profiles` / `universities`** — five files, no service. `AuthContext`,
   `pages/Auth.tsx`, `useAdminRole`, `SubjectReassignmentPanel`, `Dashboard`.
3. **`ai_commentary_settings`** — four files read it directly.
4. **Contexts** — `UserPreferencesContext`, `SubscriptionContext`.

Expect `no-explicit-any` to fall as this proceeds: most of the remaining 177
sit on or near these queries.

## Not started

**Split the large files.** `ExamCohortComparisonSection.tsx` (~1300 lines),
`QuestionDisplayWithAI.tsx` (~1100), `pages/Auth.tsx` (~920),
`admin/CampaignManagement.tsx` (~890), `pages/ExamAnalytics.tsx` (~830). Safer
now that CI exists, but still its own change rather than part of a feature.

**Tests.** There are none, which makes this the largest remaining risk.
`stripe-webhook` is 630 lines deciding entitlements with no coverage at all.
Start there, then `TrainingSessionService` (progress) and
`utils/cohortScoring.ts`. A Playwright smoke test over login → training session
→ answer would cover the path most likely to break silently.

**A real logger.** ~285 `console.*` calls.

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
