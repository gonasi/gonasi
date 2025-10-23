import { motion } from 'framer-motion';
import { Award, TrendingUp } from 'lucide-react';

import { TotalCoursesCard } from './components/TotalCoursesCard';
import { TotalEnrollmentsCard } from './components/TotalEnrollmentsCard';
import { TotalReEnrollmentsCard } from './components/TotalReEnrollmentsCard';
import { TotalStudentsCard } from './components/TotalStudentsCard';

import { EarningsCard, PlanCard, StatsCard, StorageCard } from '~/components/cards';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DashboardIndex() {
  return (
    <section className='mx-auto space-y-4 p-4'>
      {/* Top grid */}
      <motion.div
        className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4'
        variants={containerVariants}
        initial='hidden'
        animate='show'
      >
        <motion.div variants={cardVariants}>
          <TotalCoursesCard />
        </motion.div>

        <motion.div variants={cardVariants}>
          <TotalStudentsCard />
        </motion.div>

        <motion.div variants={cardVariants}>
          <TotalEnrollmentsCard />
        </motion.div>

        <motion.div variants={cardVariants}>
          <TotalReEnrollmentsCard />
        </motion.div>

        <motion.div variants={cardVariants}>
          <StatsCard
            title='Active Enrollments'
            value={892}
            description='Students currently enrolled in courses'
            icon={TrendingUp}
            trend={{ value: '5%', positive: false }}
          />
        </motion.div>

        <motion.div variants={cardVariants}>
          <EarningsCard />
        </motion.div>
      </motion.div>

      {/* Bottom grid */}
      <motion.div
        className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
        variants={containerVariants}
        initial='hidden'
        animate='show'
      >
        <motion.div variants={cardVariants}>
          <PlanCard />
        </motion.div>

        <motion.div variants={cardVariants}>
          <StorageCard />
        </motion.div>

        <motion.div variants={cardVariants}>
          <StatsCard
            title='Avg. Completion'
            value='74%'
            description='Course completion rate'
            icon={Award}
            trend={{ value: '3%', positive: true }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
