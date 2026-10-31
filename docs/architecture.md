# Architecture

How Altfragen.io fits together across its two repositories. This page is the
map; details live in the documents it links to. Written 2026-10-31.

## Parts

| Part                                    | Runs on                                                              | Repository                         | Deploys                                                        |
| --------------------------------------- | -------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| React SPA (`src/`)                      | Netlify, `altfragen.io`                                              | this one                           | automatically from `main`                                      |
| Edge Functions (`supabase/functions/`)  | Supabase (Deno)                                                      | this one                           | by hand: `supabase functions deploy <name>` or the MCP server  |
| Postgres, Auth, Storage, pg_cron, Vault | Supabase project `ynzxzhpivcmkpipanltd`                              | this one owns the schema           | as named migrations via the MCP server (`CLAUDE.md`)           |
| Parser, OCR, subject worker, AI backend | Hetzner VPS behind Caddy, `api.altfragen.io` (proxied by Cloudflare) | `jeskokaiser/altfragen-io-backend` | by hand on the VPS: `git pull`, `docker compose up -d --build` |
| Prometheus and Grafana                  | same VPS, `metrics.altfragen.io`                                     | backend                            | as above                                                       |

External services: Stripe (payments), OpenAI, Google Gemini, Mistral,
Perplexity and DeepSeek (AI commentary), Mistral OCR, OpenAI (subject
assignment).

Merging is not deploying: each row deploys on its own, and only the owner
deploys the backend and the Edge Functions.

## Flows

**PDF/DOCX upload.** The browser calls `process-pdf`, which forwards the file
and the user's token to `POST /parser/upload`. `check-pdf-status` polls
`GET /parser/status/{task_id}`. The parser writes `questions` and images to the
`exam-images` bucket.

**OCR upload.** The browser calls `POST /ocr-service/process` directly with the
user's token. The OCR service sends the file to Mistral OCR and inserts the
questions.

**Subjects.** `assign-subjects` (the user's own questions) and
`reassign-subjects` (admins) create `subject_jobs` rows and call the subject
worker, which also polls every 60 s and writes `questions.subject`.

**AI commentary** is a batch pipeline:

1. Questions wait in `ai_commentary_job_queue`.
2. pg_cron calls `dispatch-next-ai-commentary-batch`, which leases jobs and
   posts them to `POST /ai/process-batch`.
3. The AI backend submits provider batches (OpenAI, Gemini, Mistral) or calls
   providers directly (Perplexity, DeepSeek).
4. pg_cron calls `POST /ai/consume` every 7 minutes; results land in
   `ai_answer_comments` and `ai_commentary_summaries`.
5. `reconcile-stuck-ai-commentary-jobs` returns jobs whose lease expired.

**Payments.** `create-checkout` (monthly, semester), `create-lifetime-checkout`
and `create-ai-credits-checkout` open Stripe Checkout; `customer-portal` opens
the Stripe portal. Stripe reports back to `stripe-webhook`, the source of truth
for entitlements in `subscribers`. It must deploy with `verify_jwt = false`.

**Sign-up.** `validate-email` rejects disposable addresses. The university
comes from an exact match of the email domain.

## Who calls whom, and with what

The interface between the app and the backend — headers, tokens, job
statuses, storage — is the contract in
[`docs/cross-repo-plan.md`](cross-repo-plan.md) (C1–C6), copied unchanged into
the backend as `docs/app-contract.md`. Neither side changes it alone.

## Where documentation lives

| Topic                                                     | Document                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| App conventions, domain rules, landmines                  | `CLAUDE.md` (this repo)                                                            |
| App cleanup: done and still open                          | `docs/modernisation.md`                                                            |
| App/backend contract and phased plan                      | `docs/cross-repo-plan.md`                                                          |
| Backend services, CI, VPS facts                           | `CLAUDE.md` in the backend repo                                                    |
| Backend security review and host audit (2026-10)          | `docs/security-review-2026-10.md`, `docs/vps-audit-2026-10.md` in the backend repo |
| Company matters: legal, tax, providers, pricing decisions | the owner's private notes, not these repositories                                  |
