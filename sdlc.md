SDLC — PyLearn (Local-First AI Python Learning App)

Targets: Web (PWA) first → Android next
Principles: Local LLM by default, offline-first, component reuse, additive phases, no revamps
Tracking: Convert checklist items to GitHub Issues. Use the labels & IDs provided.

Legend

[] = To do [~] = In progress [x] = Done

Labels: phase:X, area:core|ui|llm|speech|web|android|infra|content, type:feat|chore|fix|docs|test, prio:P1|P2|P3

Phase 0 — Repo, Conventions, Ground Rules

Exit Criteria

Monorepo scaffolding decided, coding standards documented, CI sanity checks green.

Checklists

P0.1 Repo Hygiene & Conventions

[] Adopt commit style: Conventional Commits (doc in /docs/contrib.md).

[] Define branching: main (protected), feat/*, fix/*, chore/*.

[] Add issue labels (list above).

[] Add PR template (.github/pull_request_template.md).

[] Add Issue templates: Feature, Bug, Content, Task.

P0.2 Tooling

[] Choose package manager: pnpm workspaces.

[] Root package.json with workspaces.

[] Add Prettier + ESLint configs.

[] Husky + lint-staged pre-commit hook (lint, typecheck).

[] Basic CI: Node setup, pnpm i, pnpm -w build, pnpm -w test.

P0.3 Monorepo Layout (no code yet—folders only)

pylearn/
  apps/
    web/
    android/
  packages/
    core/
    ui-kit/
    llm/
    speech/
    data/
  docs/
  infra/
  scripts/


[] Create directories + placeholder README.md in each.

[] Add CODEOWNERS scoped by folder.

Acceptance Tests

[] pnpm -w -v works; pnpm -w install succeeds.

[] CI passes lint + typecheck stubs.

Phase 1 — Curriculum & UX Specification

Exit Criteria

Lesson schema approved, “Python Basics” track outlined, UX flows frozen.

Checklists

P1.1 Curriculum Definition

[] Define topic map: Variables, Types, I/O, Control Flow, Functions, Lists, Dicts, Loops, Errors, Modules.

[] Author Curriculum JSON Schema (lesson → checkpoints).

[] Content lint rules (IDs stable, unique; length bounds; hint presence).

[] Draft 10+ lessons (skeleton only, no final copy).

[] Define checkpoint types: note, quiz-mcq, fill-blank, code-cell.

P1.2 UX Flows & Copy

[] Flow: Lesson → mini-challenge → hints → explanation → mastery tick.

[] “Teacher voice” script guidelines (tone, “Okay, let’s put you to the test.” moments).

[] Error states & stuck handling (3 hints → reveal → micro-lesson).

[] Accessibility notes (keyboard nav, captions, contrast).

P1.3 Data Privacy

[] Decide storage keys for progress (local-only default).

[] Export/import encrypted file format spec.

Acceptance Tests

[] JSON schema validates all sample lessons.

[] UX flow diagram in /docs/ux/lesson-flow.md reviewed & approved.

Phase 2 — Shared Core & UI Kit (Foundations)

Exit Criteria

Core learning engine + reusable UI widgets with unit tests.

Checklists

P2.1 packages/core (Engines)

[] Lesson Graph loader (validate against schema).

[] Mastery model (per-topic %; update rule per attempt).

[] Scoring (XP, streaks, penalties for reveals).

[] Adaptive policy: choose next checkpoint by mastery & recent mistakes.

[] Hint policy state machine (H0 → H1 → H2 → Reveal).

[] Result types & telemetry interfaces (local only).

P2.2 packages/ui-kit (Components)

[] LessonCard, QuizMCQ, FillBlank, CodeCell (sandboxed), HintPanel, ResultExplainer, ProgressBar, StreakChip.

[] Minimal theme tokens (font sizes, spacing, elevation).

[] Keyboard-first interactions & focus rings.

P2.3 packages/data (Content Store)

[] Directory structure per track/module/lesson.

[] Content validator CLI (pnpm data:lint).

[] Sample “Python Basics” lessons with placeholder content.

P2.4 QA

[] Unit tests: mastery update, hint transitions, adaptive selection.

[] Visual spec (storybook or doc screenshots) for UI kit.

Acceptance Tests

[] Run pnpm -w test → green.

[] Demo harness in Node simulates 3 learning sessions and outputs summaries.

Phase 3 — Local AI Layer (LLM, Guardrails, Speech)

Exit Criteria

Local LLM answers, explains options (why/right/wrong), voice in/out works offline.

Checklists

P3.1 packages/llm
[] LLM routing order: Browser(WebLLM) → Ollama@localhost → (Phase 6) Free web search.

[] Ollama probe: 150–300 ms timeout to GET /api/tags; set llm.provider="ollama" if success.

[] Model policy:

Browser default pack: qwen2.5-instruct-1.5b (upgrade to 3B).

Ollama policy: explain=llama3.1:8b | deepseek-r1:7b, code_hint=qwen2.5-coder:7b.

[] Settings UI: Toggle “Use local Ollama if available”, model dropdown (persisted).

[] Embeddings: Prefer pre-embedded lesson bank; if Ollama present and user enabled, allow local nomic-embed-text for custom material.

[] Choose default browser model: Qwen2.5-Instruct 1.5B (WebGPU via WebLLM/MLC).

[] Define prompt templates:

Hints generation (scoped to lesson context)

Option explanations (why correct/incorrect)

Self-evaluation rubric (score clarity, correctness)

[] Routing: WebGPU local → optional Ollama http://localhost:11434 → optional free web search (Phase 6).

[] Model asset management: progressive download, cache, version pin.

P3.2 Guardrails & Determinism

[] Retrieval-first: prefer snippets from packages/data before generative.

[] Length & temperature caps; stop sequences.

[] Safety classifier for off-topic generations.

P3.3 packages/speech

[] ASR adapters: whisper.cpp (tiny/base) or Vosk (browser/Android paths).

[] TTS adapters: Piper (local) + Web Speech API fallback.

[] Voice settings: rate, pitch, language.

[] Offline packaging notes & lazy init.

P3.4 QA

[] Latency budget tests (ASR <1.5s, explanation <2s on mid-range laptop).

[] Deterministic snapshot tests for prompts with fixed seeds.

Acceptance Tests

[] Given a quiz question with 3 options, LLM returns per-option: reason-correct + reason-incorrect.

[] End-to-end: user speaks answer → ASR → evaluation → TTS explanation.

Phase 4 — Web App (PWA, Offline-First)

Exit Criteria

Installable PWA with offline cache, local DB, and complete “Python Basics”.

Checklists

P4.1 App Shell

[] React + Vite + TS app in apps/web.

[] Routes: Home, Tracks, Lesson, Review, Settings, About.

[] Service worker + offline caching strategy (workbox or manual).

[] IndexedDB schema for progress & telemetry.

[] First-run model flow: Pick tiny/small pack; show estimated size + disk cache location.

[] Fallbacks: If no WebGPU → CPU warn + allow “Use Ollama” if detected.

[] Privacy page: Clarify on-device inference and optional Ollama usage.

P4.2 Lesson Player

[] Integrate core engine & ui-kit components.

[] “Teacher Mode” triggers checkpoints automatically.

[] CodeCell sandbox (safe eval, timeouts, blocked APIs).

[] Stuck flow → hints → reveal → micro-lesson.

P4.3 Voice UX

[] Mic permission handling; VU meter; retry prompts.

[] TTS queueing (no overlap).

[] Settings page: voice, model size, offline packs.

P4.4 Content

[] Complete “Python Basics” (≥ 10 lessons, 2–3 checkpoints each).

[] Explanations per option (explicit right/wrong).

P4.5 PWA Polish

[] Icons & manifest; install banner.

[] First-run model download flow with size options (tiny / small / medium).

[] Low-power mode toggle.

Acceptance Tests

[] Works fully offline after first run.

[] Progress persists across reloads; streaks computed.

[] A11y pass: keyboard, focus, captions.

Phase 5 — Android App (Reuse Core)

Exit Criteria

Android app reaches feature parity for “Python Basics” with local voice.

Checklists

P5.1 Shell & Reuse

[] React Native (Expo) app in apps/android.

[] Share packages/core, ui-kit, llm, speech as much as possible.

[] Native storage (SQLite/AsyncStorage) mapping.

[] Model download manager: Pause/resume, Wi-Fi-only option.

[] LAN Ollama (optional): Advanced setting with IP allowlist + TLS warning.

P5.2 Voice

[] Android ASR fallback (Vosk).

[] Android TTS (Piper/native).

[] Mic permission flows and UX parity.

P5.3 Model & Assets

[] On-first-run model download & cache.

[] Asset size gating (≤120MB base APK; models external).

Acceptance Tests

[] Fresh device install → download minimal model → run first lesson offline.

[] Feature parity with web MVP across 3 sessions.

Phase 6 — Adaptive Expansion & Free Web Search Assist

Exit Criteria

Spaced repetition & curated external materials (no paid APIs) with local self-evaluation.

Checklists

P6.1 Adaptivity

[] Skill estimation with confidence; decay on inactivity.

[] Review sessions auto-generated; spaced intervals.

P6.2 Free Web Search (Optional)

[] Search adapter (e.g., anonymous GET to public endpoints or scraping free sources you permit).

[] On-device filtering by topic; cite sources visibly.

[] Self-evaluation rubric to gate inclusion (reject low-score content).

Acceptance Tests

[] Measurable improvement: fewer hints needed across sessions (local analytics).

[] Sources shown with links; toggle to disable search globally.

Phase 7 — Privacy, Export/Import, Polish

Exit Criteria

Strong privacy defaults, export/import workflow, accessibility polish.

Checklists

P7.1 Privacy

[] Local-first ON by default; no telemetry leaves device.

[] Clear privacy page in app.

P7.2 Export/Import

[] Encrypted export to file (password-protected).

[] Import with conflict resolution.

P7.3 A11y & UX

[] High-contrast theme; text scaling.

[] Screen reader labels for all controls.

Acceptance Tests

[] Export/import round-trip reproduces mastery & progress.

[] A11y audit checklist passes.

Cross-Cutting: Performance & Size Targets

[] Web initial bundle ≤ 20MB (excluding models).

[] Model packs: tiny (~300–700MB), small (~1–1.5GB), medium (~2–3GB).

[] Android base APK/AAB ≤ 120MB; model packs external.

[] ASR < 1.5s, explanation < 2.0s typical desktop.

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
Labels: type:feat, area:<core|ui|...>, phase:X, prio:P2

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

Model size vs. latency → tiered packs, lazy load, configurable quality.

Browser GPU variance → CPU fallback + optional Ollama local backend.

ASR accuracy on low-end devices → allow text fallback quickly.

Content throughput → schema + lint + templates to parallelize authoring.

Suggested Milestones

M1 (Web Alpha): Phases 0–3.

M2 (Web Beta): Phase 4 with “Python Basics”.

M3 (Android Beta): Phase 5 parity.

M4 (1.0): Phases 6–7 polish.