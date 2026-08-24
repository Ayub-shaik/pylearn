import { describe, expect, it } from 'vitest';

import {
  MASTERY_COMPLETION_THRESHOLD,
  countCompletedCheckpoints,
  firstUnattemptedCheckpointInLesson,
  reconcileSessionCursor,
  selectNextCheckpoint,
  submitAnswer,
} from '@pylearn/core';
import type {
  Attempt,
  Checkpoint,
  CheckpointRef,
  Mastery,
  SessionState,
  Track,
} from '@pylearn/core';

// ---------------------------------------------------------------------------
// Fixtures — a tiny synthetic track (2 modules x 2 lessons x 2-3 checkpoints)
// hand-built here on purpose. Tests must NOT import real curriculum JSON from
// packages/data: content edits would silently break progression tests.
// ---------------------------------------------------------------------------

const CORRECT_OPTION_ID = 'opt-correct';
const WRONG_OPTION_ID = 'opt-wrong';
const FILL_BLANK_ANSWER = 'print';
const FIXED_TIMESTAMP = 1_000;

function makeNote(id: string): Checkpoint {
  return {
    id,
    type: 'note',
    title: `Note ${id}`,
    content: 'Read this concept.',
    explanation: 'Concept acknowledged.',
  };
}

function makeQuiz(id: string): Checkpoint {
  return {
    id,
    type: 'quiz-mcq',
    title: `Quiz ${id}`,
    content: 'Pick the right answer.',
    explanation: 'General quiz explanation.',
    options: [
      { id: CORRECT_OPTION_ID, text: 'Right', isCorrect: true, explanation: 'That is right.' },
      { id: WRONG_OPTION_ID, text: 'Wrong', isCorrect: false, explanation: 'That is wrong.' },
    ],
  };
}

function makeFillBlank(id: string): Checkpoint {
  return {
    id,
    type: 'fill-blank',
    title: `Fill ${id}`,
    content: 'Fill in the blank.',
    answer: FILL_BLANK_ANSWER,
    explanation: 'Fill-blank explanation.',
  };
}

function buildTrack(): Track {
  return {
    id: 'track-test',
    title: 'Synthetic Test Track',
    summary: 'Hand-built fixture for engine progression tests.',
    modules: [
      {
        id: 'module-1',
        trackId: 'track-test',
        title: 'Module 1',
        summary: 'First module.',
        lessons: [
          {
            id: 'lesson-1-1',
            moduleId: 'module-1',
            title: 'Lesson 1.1',
            summary: 'First lesson.',
            durationMinutes: 5,
            checkpoints: [
              makeNote('cp-1-1-note'),
              makeQuiz('cp-1-1-quiz'),
              makeFillBlank('cp-1-1-fill'),
            ],
          },
          {
            id: 'lesson-1-2',
            moduleId: 'module-1',
            title: 'Lesson 1.2',
            summary: 'Second lesson.',
            durationMinutes: 5,
            checkpoints: [makeQuiz('cp-1-2-quiz'), makeFillBlank('cp-1-2-fill')],
          },
        ],
      },
      {
        id: 'module-2',
        trackId: 'track-test',
        title: 'Module 2',
        summary: 'Second module.',
        lessons: [
          {
            id: 'lesson-2-1',
            moduleId: 'module-2',
            title: 'Lesson 2.1',
            summary: 'Third lesson.',
            durationMinutes: 5,
            checkpoints: [makeNote('cp-2-1-note'), makeQuiz('cp-2-1-quiz')],
          },
          {
            id: 'lesson-2-2',
            moduleId: 'module-2',
            title: 'Lesson 2.2',
            summary: 'Fourth lesson.',
            durationMinutes: 5,
            checkpoints: [makeFillBlank('cp-2-2-fill'), makeQuiz('cp-2-2-quiz')],
          },
        ],
      },
    ],
  };
}

// Engine functions are pure/immutable, so one shared fixture is safe.
const track = buildTrack();

function correct(lessonId: string, checkpointId: string): Attempt {
  return { lessonId, checkpointId, isCorrect: true, timestamp: FIXED_TIMESTAMP, revealsUsed: 0 };
}

function wrong(lessonId: string, checkpointId: string): Attempt {
  return { lessonId, checkpointId, isCorrect: false, timestamp: FIXED_TIMESTAMP, revealsUsed: 0 };
}

