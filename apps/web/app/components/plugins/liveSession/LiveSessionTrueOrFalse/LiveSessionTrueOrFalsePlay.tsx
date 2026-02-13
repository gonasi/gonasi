import { useState } from 'react';
import { Check, X } from 'lucide-react';

import type { LiveSessionPlayComponentProps } from '../core/types';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { TrueOrFalseOptionsButton } from '~/components/ui/button';
import { useTimer } from '~/hooks/useTimer';
import { cn } from '~/lib/utils';

/**
 * LiveSessionTrueOrFalsePlay - Interactive play component for True/False blocks
 *
 * Mode behavior:
 * - test: Full interactive experience, no database writes (for facilitators testing)
 * - live: Full interactive experience with database writes and real-time sync (for participants)
 *
 * Differences from View component:
 * - View: Static display (for preview/editing)
 * - Play: Interactive with answer selection, real-time features, timing, and scoring
 */
export function LiveSessionTrueOrFalsePlay({ block, mode }: LiveSessionPlayComponentProps) {
  // Type narrowing
  if (block.plugin_type !== 'live_session_true_or_false') {
    return null;
  }

  const { questionState, correctAnswer } = block.content;
  const { layoutStyle } = block.settings;

  // Local state for interaction
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const answerOptions = [true, false];
  const isTestMode = mode === 'test';

  // Auto-submit handler
  const handleAutoSubmit = () => {
    if (!hasSubmitted) {
      handleSubmit();
    }
  };

  // Timer countdown
  const { timeRemaining, start } = useTimer({
    initialTime: block.time_limit,
    onComplete: handleAutoSubmit,
    autoStart: true,
  });

  // Submit handler
  const handleSubmit = () => {
    if (hasSubmitted) return;

    const timeTaken = block.time_limit - timeRemaining;
    const isCorrect = selectedAnswer === correctAnswer;

    if (isTestMode) {
      // Test mode: Just update UI, no database writes
      console.log('[Test Mode] Answer submitted:', {
        selected: selectedAnswer,
        correct: correctAnswer,
        isCorrect,
        timeTaken,
      });
      setHasSubmitted(true);
    } else {
      // Live mode: Submit to database
      // TODO: Submit response to live_session_responses table
      // TODO: Calculate score based on time taken and correctness
      // TODO: Update participant stats
      // TODO: Trigger real-time leaderboard update
      console.log('[Live Mode] Submitting to database:', {
        blockId: block.id,
        selected: selectedAnswer,
        isCorrect,
        timeTaken,
      });
      setHasSubmitted(true);
    }
  };

  return (
    <div className='w-full space-y-4'>
      {/* Mode indicator for test mode */}
      {isTestMode && (
        <div className='bg-primary/10 border-primary rounded-md border px-3 py-2 text-sm'>
          🧪 Test Mode - No data will be saved
        </div>
      )}

      {/* Timer Display */}
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          Difficulty: <span className='capitalize'>{block.difficulty}</span>
        </div>
        <div
          className={cn('text-sm font-semibold', {
            'text-danger animate-pulse': timeRemaining <= 5 && !hasSubmitted,
            'text-warning': timeRemaining <= 10 && timeRemaining > 5 && !hasSubmitted,
            'text-muted-foreground': timeRemaining > 10 || hasSubmitted,
          })}
        >
          Time: {timeRemaining}s
        </div>
      </div>

      {/* Question */}
      <RichTextRenderer editorState={questionState} />

      {/* Answer Options */}
      <div
        className={cn('gap-4 py-0', {
          'grid grid-cols-1': layoutStyle === 'single',
          'grid grid-cols-2': layoutStyle === 'double',
        })}
      >
        {answerOptions.map((val) => {
          const isSelected = selectedAnswer === val;
          const isCorrect = hasSubmitted && val === correctAnswer;
          const isWrong = hasSubmitted && isSelected && val !== correctAnswer;

          return (
            <div key={String(val)} className='relative w-full'>
              <TrueOrFalseOptionsButton
                val={val}
                icon={val ? <Check /> : <X />}
                isSelected={isSelected}
                isDisabled={hasSubmitted}
                selectOption={() => setSelectedAnswer(val)}
              />

              {/* Show result indicator after submission */}
              {hasSubmitted && (
                <div className='absolute -top-1.5 -right-1.5 rounded-full'>
                  {isCorrect && (
                    <Check
                      size={14}
                      className='text-success-foreground bg-success rounded-full p-0.5'
                    />
                  )}
                  {isWrong && (
                    <X size={14} className='text-danger-foreground bg-danger rounded-full p-0.5' />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!hasSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-2 font-semibold disabled:opacity-50'
        >
          Submit Answer
        </button>
      )}

      {/* Result Display */}
      {hasSubmitted && (
        <div
          className={cn('rounded-lg p-4', {
            'bg-success/10': selectedAnswer === correctAnswer,
            'bg-danger/10': selectedAnswer !== correctAnswer,
          })}
        >
          <p className='font-semibold'>
            {selectedAnswer === correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {isTestMode
              ? 'Test response recorded (not saved to database)'
              : 'Your response has been recorded'}
          </p>
        </div>
      )}

      {/* TODO: Implementation notes */}
      <div className='border-border rounded-lg border p-4'>
        <p className='text-muted-foreground text-sm'>TODO: Implement additional features:</p>
        <ul className='text-muted-foreground mt-2 list-inside list-disc text-xs'>
          <li>Real countdown timer with auto-submit</li>
          {!isTestMode && (
            <>
              <li>Submit to live_session_responses table (live mode only)</li>
              <li>Real-time leaderboard update (live mode only)</li>
              <li>Supabase Realtime sync for facilitator control (live mode only)</li>
            </>
          )}
          <li>Score calculation (100 points - penalties for time/attempts)</li>
          <li>Show explanation after submission</li>
          <li>Handle session paused/ended states</li>
          {isTestMode && <li>Test mode - full experience, no DB writes</li>}
        </ul>
      </div>
    </div>
  );
}
