import {
  bigserial,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const learningSessions = pgTable(
  'learning_sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackId: text('track_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    currentLessonId: text('current_lesson_id'),
    currentCheckpointId: text('current_checkpoint_id'),
    masteryOverallPct: numeric('mastery_overall_pct').notNull().default('0'),
    masteryLessonPct: jsonb('mastery_lesson_pct').notNull().default({}),
    masteryUpdatedAt: timestamp('mastery_updated_at', { withTimezone: true }),
  },
  (table) => ({
    userTrackUnique: uniqueIndex('learning_sessions_user_track_idx').on(
      table.userId,
      table.trackId,
    ),
  }),
);

export const attempts = pgTable('attempts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => learningSessions.id, { onDelete: 'cascade' }),
  checkpointId: text('checkpoint_id').notNull(),
  lessonId: text('lesson_id').notNull(),
  selectedOptionId: text('selected_option_id'),
  responseText: text('response_text'),
  isCorrect: boolean('is_correct').notNull(),
  revealsUsed: integer('reveals_used').notNull().default(0),
  lastHintLevel: text('last_hint_level'),
  score: numeric('score'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
});

export const llmGenerations = pgTable('llm_generations', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  checkpointId: text('checkpoint_id').notNull(),
  task: text('task').notNull(),
  content: text('content').notNull(),
  provider: text('provider').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
