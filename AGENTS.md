# Repository Guidelines

## Phase Status & Priorities
- Active milestone: **Phase 0 — Repo, Conventions, Ground Rules** (`sdlc.md`).
- Backlog is pre-seeded in `pylearn_issues.csv`; each row is being mirrored into GitHub issues with labels like `phase:0`, `area:infra`, `type:chore`, `prio:P1`.
- During Phase 0, prioritize repository hygiene: branching policy, Conventional Commits, issue/PR templates, pnpm workspace bootstrapping, linting/formatting, CI scaffolding, monorepo skeleton, labels, and CODEOWNERS.
- Finish Phase 0 checklists before pulling Phase 1 curriculum tasks or later-phase technical work.

## Issue Workflow
- Convert new SDLC checklist items into GitHub issues immediately; keep the CSV and the live tracker in sync.
- Required labels per issue: `phase:?`, `area:?`, `type:?`, `prio:?`. Use existing vocabulary from `sdlc.md`.
- Reference issue IDs in commits/PRs (`fixes #123`) and update `sdlc.md` checkboxes only after merge.
- Track due dates or dependencies in the issue body; include acceptance criteria similar to the CSV format.

## Branching & Commits
- Default branches: `main` (protected), feature work on `feat/*`, fixes on `fix/*`, chores on `chore/*`.
- Commit style: Conventional Commits (`type(scope): summary`). Align scopes with packages or directories, e.g. `chore(infra): add lint-staged`.
- Keep branches rebased on `main`; squash merge unless a different strategy is documented.

## Project Structure & Module Organization
- Maintain the planned monorepo layout:
  ```
  pylearn/
    apps/web       # React + Vite PWA shell
    apps/android   # React Native/Expo wrapper
    packages/core  # Learning engine and adapters
    packages/ui-kit# Shared UI widgets
    packages/llm   # Local model runners & prompts
    packages/speech# ASR/TTS abstractions
    packages/data  # Lesson content and schemas
    infra/         # CI, build, release
    scripts/       # Tooling, validators
  ```
- Add placeholder README.md files before introducing code to any directory; this keeps ownership clear and unblocks CODEOWNERS.

## Tooling & Commands
- Adopt `pnpm` workspaces at the root once `package.json` is introduced.
- Key commands (once workspace exists):
  - `pnpm install` — hydrate the workspace.
  - `pnpm -w lint` — run ESLint + Prettier checks across packages.
  - `pnpm -w test` — execute unit tests; ensure green before merging.
  - `pnpm --filter apps/web dev` — launch the web PWA locally.
  - `pnpm --filter packages/core test -- --watch` — focus iteration on the learning engine.
- Configure Husky + lint-staged to enforce lint, format, and type-check on commit.
- Set up CI to run setup-node, `pnpm install`, `pnpm -w build`, and `pnpm -w test` as soon as repos support it.

## Coding Style & Naming Conventions
- Default to TypeScript (2-space indentation). Python tooling uses 4 spaces.
- Rely on ESLint + Prettier defaults; never merge unformatted files.
- Naming: PascalCase for React components, camelCase for functions/variables, kebab-case for directories.
- Use stable IDs for curriculum artifacts (e.g. `lesson.python.variables`). Keep prompts and hint templates close to their consumers.

## Testing Expectations
- Use Vitest for web/TypeScript packages, pytest for Python utilities; prefer deterministic tests over snapshots.
- Place tests alongside source (`__tests__` or `*.test.ts`). Name scenarios after learner outcomes (`mastery-decreases-after-hint`).
- Add fixtures under `packages/data/test-fixtures`.
- Aim for ≥80% coverage on mastery logic and speech adapters; document gaps in PR descriptions.

## Documentation & Planning
- Treat `sdlc.md` as the canonical roadmap. Update it when milestones change and when checklists advance.
- Record architectural decisions in `docs/adr/<id>-<slug>.md`; include context, decision, and alternatives.
- Keep new documentation under `docs/` and link from `sdlc.md` or relevant issues.
- Ensure issue and PR templates live under `.github/` and evolve with process learnings.

## Agent Collaboration Notes
- Share progress via GitHub issues and link corresponding SDLC checklist items.
- Surface risks early (tooling gaps, dependency blockers) in issue comments or new issues.
- Maintain parity between CSV planning artifacts, SDLC checklists, and GitHub issue states so autonomous agents can pick work confidently.
