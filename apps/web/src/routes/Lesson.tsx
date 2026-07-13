import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { requestChat, requestHint } from '../lib/api';
import { Spinner } from '../lib/Spinner';
import { useAppStore } from '../state/store';

import { advanceHintLevel, countCompletedCheckpoints, hintUsageCount } from '@pylearn/core';
import type {
  Checkpoint,
  HintLevel,
  HintStage,
  Lesson as LessonType,
  SubmissionFeedback,
} from '@pylearn/core';
import { ChatBox, CodeCell, FillBlank, HintPanel, ProgressBar, QuizMCQ } from '@pylearn/ui-kit';
import type { ChatMessage } from '@pylearn/ui-kit';

interface LocalFeedback {
  correct: boolean;
  rationale: string;
  raw: SubmissionFeedback;
}

interface AiHint {
  content: string;
  provider: string;
}

const CHAT_PROMPTS_BY_TYPE: Record<Checkpoint['type'], string[]> = {
  'quiz-mcq': [
    'Why is this correct?',
    "I'm stuck, explain differently",
    'Give me a simpler example',
  ],
  'fill-blank': ["I'm stuck, explain differently", 'Give me a simpler example'],
  'code-cell': ['Why did my code fail?', "I'm stuck, explain differently"],
  note: ['Can you explain this another way?', 'Give me a real-world example'],
};

const HINT_LEVELS: HintLevel[] = ['H0', 'H1', 'H2'];

function isHintLevel(level: HintStage | null): level is HintLevel {
  return level !== null && (HINT_LEVELS as HintStage[]).includes(level);
}

