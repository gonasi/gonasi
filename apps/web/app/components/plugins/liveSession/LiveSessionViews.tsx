/**
 * Live Session View Components
 *
 * These are view components for live sessions with real-time features.
 * They're separate from the regular course block views to allow for:
 * - Real-time participation tracking
 * - Instructor controls (start/stop/skip questions)
 * - Live student response aggregation
 * - Status-based rendering (pending/active/closed)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Pause, Play, SkipForward, Timer as TimerIcon, Trophy, X } from 'lucide-react';

import type { LiveSessionViewComponentProps } from './core/types';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { cn } from '~/lib/utils';

/**
 * Base wrapper for live session views
 * Provides common layout and structure
 */
function BaseLiveSessionView({
  block,
  children,
}: LiveSessionViewComponentProps & { children?: React.ReactNode }) {
  return (
    <div className='w-full space-y-4'>
      {/* Placeholder for live session content */}
      <div className='text-muted-foreground rounded-lg border border-dashed p-8 text-center'>
        <p className='text-sm'>Live Session View</p>
        <p className='text-muted-foreground mt-1 text-xs'>Plugin: {block.plugin_type}</p>
        <p className='text-muted-foreground mt-1 text-xs'>Status: {block.status || 'pending'}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * Calculates score based on correctness and response time
 *
 * Scoring logic:
 * - Correct answer: 100 points base + time bonus (up to 50 points)
 * - Wrong answer: Small points based on speed (max 30 points)
 * - This ensures wrong answers submitted early rank higher than wrong answers submitted late
 * - But never rank higher than correct answers (even if correct answer is late)
 */
function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number,
  weight: number,
): number {
  const timeRatio = Math.max(0, Math.min(1, 1 - responseTimeMs / timeLimitMs));

  if (isCorrect) {
    // Correct: 100 base + up to 50 time bonus
    const baseScore = 100;
    const timeBonus = Math.floor(timeRatio * 50);
    return Math.floor((baseScore + timeBonus) * weight);
  } else {
    // Wrong: up to 30 points based on speed (never beats correct answer)
    const speedScore = Math.floor(timeRatio * 30);
    return Math.floor(speedScore * weight);
  }
}

type ResponseData = {
  participant_id: string;
  participant_name: string;
  answer: boolean;
  response_time_ms: number;
  score: number;
  is_correct: boolean;
};

/**
 * Live view for True or False plugin
 * Full implementation with timer, controls, and real-time leaderboard
 */
export function LiveTrueOrFalseView({ block }: LiveSessionViewComponentProps) {
  const content = block.content as any;
  const timeLimit = (block.time_limit || 30) * 1000; // Convert to ms
  const correctAnswer = content.correctAnswer === 'true';

  // Block state
  const [status, setStatus] = useState<'pending' | 'active' | 'closed' | 'skipped'>(
    (block.status as any) || 'pending',
  );
  const [activatedAt, setActivatedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // Response tracking
  const [responses, setResponses] = useState<ResponseData[]>([]);

  // Timer logic
  useEffect(() => {
    if (status !== 'active' || !activatedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - activatedAt;
      const remaining = Math.max(0, timeLimit - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        setStatus('closed');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status, activatedAt, timeLimit]);

  // Handle play button
  const handlePlay = useCallback(() => {
    setStatus('active');
    setActivatedAt(Date.now());
    setTimeLeft(timeLimit);
    setResponses([]);
  }, [timeLimit]);

  // Handle pause button
  const handlePause = useCallback(() => {
    setStatus('pending');
    setActivatedAt(null);
  }, []);

  // Handle skip button
  const handleSkip = useCallback(() => {
    setStatus('skipped');
    setActivatedAt(null);
  }, []);

  // Mock student response (for testing - will be replaced with real-time Supabase)
  const handleMockResponse = useCallback(
    (answer: boolean, participantName: string) => {
      if (status !== 'active' || !activatedAt) return;

      const responseTimeMs = Date.now() - activatedAt;
      const isCorrect = answer === correctAnswer;
      const score = calculateScore(isCorrect, responseTimeMs, timeLimit, block.weight || 2);

      const newResponse: ResponseData = {
        participant_id: `mock-${Date.now()}`,
        participant_name: participantName,
        answer,
        response_time_ms: responseTimeMs,
        score,
        is_correct: isCorrect,
      };

      setResponses((prev: ResponseData[]) => [...prev, newResponse]);
    },
    [status, activatedAt, correctAnswer, timeLimit, block.weight],
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const total = responses.length;
    const correct = responses.filter((r: ResponseData) => r.is_correct).length;
    const trueCount = responses.filter((r: ResponseData) => r.answer === true).length;
    const falseCount = responses.filter((r: ResponseData) => r.answer === false).length;
    const avgResponseTime =
      total > 0
        ? Math.round(
            responses.reduce((sum: number, r: ResponseData) => sum + r.response_time_ms, 0) / total,
          )
        : 0;

    return { total, correct, trueCount, falseCount, avgResponseTime };
  }, [responses]);

  // Sorted leaderboard
  const leaderboard = useMemo(() => {
    return [...responses].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [responses]);

  const progress = (timeLeft / timeLimit) * 100;
  const seconds = Math.ceil(timeLeft / 1000);

  return (
    <div className='w-full space-y-6'>
      {/* Question Display */}
      <div className='rounded-lg border bg-card p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <Badge variant='outline' className='text-xs'>
            <Trophy className='mr-1' size={12} />
            {block.weight || 2} points
          </Badge>
          <Badge
            variant={
              status === 'active'
                ? 'default'
                : status === 'closed'
                  ? 'secondary'
                  : status === 'skipped'
                    ? 'outline'
                    : 'outline'
            }
          >
            {status.toUpperCase()}
          </Badge>
        </div>

        <RichTextRenderer editorState={content.questionState} />
      </div>

      {/* Control Panel - Instructor View */}
      <div className='rounded-lg border bg-card p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='font-semibold'>Instructor Controls</h3>
          {status === 'active' && (
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2'>
                <TimerIcon className='text-muted-foreground' size={20} />
                <span
                  className={cn('font-mono text-lg font-semibold', {
                    'text-danger': seconds <= 5,
                    'text-warning': seconds > 5 && seconds <= 10,
                    'text-foreground': seconds > 10,
                  })}
                >
                  {seconds}s
                </span>
              </div>
              <Progress value={progress} className='h-2 w-32' />
            </div>
          )}
        </div>

        <div className='flex gap-2'>
          {status === 'pending' && (
            <Button onClick={handlePlay} className='gap-2'>
              <Play size={16} />
              Start Question
            </Button>
          )}
          {status === 'active' && (
            <>
              <Button onClick={handlePause} variant='secondary' className='gap-2'>
                <Pause size={16} />
                Pause
              </Button>
              <Button onClick={handleSkip} variant='ghost' className='gap-2'>
                <SkipForward size={16} />
                Skip
              </Button>
            </>
          )}
          {status === 'closed' && (
            <Button onClick={handlePlay} variant='ghost' className='gap-2'>
              <Play size={16} />
              Restart
            </Button>
          )}
        </div>

        {/* Mock Response Buttons (for testing) */}
        {status === 'active' && (
          <div className='mt-4 border-t pt-4'>
            <p className='text-muted-foreground mb-2 text-sm'>Test: Simulate student responses</p>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='secondary'
                onClick={() =>
                  handleMockResponse(true, `Student ${Math.floor(Math.random() * 100)}`)
                }
              >
                Mock True
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onClick={() =>
                  handleMockResponse(false, `Student ${Math.floor(Math.random() * 100)}`)
                }
              >
                Mock False
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Live Statistics */}
      {(status === 'active' || status === 'closed') && responses.length > 0 && (
        <div className='rounded-lg border bg-card p-4'>
          <h3 className='mb-4 font-semibold'>Live Stats</h3>

          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='rounded-lg bg-muted p-3'>
              <p className='text-muted-foreground text-xs'>Responses</p>
              <p className='text-2xl font-bold'>{stats.total}</p>
            </div>
            <div className='rounded-lg bg-muted p-3'>
              <p className='text-muted-foreground text-xs'>Correct</p>
              <p className='text-success text-2xl font-bold'>{stats.correct}</p>
            </div>
            <div className='rounded-lg bg-muted p-3'>
              <p className='text-muted-foreground text-xs'>True</p>
              <p className='text-2xl font-bold'>{stats.trueCount}</p>
            </div>
            <div className='rounded-lg bg-muted p-3'>
              <p className='text-muted-foreground text-xs'>False</p>
              <p className='text-2xl font-bold'>{stats.falseCount}</p>
            </div>
          </div>

          <div className='mt-4'>
            <p className='text-muted-foreground text-sm'>
              Avg Response Time: <span className='font-semibold'>{stats.avgResponseTime}ms</span>
            </p>
            <Progress value={(stats.correct / stats.total) * 100} className='mt-2 h-2' />
            <p className='text-muted-foreground mt-1 text-xs'>
              {Math.round((stats.correct / stats.total) * 100)}% correct
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {status === 'closed' && leaderboard.length > 0 && (
        <div className='rounded-lg border bg-card p-4'>
          <h3 className='mb-4 font-semibold'>Top 10 Leaderboard</h3>

          <div className='space-y-2'>
            {leaderboard.map((response: ResponseData, index: number) => (
              <div
                key={response.participant_id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  index === 0 && 'bg-warning/10 border-warning',
                  index === 1 && 'bg-muted/50',
                  index === 2 && 'bg-muted/30',
                )}
              >
                <div className='flex items-center gap-3'>
                  <span className='text-muted-foreground w-6 font-mono text-sm'>
                    #{index + 1}
                  </span>
                  <span className='font-medium'>{response.participant_name}</span>
                  {response.is_correct ? (
                    <Check size={16} className='text-success' />
                  ) : (
                    <X size={16} className='text-danger' />
                  )}
                </div>
                <div className='flex items-center gap-4'>
                  <span className='text-muted-foreground text-sm'>
                    {(response.response_time_ms / 1000).toFixed(2)}s
                  </span>
                  <span className='font-bold'>{response.score} pts</span>
                </div>
              </div>
            ))}
          </div>

          <div className='bg-muted mt-4 rounded-lg p-3'>
            <p className='text-muted-foreground text-xs'>
              Correct Answer: <span className='font-bold'>{correctAnswer ? 'TRUE' : 'FALSE'}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Live view for Multiple Choice Single Answer plugin
 */
export function LiveMultipleChoiceSingleView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>
        Multiple choice (single) question ready for live session
      </p>
    </BaseLiveSessionView>
  );
}

/**
 * Live view for Multiple Choice Multiple Answers plugin
 */
export function LiveMultipleChoiceMultipleView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>
        Multiple choice (multiple) question ready for live session
      </p>
    </BaseLiveSessionView>
  );
}

/**
 * Live view for Fill in the Blank plugin
 */
export function LiveFillInTheBlankView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>
        Fill in the blank question ready for live session
      </p>
    </BaseLiveSessionView>
  );
}

/**
 * Live view for Matching Game plugin
 */
export function LiveMatchingGameView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>Matching game ready for live session</p>
    </BaseLiveSessionView>
  );
}

/**
 * Live view for Swipe Categorize plugin
 */
export function LiveSwipeCategorizeView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>
        Swipe categorize activity ready for live session
      </p>
    </BaseLiveSessionView>
  );
}

/**
 * Default/fallback live view for plugins without a specific implementation
 */
export function DefaultLiveSessionView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>Live view not yet implemented</p>
    </BaseLiveSessionView>
  );
}
