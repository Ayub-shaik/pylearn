SDLC — PyLearn (Online Python Learning App, Web-First, Account-Based)

Targets: Web (account-based, mobile-browser-first) now -> Native mobile (Play Store, React Native or native Kotlin/Swift — NOT a WebView) later, as an explicitly separate phase.
Principles: Retrieval-first / curated-content-first for LLM use, offline/anonymous mode as a secondary fallback (not the headline story), component reuse, additive phases, no revamps. A small self-hosted LLM runs behind our backend — no paid cloud API keys required for the core product.
Tracking: Convert checklist items to GitHub Issues. Use the labels & IDs provided.

Legend

[] = To do [~] = In progress [x] = Done

Labels: phase:X, area:core|ui|llm|speech|web|api|infra|content, type:feat|chore|fix|docs|test, prio:P1|P2|P3

Phase 0 — Repo, Conventions, Ground Rules

Exit Criteria

Monorepo scaffolding decided (now including `apps/api`), coding standards documented, CI sanity checks green.

Checklists

P0.1 Repo Hygiene & Conventions

[x] Adopt commit style: Conventional Commits (doc in /docs/contrib.md).

[x] Define branching: main (protected), feat/_, fix/_, chore/\*.

[] Add issue labels (list above).

[x] Add PR template (.github/pull_request_template.md).

[x] Add Issue templates: Feature, Bug, Content, Task.

P0.2 Tooling

[x] Choose package manager: pnpm workspaces.

[x] Root package.json with workspaces (now spans apps/web + apps/api).

[x] Add Prettier + ESLint configs.

[x] Husky + lint-staged pre-commit hook (lint, typecheck).

[] Basic CI: Node setup, pnpm i, pnpm -w build, pnpm -w test.

P0.3 Monorepo Layout

pylearn/
apps/
web/ # React + Vite + TS SPA
api/ # Fastify + TS backend: accounts, sessions, LLM proxy
android/ # placeholder for the later, separate native mobile phase
packages/
core/ # Domain logic: lesson graph, adaptive engine, scoring, hinting, mastery — reused by both apps/web and apps/api
llm/ # Shared LLM types + probeOllama detection helper (actual generation logic lives in apps/api)
speech/ # ASR/TTS wrappers (future)
ui-kit/ # Reusable UI components (cards, quiz widgets, code runner, progress bars)
data/ # Lesson content, quizzes, explanations (versioned JSON/MD) — server-owned source of truth
infra/
nginx/ # Reverse proxy config (serves web static bundle, proxies /api to the api service)
docker-compose.yml # web + api + db (Postgres); host Ollama reused as-is, not containerized
scripts/ # Dev scripts, content validators

[x] Create directories + placeholder README.md in each.

[x] Add CODEOWNERS scoped by folder.

Acceptance Tests

[] pnpm -w -v works; pnpm -w install succeeds.

[] CI passes lint + typecheck stubs.

Phase 1 — Curriculum & UX Specification

Exit Criteria

Lesson schema approved, "Python Basics" track outlined, UX flows frozen.

Checklists

P1.1 Curriculum Definition

[] Define topic map: Variables, Types, I/O, Control Flow, Functions, Lists, Dicts, Loops, Errors, Modules.

[x] Author Curriculum JSON Schema (lesson → checkpoints).

[x] Content lint rules (IDs stable, unique; length bounds; hint presence).

[] Draft 10+ lessons (skeleton only, no final copy).

[x] Define checkpoint types: note, quiz-mcq, fill-blank, code-cell.

P1.2 UX Flows & Copy

[] Flow: Lesson → mini-challenge → hints → explanation → mastery tick.

[] "Teacher voice" script guidelines (tone, "Okay, let's put you to the test." moments).

[] Error states & stuck handling (3 hints → reveal → micro-lesson).

[] Accessibility notes (keyboard nav, captions, contrast).

P1.3 Data Privacy

[x] Decide storage model: signed-in users persist server-side (Postgres) as the default; anonymous users fall back to local-only (IndexedDB) storage.

[] Export/import encrypted file format spec (nice-to-have, not required for launch).

Acceptance Tests

[] JSON schema validates all sample lessons.

[] UX flow diagram in /docs/ux/lesson-flow.md reviewed & approved.

Phase 2 — Shared Core & UI Kit (Foundations)

Exit Criteria

Core learning engine + reusable UI widgets with unit tests, usable identically from the browser and from `apps/api`.

Checklists

P2.1 packages/core (Engines)

[x] Lesson Graph loader (validate against schema) — server-only entry point (`@pylearn/core/loader`), kept out of the browser bundle since it touches the filesystem.

[] Mastery model (per-topic %; update rule per attempt) — real implementation shipped (`updateMastery`/`computeMasteryDelta`, wired into `submitAnswer`); still needs tuning once real usage data exists.

[x] Scoring (XP, streaks, penalties for reveals).

[] Adaptive policy: choose next checkpoint by mastery & recent mistakes (currently: first-unattempted-checkpoint only).

