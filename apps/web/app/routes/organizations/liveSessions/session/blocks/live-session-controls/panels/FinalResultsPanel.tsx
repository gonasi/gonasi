import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, ArrowRight } from 'lucide-react';

import type { LiveSessionGameState } from '../hooks/useLiveSessionGameState';

import { Button } from '~/components/ui/button';

interface FinalResultsPanelProps {
  state: LiveSessionGameState;
  onEnd?: () => void;
  disabled?: boolean;
}

/**
 * Panel shown for final results (play_state = 'final_results')
 * - Reveals the ultimate winners
 * - Displays final rankings
 * - Celebrates achievements
 * - Host can end the session
 */
export function FinalResultsPanel({ state, onEnd, disabled = false }: FinalResultsPanelProps) {
  // Placeholder winners - would come from real participant data
  const winners = [
    { rank: 1, name: 'Champion Player', score: 9850, prize: '🥇 Grand Prize' },
    { rank: 2, name: 'Runner Up', score: 9200, prize: '🥈 Second Prize' },
    { rank: 3, name: 'Third Place', score: 8750, prize: '🥉 Third Prize' },
  ];

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Crown Icon with Celebration */}
      <motion.div
        className='bg-warning/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 180,
          damping: 12,
        }}
      >
        <Crown size={64} className='text-warning fill-warning/30' />

        {/* Confetti particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 360) / 12;
          return (
            <motion.div
              key={i}
              className='absolute h-2 w-2 rounded-full'
              style={{
                background: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#ef4444' : '#3b82f6',
              }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((angle * Math.PI) / 180) * 80,
                y: Math.sin((angle * Math.PI) / 180) * 80,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </motion.div>

      {/* Title */}
      <motion.div
        className='space-y-3 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className='text-4xl font-bold'>Final Results!</h1>
        <p className='text-muted-foreground text-lg'>
          🎉 Congratulations to all participants! 🎉
        </p>
        <p className='text-muted-foreground text-sm'>
          Total Questions: {state.blocks.length} • Session: {state.sessionName}
        </p>
      </motion.div>

      {/* Winner Podium */}
      <motion.div
        className='w-full max-w-3xl space-y-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* First Place - Largest */}
        <motion.div
          className='border-warning/40 bg-warning/5 flex items-center gap-6 rounded-2xl border-4 p-8'
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <motion.div
            className='bg-warning/20 flex h-20 w-20 items-center justify-center rounded-full'
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Crown size={40} className='text-warning fill-warning' />
          </motion.div>

          <div className='flex-1'>
            <div className='text-warning mb-2 flex items-center gap-2 text-sm font-bold uppercase'>
              <Trophy size={16} />
              Champion
            </div>
            <p className='text-2xl font-bold'>{winners[0]?.name}</p>
            <p className='text-muted-foreground text-sm'>{winners[0]?.prize}</p>
          </div>

          <div className='text-right'>
            <p className='text-warning text-4xl font-black'>{winners[0]?.score}</p>
            <p className='text-muted-foreground text-xs'>Points</p>
          </div>
        </motion.div>

        {/* Second and Third Place */}
        <div className='grid gap-4 md:grid-cols-2'>
          {winners.slice(1).map((winner, i) => (
            <motion.div
              key={winner.rank}
              className='bg-muted/30 flex items-center gap-4 rounded-xl border-2 p-6'
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
            >
              <div className='bg-muted flex h-14 w-14 items-center justify-center rounded-full'>
                <Medal size={28} className='text-muted-foreground' />
              </div>

              <div className='flex-1'>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  {winner.rank === 2 ? 'Runner Up' : '3rd Place'}
                </p>
                <p className='font-bold'>{winner.name}</p>
                <p className='text-muted-foreground text-xs'>{winner.prize}</p>
              </div>

              <div className='text-right'>
                <p className='text-xl font-bold'>{winner.score}</p>
                <p className='text-muted-foreground text-[10px]'>pts</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Session Stats */}
      <motion.div
        className='bg-muted/50 grid w-full max-w-3xl grid-cols-3 gap-4 rounded-lg border p-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[
          { label: 'Total Questions', value: state.blocks.length },
          { label: 'Participants', value: '-' },
          { label: 'Avg Score', value: '-' },
        ].map((stat) => (
          <div key={stat.label} className='text-center'>
            <p className='text-2xl font-bold'>{stat.value}</p>
            <p className='text-muted-foreground text-xs'>{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* End Session Button */}
      {onEnd && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            size='lg'
            onClick={onEnd}
            disabled={disabled}
            className='gap-2 px-8 py-6 text-lg'
          >
            End Session
            <ArrowRight size={24} />
          </Button>
        </motion.div>
      )}

      {/* Closing Message */}
      <motion.p
        className='text-muted-foreground max-w-md text-center text-sm'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Thank you to everyone who participated! 🎊
      </motion.p>
    </motion.div>
  );
}
