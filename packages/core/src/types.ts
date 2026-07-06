export type CheckpointType = 'note' | 'quiz-mcq' | 'fill-blank' | 'code-cell';

export type HintLevel = 'H0' | 'H1' | 'H2';
export type HintStage = HintLevel | 'REVEAL';

export interface CheckpointBase<TType extends CheckpointType> {
  /** Stable identifier that matches lesson data */
  id: string;
  /** Discriminator for the checkpoint variant */
  type: TType;
  /** Display title for learners */
  title: string;
  /** Instructional content or prompt body */
  content: string;
  /** Hint copy keyed by hint level */
  hints?: Record<HintLevel, string>;
}

export interface NoteCheckpoint extends CheckpointBase<'note'> {
  /** Explanation delivered after completion */
  explanation: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  whyRight?: string;
  whyWrong?: string;
}

export interface QuizCheckpoint extends CheckpointBase<'quiz-mcq'> {
  /** Answer choices with correctness metadata */
  options: QuizOption[];
  /** Explanation surfaced once the learner submits */
  explanation: string;
}

export interface FillBlankCheckpoint extends CheckpointBase<'fill-blank'> {
  /** Exact answer string expected from the learner */
  answer: string;
  /** Explanation displayed post-submission */
  explanation: string;
}

export interface CodeCellCheckpoint extends CheckpointBase<'code-cell'> {
  /** Starter code snippet shown in the editor */
  starterCode: string;
  /** Canonical reference solution used for evaluation */
  solution: string;
  /** Expected stdout emitted by the solution */
  expectedOutput: string;
  /** Explanation surfaced once the learner submits */
  explanation: string;
}

export type Checkpoint = NoteCheckpoint | QuizCheckpoint | FillBlankCheckpoint | CodeCellCheckpoint;

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  description?: string;
  durationMinutes: number;
  checkpoints: Checkpoint[];
}

export type ModuleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Module {
  id: string;
  trackId: string;
  title: string;
  summary: string;
  description?: string;
  lessons: Lesson[];
  /** Rough level, used for future placement/personalization — not enforced yet. */
  difficulty?: ModuleDifficulty;
  /** Career-goal relevance keys (e.g. 'devops', 'network') for future personalization rules. */
  tags?: string[];
  /** Module ids that should be completed before this one, for future gating rules. */
  prerequisites?: string[];
}

export interface Track {
  id: string;
  title: string;
  summary: string;
  description?: string;
  modules: Module[];
}

export interface Attempt {
  /** Identifier of the checkpoint being answered */
  checkpointId: string;
  /** Identifier of the lesson that owns the checkpoint */
  lessonId: string;
  /** Selected option identifier when applicable */
  selectedOptionId?: string;
  /** Freeform response value for text/code checkpoints */
  responseText?: string;
  /** UTC timestamp recorded for the submission */
  timestamp: number;
  /** Whether the learner produced a correct response */
  isCorrect: boolean;
  /** Number of hints revealed before answering */
  revealsUsed: number;
  /** Highest hint stage reached before submission */
  lastHintLevel?: HintStage;
  /** Raw score computed for the attempt */
  score?: number;
}

export interface Mastery {
  /** Aggregate mastery percent across all tracked scopes */
  overallPercent: number;
  /** Mastery percent keyed by lesson identifier */
  lessonPercent: Record<string, number>;
  /** Timestamp representing last mastery update */
  updatedAt: number;
}

export interface SessionSummary {
  /** All attempts the learner performed in the session */
  attempts: Attempt[];
  /** Total score accumulated for the session */
  totalScore: number;
  /** Snapshot of mastery state at session end */
  mastery: Mastery;
  /** Optional notes for UI display */
  notes?: string;
}

export interface CheckpointRef {
  lessonId: string;
  checkpointId: string;
}

export interface SubmissionFeedback {
  correct: boolean;
  rationale: string;
  next?: CheckpointRef;
}

export interface SessionState {
  id: string;
  trackId: string;
  attempts: Attempt[];
  mastery: Mastery;
  startedAt: number;
  currentLessonId?: string;
  currentCheckpointId?: string;
  completedAt?: number;
}