function makeMastery(lessonPercent: Record<string, number> = {}): Mastery {
  return {
    overallPercent: 0,
    lessonPercent: {
      'lesson-1-1': 0,
      'lesson-1-2': 0,
      'lesson-2-1': 0,
      'lesson-2-2': 0,
      ...lessonPercent,
    },
    updatedAt: FIXED_TIMESTAMP,
  };
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    id: 'session-test',
    trackId: track.id,
    attempts: [],
    mastery: makeMastery(),
    startedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// selectNextCheckpoint
// ---------------------------------------------------------------------------

describe('selectNextCheckpoint', () => {
  interface SelectNextCase {
    name: string;
    attempts: Attempt[];
    currentLessonId?: string;
    lessonPercent?: Record<string, number>;
    expected: CheckpointRef | undefined;
  }

  const cases: SelectNextCase[] = [
    {
      name: 'fresh session with no attempts starts at the first checkpoint of the first lesson',
      attempts: [],
      currentLessonId: undefined,
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-note' },
    },
    {
      name: 'advances to the next unattempted checkpoint within the current lesson',
      attempts: [correct('lesson-1-1', 'cp-1-1-note')],
      currentLessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-quiz' },
    },
    {
      name: 'all checkpoints answered correctly in order advances lesson-to-lesson within a module',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
      ],
      currentLessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-2', checkpointId: 'cp-1-2-quiz' },
    },
    {
      // REGRESSION (production bug #1, fixed today): the old duplicate
      // implementation in the web store treated ANY attempt as "done", so a
      // wrong, never-retried answer was silently skipped and the learner was
      // advanced past a question they never got right. Only a correct attempt
      // may unblock progression.
      name: 'does NOT skip a checkpoint answered wrong and never successfully retried',
      attempts: [correct('lesson-1-1', 'cp-1-1-note'), wrong('lesson-1-1', 'cp-1-1-quiz')],
      currentLessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-quiz' },
    },
    {
      name: 'a later correct retry of a previously wrong checkpoint unblocks progression',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        wrong('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
      ],
      currentLessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-fill' },
    },
    {
      name: 'returns undefined at a module boundary while the preceding module is below mastery',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
        correct('lesson-1-2', 'cp-1-2-quiz'),
        correct('lesson-1-2', 'cp-1-2-fill'),
      ],
      currentLessonId: 'lesson-1-2',
      lessonPercent: {
        'lesson-1-1': 100,
        'lesson-1-2': MASTERY_COMPLETION_THRESHOLD - 1,
      },
      expected: undefined,
    },
    {
      name: 'crosses the module boundary once every lesson in the preceding module meets mastery',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
        correct('lesson-1-2', 'cp-1-2-quiz'),
        correct('lesson-1-2', 'cp-1-2-fill'),
      ],
      currentLessonId: 'lesson-1-2',
      lessonPercent: {
        'lesson-1-1': 100,
        'lesson-1-2': MASTERY_COMPLETION_THRESHOLD,
      },
      expected: { lessonId: 'lesson-2-1', checkpointId: 'cp-2-1-note' },
    },
    {
      name: 'never yanks the learner backward into an earlier skipped lesson',
      attempts: [correct('lesson-1-2', 'cp-1-2-quiz'), correct('lesson-1-2', 'cp-1-2-fill')],
      currentLessonId: 'lesson-1-2',
      // lesson-1-1 untouched (0%), so module-1 is not mastery-complete: the
      // search must neither go back to lesson-1-1 nor advance into module-2.
      expected: undefined,
    },
  ];

  it.each(cases)('$name', ({ attempts, currentLessonId, lessonPercent, expected }) => {
    // Arrange
    const session = makeSession({
      attempts,
      currentLessonId,
      mastery: makeMastery(lessonPercent),
    });

    // Act
    const next = selectNextCheckpoint(track, session);

    // Assert
    expect(next).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// firstUnattemptedCheckpointInLesson
// ---------------------------------------------------------------------------

describe('firstUnattemptedCheckpointInLesson', () => {
  interface FirstUnattemptedCase {
    name: string;
    attempts: Attempt[];
    lessonId: string;
    expected: CheckpointRef | undefined;
  }

  const cases: FirstUnattemptedCase[] = [
    {
      name: 'returns the first checkpoint when the lesson has no attempts',
      attempts: [],
      lessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-note' },
    },
    {
      name: 'returns the first checkpoint without a correct attempt in a partially done lesson',
      attempts: [correct('lesson-1-1', 'cp-1-1-note')],
      lessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-quiz' },
    },
    {
      // The checkpoints[0] fallback for a fully completed lesson is the
      // caller's responsibility — this function only reports "nothing left".
      name: 'returns undefined for a fully correctly-completed lesson',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
      ],
      lessonId: 'lesson-1-1',
      expected: undefined,
    },
    {
      // REGRESSION (production bug fixed today): the deleted store-side
      // reimplementation counted a wrong attempt as "attempted", so reopening
      // this lesson resumed at cp-1-1-fill and stranded the wrong answer
      // behind the learner. It must resume at the wrong-then-abandoned
      // checkpoint itself.
      name: 'returns the wrong-then-abandoned checkpoint, not a later one',
      attempts: [correct('lesson-1-1', 'cp-1-1-note'), wrong('lesson-1-1', 'cp-1-1-quiz')],
      lessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-quiz' },
    },
    {
      name: 'skips a previously wrong checkpoint once it has a later correct attempt',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        wrong('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
      ],
      lessonId: 'lesson-1-1',
      expected: { lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-fill' },
    },
    {
      name: 'returns undefined for an unknown lesson id',
      attempts: [],
      lessonId: 'lesson-does-not-exist',
      expected: undefined,
    },
  ];

  it.each(cases)('$name', ({ attempts, lessonId, expected }) => {
    // Arrange
    const session = makeSession({ attempts });

    // Act
    const ref = firstUnattemptedCheckpointInLesson(track, session, lessonId);

    // Assert
    expect(ref).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// submitAnswer
// ---------------------------------------------------------------------------

describe('submitAnswer', () => {
  it('pins currentLessonId/currentCheckpointId to the just-attempted checkpoint on a wrong answer', () => {
    // Arrange
    const session = makeSession({
      attempts: [correct('lesson-1-1', 'cp-1-1-note')],
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-1-1-quiz',
    });
    const attempt: Attempt = {
      lessonId: 'lesson-1-1',
      checkpointId: 'cp-1-1-quiz',
      selectedOptionId: WRONG_OPTION_ID,
      // Deliberately claim correctness: for quiz checkpoints the engine's own
      // option evaluation is authoritative, not the caller-supplied flag.
      isCorrect: true,
      timestamp: FIXED_TIMESTAMP,
      revealsUsed: 0,
    };

    // Act
    const outcome = submitAnswer(track, session, attempt);

    // Assert — cursor does not advance past the failed checkpoint.
    expect(outcome.feedback.correct).toBe(false);
    expect(outcome.feedback.next).toBeUndefined();
    expect(outcome.session.currentLessonId).toBe('lesson-1-1');
    expect(outcome.session.currentCheckpointId).toBe('cp-1-1-quiz');
    expect(outcome.session.attempts).toHaveLength(2);
    expect(outcome.session.attempts[1].isCorrect).toBe(false);
    // Input session must not be mutated.
    expect(session.attempts).toHaveLength(1);
  });

  it('advances the cursor to the next checkpoint on a correct answer within a lesson', () => {
    // Arrange
    const session = makeSession({
      attempts: [correct('lesson-1-1', 'cp-1-1-note')],
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-1-1-quiz',
    });
    const attempt: Attempt = {
      lessonId: 'lesson-1-1',
      checkpointId: 'cp-1-1-quiz',
      selectedOptionId: CORRECT_OPTION_ID,
      isCorrect: true,
      timestamp: FIXED_TIMESTAMP,
      revealsUsed: 0,
    };

    // Act
    const outcome = submitAnswer(track, session, attempt);

    // Assert — cursor lands exactly where selectNextCheckpoint points.
    expect(outcome.feedback.correct).toBe(true);
    expect(outcome.feedback.next).toEqual({ lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-fill' });
    expect(outcome.session.currentLessonId).toBe('lesson-1-1');
    expect(outcome.session.currentCheckpointId).toBe('cp-1-1-fill');
    expect(outcome.session.completedAt).toBeUndefined();
  });

  it('advances currentLessonId across a lesson boundary on the last correct answer of a lesson', () => {
    // Arrange
    const session = makeSession({
      attempts: [correct('lesson-1-1', 'cp-1-1-note'), correct('lesson-1-1', 'cp-1-1-quiz')],
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-1-1-fill',
    });
    const attempt: Attempt = {
      lessonId: 'lesson-1-1',
      checkpointId: 'cp-1-1-fill',
      responseText: FILL_BLANK_ANSWER,
      isCorrect: true,
      timestamp: FIXED_TIMESTAMP,
      revealsUsed: 0,
    };

    // Act
    const outcome = submitAnswer(track, session, attempt);

    // Assert
    expect(outcome.feedback.correct).toBe(true);
    expect(outcome.feedback.next).toEqual({ lessonId: 'lesson-1-2', checkpointId: 'cp-1-2-quiz' });
    expect(outcome.session.currentLessonId).toBe('lesson-1-2');
    expect(outcome.session.currentCheckpointId).toBe('cp-1-2-quiz');
  });

  it('treats a note checkpoint as always-correct and progresses like a correct quiz', () => {
    // Arrange — the caller even claims the note was answered "wrong"; notes
    // have no wrong state, so evaluation must override to correct.
    const session = makeSession({
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-1-1-note',
    });
    const attempt: Attempt = {
      lessonId: 'lesson-1-1',
      checkpointId: 'cp-1-1-note',
      isCorrect: false,
      timestamp: FIXED_TIMESTAMP,
      revealsUsed: 0,
    };

    // Act
    const outcome = submitAnswer(track, session, attempt);

    // Assert — identical progression to a correctly-answered quiz.
    expect(outcome.feedback.correct).toBe(true);
    expect(outcome.feedback.next).toEqual({ lessonId: 'lesson-1-1', checkpointId: 'cp-1-1-quiz' });
    expect(outcome.session.currentCheckpointId).toBe('cp-1-1-quiz');
    expect(outcome.session.attempts[0].isCorrect).toBe(true);
  });

  it('stamps completedAt and returns no next ref after the final checkpoint of the track', () => {
    // Arrange — everything except the very last checkpoint is already correct
    // and every lesson is at full mastery, so no module gate interferes.
    const session = makeSession({
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
        correct('lesson-1-2', 'cp-1-2-quiz'),
        correct('lesson-1-2', 'cp-1-2-fill'),
        correct('lesson-2-1', 'cp-2-1-note'),
        correct('lesson-2-1', 'cp-2-1-quiz'),
        correct('lesson-2-2', 'cp-2-2-fill'),
      ],
      mastery: makeMastery({
        'lesson-1-1': 100,
        'lesson-1-2': 100,
        'lesson-2-1': 100,
        'lesson-2-2': 100,
      }),
      currentLessonId: 'lesson-2-2',
      currentCheckpointId: 'cp-2-2-quiz',
    });
    const attempt: Attempt = {
      lessonId: 'lesson-2-2',
      checkpointId: 'cp-2-2-quiz',
      selectedOptionId: CORRECT_OPTION_ID,
      isCorrect: true,
      timestamp: FIXED_TIMESTAMP,
      revealsUsed: 0,
    };

    // Act
    const outcome = submitAnswer(track, session, attempt);

    // Assert
    expect(outcome.feedback.correct).toBe(true);
    expect(outcome.feedback.next).toBeUndefined();
    expect(outcome.session.currentLessonId).toBe('lesson-2-2');
    expect(outcome.session.currentCheckpointId).toBeUndefined();
    expect(outcome.session.completedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// reconcileSessionCursor
// ---------------------------------------------------------------------------

describe('reconcileSessionCursor', () => {
  it('leaves a session with no cursor set untouched', () => {
    // Arrange
    const session = makeSession({ attempts: [] });

    // Act
    const result = reconcileSessionCursor(track, session);

    // Assert
    expect(result).toBe(session);
  });

  it('leaves the cursor untouched when it points at a checkpoint with no correct attempt yet', () => {
    // Arrange — includes the legitimate "wrong answer, not yet retried" case:
    // reconciliation must not treat this as stale, or a learner mid-quiz who
    // merely reloads the page would get bumped off the question they're
    // still working on.
    const session = makeSession({
      attempts: [correct('lesson-1-1', 'cp-1-1-note'), wrong('lesson-1-1', 'cp-1-1-quiz')],
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-1-1-quiz',
    });

    // Act
    const result = reconcileSessionCursor(track, session);

    // Assert
    expect(result).toBe(session);
  });

  it('corrects a stale cursor pointing at an already correctly-attempted checkpoint', () => {
    // Arrange — this is exactly the shape of state a learner's browser could
    // be left holding from before today's fix: attempts show cp-1-1-note
    // done, but the persisted cursor never advanced past it.
    const session = makeSession({
      attempts: [correct('lesson-1-1', 'cp-1-1-note')],
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-1-1-note',
    });

    // Act
    const result = reconcileSessionCursor(track, session);

    // Assert — recomputed via the same selectNextCheckpoint the rest of the
    // app trusts, so a corrected cursor can never disagree with it.
    expect(result.currentLessonId).toBe('lesson-1-1');
    expect(result.currentCheckpointId).toBe('cp-1-1-quiz');
    expect(result.attempts).toBe(session.attempts);
  });

  it('corrects a cursor pointing at a checkpoint id that no longer exists in the track', () => {
    // Arrange
    const session = makeSession({
      attempts: [correct('lesson-1-1', 'cp-1-1-note')],
      currentLessonId: 'lesson-1-1',
      currentCheckpointId: 'cp-does-not-exist',
    });

    // Act
    const result = reconcileSessionCursor(track, session);

    // Assert
    expect(result.currentLessonId).toBe('lesson-1-1');
    expect(result.currentCheckpointId).toBe('cp-1-1-quiz');
  });

  it('falls back to currentCheckpointId undefined when nothing is left to correct to', () => {
    // Arrange — every checkpoint in the track is done, but the stored cursor
    // is stale (still pointing at the last one, which is now "attempted").
    const session = makeSession({
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        correct('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
        correct('lesson-1-2', 'cp-1-2-quiz'),
        correct('lesson-1-2', 'cp-1-2-fill'),
        correct('lesson-2-1', 'cp-2-1-note'),
        correct('lesson-2-1', 'cp-2-1-quiz'),
        correct('lesson-2-2', 'cp-2-2-fill'),
        correct('lesson-2-2', 'cp-2-2-quiz'),
      ],
      mastery: makeMastery({
        'lesson-1-1': 100,
        'lesson-1-2': 100,
        'lesson-2-1': 100,
        'lesson-2-2': 100,
      }),
      currentLessonId: 'lesson-2-2',
      currentCheckpointId: 'cp-2-2-quiz',
    });

    // Act
    const result = reconcileSessionCursor(track, session);

    // Assert — currentLessonId is preserved (nothing better to point it at),
    // currentCheckpointId clears since there's truly nothing left.
    expect(result.currentLessonId).toBe('lesson-2-2');
    expect(result.currentCheckpointId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// countCompletedCheckpoints
// ---------------------------------------------------------------------------

describe('countCompletedCheckpoints', () => {
  interface CountCase {
    name: string;
    attempts: Attempt[];
    expected: number;
  }

  const cases: CountCase[] = [
    {
      name: 'returns 0 when there are no attempts',
      attempts: [],
      expected: 0,
    },
    {
      name: 'counts a single correct attempt once',
      attempts: [correct('lesson-1-1', 'cp-1-1-quiz')],
      expected: 1,
    },
    {
      // REGRESSION ("Try again" was inflating the overall progress counter,
      // commit fd11c3e): a wrong attempt plus a later correct retry on the
      // same checkpoint is ONE completed checkpoint, not two attempts' worth.
      name: 'counts a wrong attempt followed by a later correct retry exactly once',
      attempts: [wrong('lesson-1-1', 'cp-1-1-quiz'), correct('lesson-1-1', 'cp-1-1-quiz')],
      expected: 1,
    },
    {
      name: 'counts repeated correct attempts on the same checkpoint once',
      attempts: [correct('lesson-1-1', 'cp-1-1-quiz'), correct('lesson-1-1', 'cp-1-1-quiz')],
      expected: 1,
    },
    {
      name: 'does not count checkpoints with only wrong attempts',
      attempts: [wrong('lesson-1-1', 'cp-1-1-quiz')],
      expected: 0,
    },
    {
      name: 'counts distinct correctly-answered checkpoints and ignores wrong-only ones',
      attempts: [
        correct('lesson-1-1', 'cp-1-1-note'),
        wrong('lesson-1-1', 'cp-1-1-quiz'),
        correct('lesson-1-1', 'cp-1-1-fill'),
      ],
      expected: 2,
    },
  ];

  it.each(cases)('$name', ({ attempts, expected }) => {
    expect(countCompletedCheckpoints(attempts)).toBe(expected);
  });
});