[x] Hint policy state machine (H0 → H1 → H2 → Reveal).

[] Result types & telemetry interfaces (local only).

P2.2 packages/ui-kit (Components)

[x] LessonCard, QuizMCQ, FillBlank, CodeCell (sandboxed), HintPanel, ResultExplainer, ProgressBar, StreakChip.

[x] Minimal theme tokens (font sizes, spacing, elevation).

[x] PWA manifest + offline shell caching (kept as a convenience layer, not the primary story).

[] Keyboard-first interactions & focus rings.

P2.3 packages/data (Content Store)

[x] Directory structure per track/module/lesson.

[x] Content validator CLI (pnpm data:lint).

[x] Sample "Python Basics" lessons with placeholder content.

P2.4 QA

[] Unit tests: mastery update, hint transitions, adaptive selection.

[] Visual spec (storybook or doc screenshots) for UI kit.

Acceptance Tests

[] Run pnpm -w test → green.

[] Demo harness in Node simulates 3 learning sessions and outputs summaries.

Phase 3 — Backend Foundation

Exit Criteria

`apps/api` (Fastify + TS) reachable in production behind the same domain as the web app, backed by Postgres, with zero user-facing behavior change yet.

Checklists

P3.1 Service & Data Layer

[x] `apps/api` skeleton importing `@pylearn/core` and `@pylearn/data` directly (no duplicated domain logic).

[x] Postgres schema + migrations: `users`, `auth_sessions`, `learning_sessions`, `attempts`, `llm_generations`.

[x] `docker-compose.yml`: `web` + `api` + `db` services; host Ollama reused over `host.docker.internal`, not containerized.

[x] nginx `location /api` reverse proxy so cookies stay same-origin under `pylearn.aysentra.com`.

[x] `GET /api/tracks`, `GET /api/sessions/:trackId`, `POST /api/attempts` backed by `@pylearn/core`'s `startSession`/`submitAnswer`/`getSummary`.

Acceptance Tests

[x] `pylearn.aysentra.com/api/health` returns 200 through the full nginx → api → (no DB dependency) path.

[x] Session/attempt endpoints round-trip through Postgres end to end (verified via curl before frontend wiring).

Phase 4 — Accounts & Sessions (Google OAuth)

Exit Criteria

A real Google account can sign in, complete a lesson, close the browser, open a different browser, sign in again, and see the same progress.

Checklists

P4.1 Backend

[x] Server-side OAuth Authorization Code flow: `/api/auth/google/start`, `/api/auth/google/callback`, `/api/auth/me`, `/api/auth/logout`.

[x] `users` upsert keyed by Google `sub`; DB-backed session via signed, httpOnly, `SameSite=Lax` cookie.

[] One-time manual step (outside this repo): create a Google Cloud OAuth Client ID/Secret and set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in the server `.env` — everything else is automated and already coded.

P4.2 Frontend

[x] `Login.tsx` route with "Sign in with Google" entry point, inert with a clear message when Google isn't configured yet.

[x] `state/store.tsx` auth-aware branch: signed-in users sync via `lib/api.ts` against the server; anonymous users keep the pre-existing IndexedDB-only path unchanged.

[] Settings/Account polish (avatar, "sign out everywhere").

Acceptance Tests

[x] Unauthenticated requests to `/api/sessions/*` and `/api/attempts` return 401.

[] Cross-browser sign-in round-trip verified once Google credentials are supplied.

Phase 5 — LLM-Proxy & Guardrailed Generation

Exit Criteria

Hint/quiz text can be AI-augmented without ever depending on a paid cloud API, and without degrading UX when the local model is busy or unavailable.

Checklists

P5.1 Tiered Generation (cheapest/most-reliable first)

[x] Tier 1 — cache: `llm_generations` table serves previously generated content for a checkpoint+task before anything is generated live.

[x] Tier 2 — local Ollama (`llama3.2:3b`), concurrency-capped to 1 in-flight request with a short timeout, reachable via the host's existing Ollama install (no new model download).

[x] Tier 3 — optional cloud overflow (NVIDIA NIM free tier), off by default via `LLM_OVERFLOW_ENABLED`, never on the hot path unless explicitly turned on.

[x] Tier 4 — deterministic template fallback: the lesson's own authored `hints`/`explanation` text, used whenever tiers 1-3 miss or fail.

[x] Grounding check: live-generated output must reference terms from the checkpoint/prompt before being trusted; ungrounded output is discarded in favor of the template.

[x] `POST /api/llm/hint` shipped as the first (narrowest) endpoint end-to-end.

[] `POST /api/llm/scenario` (quiz rewording) and `POST /api/llm/rationale` (option explanation polish) — same policy module, not yet exposed as routes.

P5.2 Guardrails & Determinism

[x] Retrieval-first: prefer curated `packages/data` content before generative augmentation; checkpoint correctness evaluation stays 100% deterministic (`packages/core`), never delegated to the LLM.

