import { useState } from 'react';
import type { ReactElement } from 'react';

import { saveOnboarding } from '../lib/api';
import {
  LEARNING_GOAL_OPTIONS,
  saveLocalOnboarding,
  STARTING_LEVEL_OPTIONS,
  type LearningGoal,
  type StartingLevel,
} from '../lib/onboarding';
import { useAppStore } from '../state/store';

type Step = 'welcome' | 'level' | 'goal';

export function Onboarding(): ReactElement {
  const { authStatus } = useAppStore();
  const [step, setStep] = useState<Step>('welcome');
  const [startingLevel, setStartingLevel] = useState<StartingLevel | null>(null);
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!startingLevel || !learningGoal) return;
    setSaving(true);
    try {
      if (authStatus === 'authenticated') {
        await saveOnboarding(startingLevel, learningGoal);
      } else {
        saveLocalOnboarding({ startingLevel, learningGoal });
      }
    } finally {
      window.location.href = '/tracks';
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card space-y-6 p-8">
        {step === 'welcome' ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Welcome to PyLearn</h2>
            <p className="text-sm text-slate-300">
              PyLearn teaches Python through short lessons and hands-on checkpoints — multiple
              choice, fill-in-the-blank, and live code you run yourself. When you're stuck, hints
              escalate step by step, and you can ask our AI tutor a question about exactly what
              you're looking at. Wrong answers let you try again with feedback, not just move on.
            </p>
            <p className="text-sm text-slate-300">
              Two quick questions first, so we can start you in the right place.
            </p>
            <button type="button" className="btn-primary" onClick={() => setStep('level')}>
              Get started
            </button>
          </div>
        ) : null}

        {step === 'level' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Where are you starting from?</h2>
            <div className="space-y-2">
              {STARTING_LEVEL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-150 ${
                    startingLevel === option.value
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="startingLevel"
                    className="accent-primary"
                    checked={startingLevel === option.value}
                    onChange={() => setStartingLevel(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!startingLevel}
              onClick={() => setStep('goal')}
            >
              Continue
            </button>
          </div>
        ) : null}

        {step === 'goal' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">What do you want Python for?</h2>
            <p className="text-xs text-slate-400">
              This personalizes recommendations now, and will unlock matching tracks as they're
              published — everyone currently takes the same Python Basics track.
            </p>
            <div className="space-y-2">
              {LEARNING_GOAL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-150 ${
                    learningGoal === option.value
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="learningGoal"
                    className="accent-primary"
                    checked={learningGoal === option.value}
                    onChange={() => setLearningGoal(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!learningGoal || saving}
              onClick={() => void handleFinish()}
            >
              {saving ? 'Saving…' : 'Start learning'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
