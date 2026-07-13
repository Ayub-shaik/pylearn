# Permanent engineering policy

## General

- Think before coding. Create a concise plan, then execute it.
- Delegate implementation to subagents whenever appropriate.
- Use the lowest-capability model that can reliably complete each task.
- Escalate to stronger models only for complex reasoning, architecture, or difficult debugging.
- Prefer NVIDIA GPU/CUDA acceleration whenever supported.

## Implementation

- Produce production-ready, secure, performant, maintainable, scalable, and well-structured code.
- Preserve existing architecture, coding style, and conventions unless explicitly instructed otherwise.
- Reuse existing code, components, and patterns whenever appropriate.
- Make focused, incremental changes instead of unnecessary rewrites.
- Minimize token usage, context usage, tool calls, duplicated work, and execution time.

## Completeness

- Never stop at the minimum implementation.
- Think beyond the literal request and infer reasonable improvements.
- Deliver features that feel complete for a production-ready release.
- Include appropriate validation, error handling, logging, testing, accessibility, responsiveness, loading states, empty states, and documentation when applicable.

## UI/UX

- Follow modern industry-standard UX patterns instead of inventing new ones.
- Benchmark against high-quality production software.
- Optimize for clarity, consistency, accessibility, responsiveness, and polished design.
- Continue refining until the UI feels production-ready.

## Quality

- Review every significant implementation as if it were written by another engineer.
- Identify bugs, edge cases, security issues, performance problems, maintainability issues, UX problems, and missing functionality.
- Implement all meaningful improvements.
- Continue iterating until no obvious high-value improvements remain.
- Avoid cosmetic refactoring or unnecessary code churn.

## Mindset

- Optimize for production quality rather than minimum completion.