[x] Length & temperature caps (`num_predict`/`temperature` on the Ollama request, `max_tokens`/`temperature` on the NVIDIA NIM request).

[] Dedicated safety/off-topic classifier beyond the current keyword-grounding check.

Acceptance Tests

[x] `/api/llm/hint` returns usable content with Ollama running (real generation, cached for next time) and with Ollama stopped (falls back to the authored template) — both paths verified.

[] Frontend lesson player surfaces AI-augmented hints as an enrichment on top of, never a replacement for, the curated hint text.

Phase 6 — Web Product Polish

Exit Criteria

Mobile-browser-first responsive product with full "Python Basics" content, ready for external users.

Checklists

[] Mobile-browser-first responsive pass (primary target per product direction).

[] PWA install/offline-cache retained as a convenience feature, not the core pitch.

[] Complete "Python Basics" (≥ 10 lessons, 2–3 checkpoints each).

[] A11y pass: keyboard, focus, captions.

[] Privacy page describing what's stored server-side (Postgres, tied to your Google account) vs. locally (anonymous/offline mode), and that hints are generated by a small self-hosted model, not a third-party cloud AI.

Acceptance Tests

[] Fresh signed-in session on a phone browser completes a full lesson without layout issues.

[] Progress persists across devices for signed-in users; persists across reloads for anonymous users.

Phase 7 — Adaptive Expansion

Exit Criteria

Spaced repetition and mastery-driven review sessions.

Checklists

[] Skill estimation with confidence; decay on inactivity.

[] Review sessions auto-generated; spaced intervals.

[] (Parked, not deleted) Free web search assist for supplementary material — revisit only if curriculum breadth becomes a real gap; out of scope for the current pivot.

Acceptance Tests

[] Measurable improvement: fewer hints needed across sessions (aggregate, privacy-respecting analytics).

Phase 8 — Native Mobile App (Play Store) — Separate Stack, Later

Exit Criteria

Not defined yet — this phase is explicitly scoped as "not now, not blocking the web launch."

Notes

This is React Native _or_ native Kotlin/Swift, consuming `apps/api`'s HTTP contract (`/api/sessions`, `/api/attempts`, `/api/llm/*`) like any other REST client. It is **not** a WebView wrapper around `apps/web`, and does not assume DOM/browser APIs are available. Only `@pylearn/core`'s pure domain logic and the `apps/api` HTTP contract are shared with this phase — `packages/ui-kit` (React DOM components) is not reused here. This corrects the original plan's assumption that Android would be a thin React Native wrapper reusing browser-shaped code.

Cross-Cutting: Performance & Size Targets

[] Web initial bundle ≤ 20MB (excluding any optional model assets).

[] `/api/llm/*` response p95 < 3s on the shared host (replaces the old browser-downloaded-model-size targets, since generation now happens server-side).

[] ASR < 1.5s, explanation < 2.0s typical desktop (deferred until Phase 5's speech work resumes).

Definition of Ready (DoR)

[] User story has acceptance criteria.

[] Dependencies listed (packages, models, assets).

[] Estimation & labels assigned.

[] UX copy & error states specified.

Definition of Done (DoD)

[] Code + tests + docs updated.

[] Lint/typecheck/CI green.

[] A11y checks for new UI.

[] Demo scenario recorded (gif/screencap) where useful.

Issue Boilerplates (copy into GitHub)

Feature

Title: [Feature] <short>
Labels: type:feat, area:<core|ui|api|...>, phase:X, prio:P2

Goal

- <what user gets>

Acceptance Criteria

- <checks>

Notes

- Dependencies:
- Risks:

Content

Title: [Content] Lesson <id>: <name>
Labels: type:docs, area:content, phase:1, prio:P2

Tasks

- [] Draft checkpoints
- [] Write hints H0/H1/H2
- [] Option rationales (right/wrong)
- [] Data lint passes

Risks & Mitigations

Shared-host resource contention: the LLM host also runs a k3s cluster, other docker projects, and the developer's own daily-driver workload — mitigated by the cache-first tiered generation design (Phase 5) and a hard concurrency cap on live Ollama calls, so traffic growth doesn't compete with foreground work.

Postgres operational cost vs. SQLite: accepted for now given multi-user relational needs (foreign keys, concurrent writers); revisit if operational simplicity becomes more valuable than concurrency at low user counts.

Google OAuth "Testing" consent screen status caps sign-in to an explicit allow-list (~100 users) until verification is requested — fine for early access, needs addressing before a fully public launch.

Content throughput → schema + lint + templates to parallelize authoring (unchanged from the original plan).

Mastery model is new and untuned — watch real user mastery numbers after Phase 4 ships for anything that looks obviously wrong before leaning on it for adaptive features in Phase 7.

Suggested Milestones

M1 (Backend + Accounts Alpha): Phases 0–4.
M2 (AI-Augmented Beta): Phase 5.
M3 (Public Web Launch): Phase 6.
M4 (Adaptive 1.0): Phase 7.
M5 (Native Mobile): Phase 8, scoped independently once M3/M4 are stable.
