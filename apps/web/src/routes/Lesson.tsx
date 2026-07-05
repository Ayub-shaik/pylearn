import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAppStore } from '../state/store';

import { advanceHintLevel, hintUsageCount } from '@pylearn/core';
import type {
  Checkpoint,
  HintStage,
  Lesson as LessonType,
  SubmissionFeedback,
} from '@pylearn/core';
import { CodeCell, FillBlank, HintPanel, ProgressBar, QuizMCQ } from '@pylearn/ui-kit';

interface LocalFeedback {
  correct: boolean;
  rationale: string;
  raw: SubmissionFeedback;
}

export function Lesson(): ReactElement {
  const { lessonId } = useParams<{ lessonId: string }>();
  const {
    track,
    loading,
    error,
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
  }, [currentCheckpoint?.id]);

  const lesson = useMemo(() => {
    if (currentLesson) return currentLesson as LessonType;
    if (!track || !lessonId) return undefined;
    for (const module of track.modules) {
      const candidate = module.lessons.find((item) => item.id === lessonId);
      if (candidate) return candidate;
    }
    return undefined;
  }, [currentLesson, lessonId, track]);

  const totalCheckpoints = track
    ? track.modules.reduce(
        (count, module) =>
          count +
          module.lessons.reduce((acc, lessonItem) => acc + lessonItem.checkpoints.length, 0),
        0,
      )
    : 0;

  const completed = attempts.length;

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

  const handleNext = () => {
    if (nextRef) {
      setActiveLesson(nextRef.lessonId);
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

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <p className="text-slate-300">Loading lesson…</p>
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

  if (!lesson || !track) {
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

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{lesson.title}</h1>
            <p className="mt-1 text-sm text-slate-300">{lesson.summary}</p>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar value={completed} max={totalCheckpoints} label={'Overall Progress'} />
          </div>
        </div>
      </div>

      {currentCheckpoint ? (
        <div className="card p-6 space-y-5">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {lessonId?.replace('lesson.', '').replace(/\./g, ' › ')}
            </p>
            <h2 className="text-xl font-semibold text-white">{currentCheckpoint.title}</h2>
            <p className="text-sm text-slate-300">{currentCheckpoint.content}</p>
          </header>

          {currentCheckpoint.hints || revealText ? (
            <HintPanel
              h0={currentCheckpoint.hints?.H0}
              h1={currentCheckpoint.hints?.H1}
              h2={currentCheckpoint.hints?.H2}
              revealedAnswerText={revealText}
              level={hintStage}
              disabled={Boolean(feedback)}
              onNextLevel={handleHintAdvance}
            />
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
          />

          {feedback ? (
            <footer className="flex items-center justify-between rounded-lg bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
              <span>
                {feedback.correct ? '✅ Correct' : '❌ Incorrect'} — {feedback.rationale}
              </span>
              {nextRef ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next checkpoint
                </button>
              ) : (
                <Link to="/tracks" className="btn btn-secondary">
                  Back to tracks
                </Link>
              )}
            </footer>
          ) : null}
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
        <div
          className="rounded-md border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200"
          role="note"
        >
          {checkpoint.explanation}
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
