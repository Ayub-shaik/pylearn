# PyLearn\n\nLocal-first AI Python learning app (Web + Android).
PyLearn — A Local-First AI Python Learning App

Web + Android learning app with an embedded on-device AI tutor (voice & text).
Teaches Python via lessons, interactive checkpoints, adaptive quizzes, and step-by-step hints.
Default: local LLM only. Optional: web search (free sources) when the local model needs extra context.

Why PyLearn?

Practice-driven: Learn Python by doing—short lessons → guided exercises → immediate feedback.

Adaptive: The tutor detects your mastery and adjusts difficulty, giving targeted hints and explanations.

Local-first: Runs on your device with a compact LLM; no paid APIs.

Voice + Text: Listen to lessons, speak answers, or type—your choice.

Two targets, one core: Shared core logic so the Android app ships fast after the web app.

Project Goals

Deliver a web app MVP (offline-capable) with lessons, exercises, adaptive quizzes, voice & text tutor, progress tracking.

Reuse the shared core to ship an Android app quickly.

Keep the on-device AI small but capable; fall back to free web search (non-paid) only when needed.

Provide transparent explanations (why each option is right/wrong).

Make learners feel accompanied: “Okay, let’s put you to the test!”

Local AI Choices (small, shippable)

Primary (Web, browser-only):

WebLLM / MLC-LLM (WebGPU) with a compact instruction model such as:

Qwen2.5-Instruct 1.5B–3B (good trade-off of quality/size; ~1.5–3.0 GB quantized).

Phi-3/3.5-mini/medium variants (small footprint, strong reasoning per token).

Pack as progressive model download + local cache; ship the tiniest baseline in bundle, fetch better quant on demand.

Optional “heavier local” (desktop users):

Ollama backend (user-side) for models they already run locally (e.g., Qwen2.5-3B/7B, Llama 3.1 8B). App talks to http://localhost:11434 when available.

Embeddings (for lesson retrieval & hint ranking):

Lightweight ModernBERT/Granite-R or MiniLM style local embeddings; quantized.

If browser-only, use a WASM or WebGPU embedding model (small footprint) and/or pre-embed lesson bank offline.

Speech

ASR (offline): whisper.cpp (tiny/base) or Vosk (Android-friendly).

TTS (offline): Piper or Coqui TTS small voices.

Web can also offer the system Web Speech APIs when available, but default to offline engines for reliability.

Core Features (MVP)

Lesson Flow: Bite-sized text + optional audio narration → code demo → mini challenge.

Teacher Mode: Proactively prompts: “Okay, let’s put you to the test.”

Guided Exercises: Fill-in-the-blank, multiple choice, and live code cells with instant feedback.

Hints & Explanations:

If wrong: hold the learner, show hints → reveal answer if needed.

For each option: explain why correct and why not with examples.

Adaptive Engine: Scaffolds difficulty from your accuracy/latency; surfaces remedial micro-lessons.

Progress & Scoring: XP, streaks, topic mastery bars, session summaries, and a personal “next steps”.

Local-first Data: Lessons, progress, and configs stored locally; optional encrypted export/import.

No paid APIs: When needed, free web search with local filtering & self-evaluation before proposing materials.

Architecture (shared-core first)

Monorepo (recommended)

pylearn/
  apps/
    web/         # React + Vite + TS (PWA, offline cache)
    android/     # React Native (or Flutter) thin shell; reuses core
  packages/
    core/        # Domain logic: lesson graph, adaptive engine, scoring, hinting
    llm/         # Local inference adapters: WebLLM/MLC (browser), Ollama (optional), prompt templates
    speech/      # ASR/TTS wrappers (web + android)
    ui-kit/      # Reusable UI components (cards, quiz widgets, code runner, progress bars)
    data/        # Lesson content, quizzes, explanations (versioned JSON/MD)
  infra/
    build/       # CI/CD, bundling, signing, Android pipeline
    scripts/     # Dev scripts, content validators


Key Patterns

PWA on web: offline cache, IndexedDB for progress, WASM for ASR/TTS where needed.

Shared code in packages/core, packages/ui-kit, packages/llm, packages/speech.

Android wraps the same core with RN/Expo.

LLM routing: packages/llm tries WebGPU model → Ollama (if detected) → (optional) non-paid web search → local self-eval → respond.

Guardrails: Deterministic templates for hints/explanations; retrieve curated snippets from packages/data first, then only augment with LLM.

Data Model (conceptual)

UserProfile: id, name, preferences, voice rate/pitch, privacy opts

Curriculum: tracks → modules → lessons → checkpoints (typed: note, quiz, coding)

Mastery: per-topic mastery %, attempts, last-seen difficulty

Session: start/end, score deltas, hint usage, stuck points

Telemetry (local): anonymized aggregates to tune adaptivity (exportable)

Security & Privacy

No paid APIs.

All personal progress stays local by default.

Optional encrypted backup/export to a file; import restores.

Transparent web-search usage with on-device filtering & citations inside the app.