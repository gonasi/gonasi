import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Trophy } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface PrizesPanelProps {
  onBack: () => void;
  disabled?: boolean;
}

/**
 * Panel shown when displaying prizes (play_state = 'prizes')
 * - Shows prize breakdown and rewards
 * - Accessed from leaderboard screen
 * - Host can return to leaderboard
 */
export function PrizesPanel({ onBack, disabled = false }: PrizesPanelProps) {
  // Placeholder prizes - would come from session configuration
  const prizes = [
    {
      rank: '1st Place',
      prize: 'Grand Prize',
      value: '$500',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    },
    {
      rank: '2nd Place',
      prize: 'Runner Up',
      value: '$300',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30',
      borderColor: 'border-muted',
    },
    {
      rank: '3rd Place',
      prize: 'Third Prize',
      value: '$150',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20',
      borderColor: 'border-muted',
    },
  ];

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gift Icon */}
      <motion.div
        className='bg-primary/10 relative flex h-28 w-28 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
        }}
      >
        <Gift size={56} className='text-primary' />

        {/* Sparkles */}
        {[0, 72, 144, 216, 288].map((rotation, i) => (
          <motion.div
            key={i}
            className='absolute'
            animate={{
              rotate: [rotation, rotation + 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              transformOrigin: '0 0',
            }}
          >
            <div
              className='bg-warning h-1.5 w-1.5 rounded-full'
              style={{
                transform: `translate(50px, -8px)`,
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Title */}
      <motion.div
        className='space-y-2 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className='text-3xl font-bold'>Prizes & Rewards</h2>
        <p className='text-muted-foreground'>Here's what you're competing for!</p>
      </motion.div>

      {/* Prize Cards */}
      <motion.div
        className='w-full max-w-2xl space-y-3'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {prizes.map((prize, i) => (
          <motion.div
            key={prize.rank}
            className={`flex items-center gap-4 rounded-xl border-2 p-6 ${prize.bgColor} ${prize.borderColor}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            {/* Rank */}
            <div className='flex flex-col items-center'>
              <Trophy size={32} className={prize.color} />
              <p className={`mt-1 text-xs font-medium ${prize.color}`}>{prize.rank}</p>
            </div>

            {/* Prize Details */}
            <div className='flex-1'>
              <p className='text-lg font-bold'>{prize.prize}</p>
              <p className='text-muted-foreground text-sm'>Awarded to the winner</p>
            </div>

            {/* Value */}
            <div className='text-right'>
              <p className={`text-3xl font-bold ${prize.color}`}>{prize.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Info */}
      <motion.div
        className='bg-muted/50 max-w-2xl rounded-lg border p-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className='text-muted-foreground text-center text-xs'>
          Prizes will be awarded to the top performers at the end of the session. Keep playing to
          climb the leaderboard!
        </p>
      </motion.div>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          variant='ghost'
          size='lg'
          onClick={onBack}
          disabled={disabled}
          className='gap-2 px-8 py-6'
        >
          <ArrowLeft size={20} />
          Back to Leaderboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
