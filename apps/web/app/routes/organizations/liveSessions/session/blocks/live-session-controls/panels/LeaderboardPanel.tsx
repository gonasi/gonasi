import { motion } from 'framer-motion';
import { Trophy, Medal, ArrowRight, Gift } from 'lucide-react';

import type { LiveSessionGameState } from '../hooks/useLiveSessionGameState';

import { Button } from '~/components/ui/button';

interface LeaderboardPanelProps {
  state: LiveSessionGameState;
  onNext: () => void;
  onShowPrizes?: () => void;
  disabled?: boolean;
}

/**
 * Panel shown when displaying leaderboard (play_state = 'leaderboard')
 * - Shows top players and their scores
 * - Celebrates achievements
 * - Host can continue to next question or show prizes
 */
export function LeaderboardPanel({
  state,
  onNext,
  onShowPrizes,
  disabled = false,
}: LeaderboardPanelProps) {
  const questionNumber = state.currentBlockIndex + 1;
  const totalQuestions = state.blocks.length;
  const hasMoreQuestions = questionNumber < totalQuestions;

  // Placeholder top players - would come from real data
  const topPlayers = [
    { rank: 1, name: 'Player 1', score: 850, change: 'up' },
    { rank: 2, name: 'Player 2', score: 720, change: 'up' },
    { rank: 3, name: 'Player 3', score: 680, change: 'down' },
  ];

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Trophy Icon */}
      <motion.div
        className='bg-warning/10 relative flex h-28 w-28 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
        }}
      >
        <Trophy size={56} className='text-warning fill-warning/20' />

        {/* Rotating glow */}
        <motion.div
          className='border-warning/50 absolute inset-0 rounded-full border-4 border-dashed'
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.div
        className='space-y-2 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className='text-3xl font-bold'>Leaderboard</h2>
        <p className='text-muted-foreground text-sm'>
          After Question {questionNumber} of {totalQuestions}
        </p>
      </motion.div>

      {/* Top 3 Players */}
      <motion.div
        className='w-full max-w-2xl space-y-3'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {topPlayers.map((player, i) => {
          const isFirst = player.rank === 1;
          const isSecond = player.rank === 2;
          const isThird = player.rank === 3;

          return (
            <motion.div
              key={player.rank}
              className={`flex items-center gap-4 rounded-xl border-2 p-4 ${
                isFirst
                  ? 'border-warning/30 bg-warning/5'
                  : isSecond
                    ? 'border-muted bg-muted/30'
                    : 'border-muted bg-muted/10'
              }`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              {/* Rank with medal icon */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isFirst
                    ? 'bg-warning/20'
                    : isSecond
                      ? 'bg-muted'
                      : isThird
                        ? 'bg-muted'
                        : 'bg-muted/50'
                }`}
              >
                {isFirst || isSecond || isThird ? (
                  <Medal
                    size={24}
                    className={
                      isFirst ? 'text-warning' : isSecond ? 'text-muted-foreground' : 'text-muted-foreground'
                    }
                  />
                ) : (
                  <span className='text-muted-foreground text-lg font-bold'>{player.rank}</span>
                )}
              </div>

              {/* Player name */}
              <div className='flex-1'>
                <p className='font-semibold'>{player.name}</p>
                <p className='text-muted-foreground text-xs'>
                  {player.change === 'up' ? '↑' : '↓'} Rank #{player.rank}
                </p>
              </div>

              {/* Score */}
              <div className='text-right'>
                <p
                  className={`text-2xl font-bold ${isFirst ? 'text-warning' : 'text-foreground'}`}
                >
                  {player.score}
                </p>
                <p className='text-muted-foreground text-xs'>points</p>
              </div>
            </motion.div>
          );
        })}

        {/* View Full Leaderboard hint */}
        <motion.p
          className='text-muted-foreground pt-2 text-center text-xs'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Full leaderboard visible to participants on their screens
        </motion.p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className='flex flex-wrap items-center justify-center gap-3'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button size='lg' onClick={onNext} disabled={disabled} className='gap-2 px-8 py-6 text-lg'>
          {hasMoreQuestions ? (
            <>
              Continue to Next Question
              <ArrowRight size={24} />
            </>
          ) : (
            <>
              Show Final Results
              <Trophy size={24} />
            </>
          )}
        </Button>

        {onShowPrizes && (
          <Button
            variant='ghost'
            size='lg'
            onClick={onShowPrizes}
            disabled={disabled}
            className='gap-2'
          >
            <Gift size={20} />
            Show Prizes
          </Button>
        )}
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground max-w-md text-center text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        Celebrate the top performers! When ready, continue to{' '}
        {hasMoreQuestions ? 'the next question' : 'the final results'}.
      </motion.p>
    </motion.div>
  );
}