export function Lesson(): ReactElement {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const {
    track,
    session,
    loading,
    error,
    authStatus,
    currentLesson,
    currentCheckpoint,
    submitAttempt,
    attempts,
    setActiveLesson,
  } = useAppStore();

  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>();
  const [fillValue, setFillValue] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [hintStage, setHintStage] = useState<HintStage | null>(null);
  const [feedback, setFeedback] = useState<LocalFeedback | null>(null);
  const [aiHints, setAiHints] = useState<Partial<Record<HintLevel, AiHint>>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (currentCheckpoint?.type === 'code-cell') {
      setCodeValue(currentCheckpoint.starterCode ?? '');
    } else {
      setCodeValue('');
    }
    setSelectedOptionId(undefined);
    setFillValue('');
    setHintStage(null);
    setFeedback(null);
    setAiHints({});
    setChatMessages([]);
    setChatLoading(false);
  }, [currentCheckpoint?.id]);

  const lessonExistsInTrack = useMemo(() => {
    if (!track || !lessonId) return false;
    return track.modules.some((module) => module.lessons.some((item) => item.id === lessonId));
  }, [track, lessonId]);

  // The URL's lessonId is the source of truth for which lesson to show —
  // sync the session's cursor to match whenever they differ (e.g. a
  // bookmarked URL, browser back/forward, or a typed-in address), rather
  // than always rendering whatever the session happened to be on.
  useEffect(() => {
    if (lessonExistsInTrack && lessonId && session && session.currentLessonId !== lessonId) {
      void setActiveLesson(lessonId);
    }
  }, [lessonExistsInTrack, lessonId, session, setActiveLesson]);

  const lesson =
    lessonExistsInTrack && currentLesson?.id === lessonId
      ? (currentLesson as LessonType)
      : undefined;

  useEffect(() => {
    if (
      authStatus !== 'authenticated' ||
      !track ||
      !lesson ||
      !currentCheckpoint ||
      !isHintLevel(hintStage) ||
      aiHints[hintStage]
    ) {
      return;
    }

    let cancelled = false;
    requestHint({
      trackId: track.id,
      lessonId: lesson.id,
      checkpointId: currentCheckpoint.id,
      level: hintStage,
    })
      .then((response) => {
        if (!cancelled) {
          setAiHints((prev) => ({ ...prev, [hintStage]: response }));
        }
      })
      .catch(() => {
        // Silent fallback to the authored static hint text already shown.
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, track, lesson, currentCheckpoint, hintStage, aiHints]);

  const totalCheckpoints = track
    ? track.modules.reduce(
        (count, module) =>
          count +
          module.lessons.reduce((acc, lessonItem) => acc + lessonItem.checkpoints.length, 0),
        0,
      )
    : 0;

  const completed = countCompletedCheckpoints(attempts);

  const revealText = useMemo(() => getRevealText(currentCheckpoint), [currentCheckpoint]);
  const nextRef = feedback?.raw.next;

  const handleHintAdvance = () => {
    setHintStage((previous) => advanceHintLevel(previous ?? null));
  };

  const applyFeedback = (result: SubmissionFeedback | undefined) => {
    if (!result) return;
    setFeedback({ correct: result.correct, rationale: result.rationale, raw: result });
  };

  const handleMCQSubmit = async (optionId: string) => {
    if (!currentCheckpoint || currentCheckpoint.type !== 'quiz-mcq' || !lesson) return;
    const option = currentCheckpoint.options.find((item) => item.id === optionId);
    if (!option) return;
    setSelectedOptionId(optionId);

    const result = await submitAttempt({
      lessonId: lesson.id,
      checkpointId: currentCheckpoint.id,
      selectedOptionId: optionId,
      isCorrect: option.isCorrect,
      revealsUsed: hintUsageCount(hintStage),
      lastHintLevel: hintStage,
    });

    applyFeedback(result);
  };

  const handleFillSubmit = async () => {
    if (!currentCheckpoint || currentCheckpoint.type !== 'fill-blank' || !lesson) return;
    const expected = currentCheckpoint.answer.trim();
    const response = fillValue.trim();
    const isCorrect = response.localeCompare(expected, undefined, { sensitivity: 'accent' }) === 0;

    const result = await submitAttempt({
      lessonId: lesson.id,
      checkpointId: currentCheckpoint.id,
      responseText: fillValue,
      isCorrect,
      revealsUsed: hintUsageCount(hintStage),
      lastHintLevel: hintStage,
    });

    applyFeedback(result);
  };

  const handleCodeSubmit = async () => {
    if (!currentCheckpoint || currentCheckpoint.type !== 'code-cell' || !lesson) return;
    const result = await submitAttempt({
      lessonId: lesson.id,
      checkpointId: currentCheckpoint.id,
      responseText: codeValue,
      isCorrect: true,
      revealsUsed: hintUsageCount(hintStage),
      lastHintLevel: hintStage,
    });

    applyFeedback(result);
  };

  const handleNoteContinue = async () => {
    if (!currentCheckpoint || currentCheckpoint.type !== 'note' || !lesson) return;
    const result = await submitAttempt({
      lessonId: lesson.id,
      checkpointId: currentCheckpoint.id,
      isCorrect: true,
      revealsUsed: 0,
      lastHintLevel: null,
    });

    applyFeedback(result);
  };

  const handleChatSend = async (message: string) => {
    if (!track || !lesson || !currentCheckpoint) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);
    try {
      const response = await requestChat({
        trackId: track.id,
        lessonId: lesson.id,
        checkpointId: currentCheckpoint.id,
        message,
      });
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.content, provider: response.provider },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't answer that just now. Try again in a moment.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleNext = () => {
    if (nextRef) {
      setActiveLesson(nextRef.lessonId);
      if (nextRef.lessonId !== lessonId) {
        navigate(`/lesson/${nextRef.lessonId}`);
      }
    }
    setHintStage(null);
    setFeedback(null);
    setSelectedOptionId(undefined);
    setFillValue('');
    if (currentCheckpoint?.type === 'code-cell') {
      setCodeValue(currentCheckpoint.starterCode ?? '');
    } else {
      setCodeValue('');
    }
  };

  const handleTryAgain = () => {
    setFeedback(null);
    setSelectedOptionId(undefined);
  };

  const canProgress = Boolean(feedback?.correct) || hintStage === 'REVEAL';

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Loading lesson…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-white">Lesson</h2>
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!track || !lessonExistsInTrack) {
    return (
      <div className="card mx-auto max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-white">Lesson</h2>
        <p className="mt-3 text-sm text-slate-300">
          Invalid lesson. Return to the{' '}
          <Link className="text-primary" to="/tracks">
            track list
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!lesson) {
    // Valid lessonId, but the session cursor hasn't synced to it yet.
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Loading lesson…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="terminal-heading text-2xl">{lesson.title}</h1>
            <p className="mt-1 text-sm text-slate-300">{lesson.summary}</p>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar value={completed} max={totalCheckpoints} label={'Overall Progress'} />
          </div>
        </div>
      </div>

      {currentCheckpoint ? (
        <div className="ide-window">
          <div className="ide-window-header">
            <span className="ide-dot bg-red-500/70" aria-hidden="true" />
            <span className="ide-dot bg-amber-500/70" aria-hidden="true" />
            <span className="ide-dot bg-emerald-500/70" aria-hidden="true" />
            <span className="ide-tab ide-tab-active ml-2">
              {lessonId?.replace('lesson.', '').replace(/\./g, ' › ')}
            </span>
          </div>
          <div className="space-y-5 p-6">
            <header className="space-y-2">
              <h2 className="terminal-heading text-xl">{currentCheckpoint.title}</h2>
              {/* quiz-mcq and fill-blank already render checkpoint.content themselves
                  (as the legend / field label) — showing it here too would repeat it. */}
              {currentCheckpoint.type !== 'quiz-mcq' && currentCheckpoint.type !== 'fill-blank' ? (
                <p className="text-sm text-slate-300">{currentCheckpoint.content}</p>
              ) : null}
            </header>

            {currentCheckpoint.type !== 'note' && (currentCheckpoint.hints || revealText) ? (
              <div className="space-y-1">
                <HintPanel
                  h0={aiHints.H0?.content ?? currentCheckpoint.hints?.H0}
                  h1={aiHints.H1?.content ?? currentCheckpoint.hints?.H1}
                  h2={aiHints.H2?.content ?? currentCheckpoint.hints?.H2}
                  revealedAnswerText={revealText}
                  level={hintStage}
                  disabled={Boolean(feedback)}
                  onNextLevel={handleHintAdvance}
                />
                {isHintLevel(hintStage) &&
                aiHints[hintStage] &&
                aiHints[hintStage]?.provider !== 'template' ? (
                  <p className="text-xs text-slate-500">
                    Rephrased by our AI tutor ({aiHints[hintStage]?.provider})
                  </p>
                ) : null}
              </div>
            ) : null}

            <CheckpointContent
              checkpoint={currentCheckpoint}
              selectedOptionId={selectedOptionId}
              setSelectedOptionId={setSelectedOptionId}
              fillValue={fillValue}
              setFillValue={setFillValue}
              codeValue={codeValue}
              setCodeValue={setCodeValue}
              submitted={Boolean(feedback)}
              onMCQSubmit={handleMCQSubmit}
              onFillSubmit={handleFillSubmit}
              onCodeSubmit={handleCodeSubmit}
              onNoteContinue={handleNoteContinue}
            />

            {feedback ? (
              <footer className="flex items-center justify-between rounded-lg bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                <span>
                  {currentCheckpoint.type === 'note'
                    ? '📝 Noted'
                    : feedback.correct
                      ? `✅ Correct — ${feedback.rationale}`
                      : `❌ Incorrect — ${feedback.rationale}`}
                </span>
                {canProgress ? (
                  nextRef ? (
                    <button type="button" onClick={handleNext} className="btn btn-primary">
                      Next checkpoint
                    </button>
                  ) : (
                    <Link to="/tracks" className="btn btn-secondary">
                      Back to tracks
                    </Link>
                  )
                ) : (
                  <button type="button" onClick={handleTryAgain} className="btn btn-primary">
                    Try again
                  </button>
                )}
              </footer>
            ) : null}

            {authStatus === 'authenticated' ? (
              <ChatBox
                messages={chatMessages}
                suggestedPrompts={CHAT_PROMPTS_BY_TYPE[currentCheckpoint.type]}
                onSend={(message) => void handleChatSend(message)}
                loading={chatLoading}
              />
            ) : (
              <p className="text-xs text-slate-500">
                <Link to="/login" className="text-primary-light underline">
                  Sign in
                </Link>{' '}
                to ask our AI tutor a question about this checkpoint.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <p className="text-sm text-slate-300">
            Lesson complete! Choose another lesson on the{' '}
            <Link className="text-primary" to="/tracks">
              track overview
            </Link>{' '}
            or review your attempts.
          </p>
        </div>
      )}
    </div>
  );
}

interface CheckpointContentProps {
  checkpoint: Checkpoint;
  selectedOptionId: string | undefined;
  setSelectedOptionId: (_value: string | undefined) => void;
  fillValue: string;
  setFillValue: (_value: string) => void;
  codeValue: string;
  setCodeValue: (_value: string) => void;
  submitted: boolean;
  onMCQSubmit: (_optionId: string) => void;
  onFillSubmit: () => void;
  onCodeSubmit: () => void;
  onNoteContinue: () => void;
}

function CheckpointContent({
  checkpoint,
  selectedOptionId,
  setSelectedOptionId,
  fillValue,
  setFillValue,
  codeValue: _codeValue,
  setCodeValue,
  submitted,
  onMCQSubmit,
  onFillSubmit,
  onCodeSubmit,
  onNoteContinue,
}: CheckpointContentProps): ReactElement | null {
  switch (checkpoint.type) {
    case 'quiz-mcq':
      return (
        <QuizMCQ
          questionId={checkpoint.id}
          question={checkpoint.content}
          options={checkpoint.options.map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect: option.isCorrect,
            whyRight: option.whyRight ?? option.explanation,
            whyWrong: option.whyWrong ?? option.explanation,
          }))}
          disabled={submitted}
          initialSelectionId={selectedOptionId}
          onSelectionChange={setSelectedOptionId}
          onSubmit={onMCQSubmit}
        />
      );
    case 'fill-blank':
      return (
        <FillBlank
          questionId={checkpoint.id}
          prompt={checkpoint.content}
          value={fillValue}
          placeholder={checkpoint.answer}
          disabled={submitted}
          onChange={(event) => setFillValue(event.target.value)}
          onSubmitAnswer={({ value }) => {
            setFillValue(value);
            onFillSubmit();
          }}
        />
      );
    case 'code-cell':
      return (
        <div className="space-y-3">
          <CodeCell
            checkpointId={checkpoint.id}
            prompt={checkpoint.content}
            language="python"
            initialCode={checkpoint.starterCode}
            expectedOutput={checkpoint.expectedOutput}
            disabled={submitted}
            onCodeChange={({ source }) => setCodeValue(source)}
            onEvaluate={({ source }) => setCodeValue(source)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitted}
            onClick={onCodeSubmit}
          >
            Submit
          </button>
        </div>
      );
    case 'note':
    default:
      return (
        <div className="space-y-3">
          <div
            className="rounded-md border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200"
            role="note"
          >
            {checkpoint.explanation}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitted}
            onClick={onNoteContinue}
          >
            Continue
          </button>
        </div>
      );
  }
}

function getRevealText(checkpoint?: Checkpoint | null): string | undefined {
  if (!checkpoint) return undefined;
  switch (checkpoint.type) {
    case 'quiz-mcq': {
      const correct = checkpoint.options.find((option) => option.isCorrect);
      if (!correct) return undefined;
      const explanation = correct.whyRight ?? correct.explanation;
      const detail = explanation ? ` — ${explanation}` : '';
      return `Answer: ${correct.text}${detail}`;
    }
    case 'fill-blank':
      return `Answer: ${checkpoint.answer}`;
    case 'code-cell':
      if (checkpoint.expectedOutput) {
        return `Expected output: ${checkpoint.expectedOutput}`;
      }
      return checkpoint.explanation;
    case 'note':
    default:
      return checkpoint.explanation;
  }
}
