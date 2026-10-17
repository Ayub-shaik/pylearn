# PyLearn ↔ OpenMAIC bridge

PyLearn and OpenMAIC stay **separate apps**. This bridge links structured Python practice to immersive MAIC classrooms.

## Phase A — link-out (`externalClassroomUrl`)

Add to a lesson JSON file:

```json
{
  "externalClassroomUrl": "https://maic.tomorrowtools.dev"
}
```

The lesson page shows an **Open in OpenMAIC** link. Example: `lesson-001-variables.json`.

## Phase B — embed (`embedClassroomPath`)

1. In OpenMAIC, export a classroom as HTML/ZIP.
2. Unpack under `apps/web/public/classrooms/<slug>/` (e.g. `index.html`).
3. Set on the lesson:

```json
{
  "embedClassroomPath": "/classrooms/python-variables/index.html"
}
```

The lesson page renders an iframe (sandboxed: scripts, same-origin, forms).

## LLM policy

- **OpenMAIC generation** uses homelab OpenClaw → OmniRoute (see `projects/openmaic/README.md`).
- **PyLearn hints/chat** remain on NIM/Ollama/cache — unchanged.

## Experimental converter (quiz-only)

`scripts/maic-export-ingest.ts` is a stub for future MAIC quiz JSON → PyLearn `quiz-mcq` import. Not required for link/embed workflows.

## Homelab URLs

| Service | URL |
|---------|-----|
| OpenMAIC | https://maic.tomorrowtools.dev |
| Learn hub docs | https://learn.tomorrowtools.dev/openmaic.html |
| PyLearn | https://pylearn.aysentra.com |
