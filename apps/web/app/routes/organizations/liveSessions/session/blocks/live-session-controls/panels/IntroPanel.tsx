import { motion } from 'framer-motion';
import { Sparkles, Trophy, Zap, Users } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface IntroPanelProps {
  sessionName: string;
  totalQuestions: number;
  onNext: () => void;
  disabled?: boolean;
}

/**
 * Panel shown during intro phase (play_state = 'intro')
 * - Welcomes participants with game rules
 * - Displays session info and expectations
 * - Host clicks "Start First Question" to begin
 */
export function IntroPanel({
  sessionName,
  totalQuestions,
  onNext,
  disabled = false,
}: IntroPanelProps) {
  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Welcome Icon */}
      <motion.div
        className='bg-primary/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <Sparkles size={64} className='text-primary' />

        {/* Orbiting sparkles */}
        {[0, 120, 240].map((rotation, i) => (
          <motion.div
            key={i}
            className='absolute'
            animate={{
              rotate: [rotation, rotation + 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              transformOrigin: '0 0',
            }}
          >
            <Sparkles
              size={16}
              className='text-primary'
              style={{
                transform: `translate(60px, -8px)`,
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Session Title */}
      <motion.div
        className='space-y-2 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className='text-4xl font-bold'>{sessionName}</h1>
        <p className='text-muted-foreground text-lg'>Let's get started!</p>
      </motion.div>

      {/* Game Info Cards */}
      <motion.div
        className='grid grid-cols-1 gap-4 md:grid-cols-3'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {[
          {
            icon: Trophy,
            label: 'Questions',
            value: totalQuestions,
            color: 'text-warning',
          },
          {
            icon: Zap,
            label: 'Points',
            value: 'Up to 1000',
            color: 'text-success',
          },
          {
            icon: Users,
            label: 'Players',
            value: 'Ready!',
            color: 'text-primary',
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className='bg-muted/50 flex flex-col items-center gap-3 rounded-lg border p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <item.icon size={32} className={item.color} />
            <div className='text-center'>
              <p className='text-2xl font-bold'>{item.value}</p>
              <p className='text-muted-foreground text-sm'>{item.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Rules */}
      <motion.div
        className='bg-muted/50 max-w-md space-y-3 rounded-lg border p-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className='text-center font-medium'>Quick Rules</p>
        <ul className='text-muted-foreground space-y-2 text-sm'>
          <li className='flex items-start gap-2'>
            <span className='text-primary mt-0.5'>•</span>
            <span>Answer quickly to earn more points</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-primary mt-0.5'>•</span>
            <span>Correct answers earn you a spot on the leaderboard</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-primary mt-0.5'>•</span>
            <span>Have fun and good luck!</span>
          </li>
        </ul>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: 'spring' }}
      >
        <Button size='lg' onClick={onNext} disabled={disabled} className='gap-2 px-8 py-6 text-lg'>
          <Zap size={24} />
          Start First Question
        </Button>
      </motion.div>
    </motion.div>
  );
}
