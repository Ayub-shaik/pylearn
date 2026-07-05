CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub    text UNIQUE NOT NULL,
  email         text UNIQUE NOT NULL,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id                    text PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id              text NOT NULL,
  started_at            timestamptz NOT NULL,
  completed_at          timestamptz,
  current_lesson_id     text,
  current_checkpoint_id text,
  mastery_overall_pct   numeric NOT NULL DEFAULT 0,
  mastery_lesson_pct    jsonb NOT NULL DEFAULT '{}',
  mastery_updated_at    timestamptz,
  UNIQUE (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id                 bigserial PRIMARY KEY,
  session_id         text NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  checkpoint_id      text NOT NULL,
  lesson_id          text NOT NULL,
  selected_option_id text,
  response_text      text,
  is_correct         boolean NOT NULL,
  reveals_used       integer NOT NULL DEFAULT 0,
  last_hint_level    text,
  score              numeric,
  submitted_at       timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON attempts(session_id);

CREATE TABLE IF NOT EXISTS llm_generations (
  id            bigserial PRIMARY KEY,
  checkpoint_id text NOT NULL,
  task          text NOT NULL,
  content       text NOT NULL,
  provider      text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_llm_generations_checkpoint_task ON llm_generations(checkpoint_id, task);
