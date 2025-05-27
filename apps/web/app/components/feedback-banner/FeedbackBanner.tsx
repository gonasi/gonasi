import { Link } from 'react-router';
import { motion } from 'framer-motion';

export function FeedbackBanner() {
  return (
    <div className='w-full border-b border-yellow-400 bg-yellow-100 px-4 py-2 text-yellow-900 md:px-0'>
      <div className='container mx-auto flex max-h-12 flex-col items-center justify-between text-sm font-medium md:flex-row md:space-y-0'>
        <span className='hidden items-center gap-2 md:flex'>
          ⚠️ We&apos;re building this site live! Things might look funky.
        </span>
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, 5, 0] }}
          transition={{
            repeat: Infinity,
            repeatDelay: 5,
            duration: 0.6,
            ease: 'easeInOut',
          }}
        >
          <Link
            to='/feedback'
            className='rounded bg-yellow-300 px-3 py-1.5 text-xs font-semibold text-yellow-900 hover:bg-yellow-400'
          >
            Give Feedback 💬
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
