import { motion } from 'framer-motion';
import { Award, LineChart, Target } from 'lucide-react';

export function RealOutcomes() {
  const outcomes = [
    {
      icon: LineChart,
      metric: '2–4×',
      label: 'Higher Engagement',
      description: 'Learners stay active through interactive practice',
    },
    {
      icon: Award,
      metric: '3×',
      label: 'Better Retention',
      description: 'Mastery-based design leads to long-term memory',
    },
    {
      icon: Target,
      metric: 'Measured',
      label: 'Skill Gains',
      description: 'See real improvement through progress tracking',
    },
  ];

  return (
    <section className='bg-primary/90 relative overflow-hidden py-24 md:py-32'>
      {/* Subtle grid background */}
      <div className='bg-grid-pattern absolute inset-0 opacity-[0.05]' />

      {/* Optional soft radial accent behind center */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className='absolute top-1/2 left-1/2 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[150px]'
      />

      <div className='relative container mx-auto px-4'>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className='mb-24 space-y-6 text-center'
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-primary-foreground text-4xl leading-tight font-bold text-balance lg:text-5xl'
          >
            Real Outcomes Not Just Clicks
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-primary-foreground/90 font-secondary mx-auto max-w-2xl text-lg md:text-xl'
          >
            Gonasi helps learners do more than watch lessons. They practice, progress, and build
            skills you can measure.
          </motion.p>
        </motion.div>

        {/* Outcomes Grid */}
        <motion.div
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
          className='mx-auto grid max-w-5xl gap-12 md:grid-cols-3'
        >
          {outcomes.map((outcome, index) => {
            const Icon = outcome.icon;
            return (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className='space-y-5 text-center'
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className='bg-primary-foreground/10 ring-primary-foreground/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full ring-1 backdrop-blur-sm'
                >
                  <Icon className='text-primary-foreground h-10 w-10' />
                </motion.div>
                <div className='space-y-2'>
                  <div className='text-primary-foreground text-5xl font-bold'>{outcome.metric}</div>
                  <div className='text-primary-foreground text-xl font-semibold'>
                    {outcome.label}
                  </div>
                  <div className='text-primary-foreground/80 text-base'>{outcome.description}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.02, y: -5 }}
          className='bg-primary-foreground/10 ring-primary-foreground/20 mx-auto mt-24 max-w-3xl rounded-2xl p-10 text-center ring-1 backdrop-blur-sm transition-transform md:p-12'
        >
          <p className='text-primary-foreground font-secondary text-lg leading-relaxed italic md:text-xl'>
            &quot;Gonasi transformed how we onboard new hires. Completion rates soared and our team
            now learns through practice instead of passively watching videos. It&apos;s the first
            training tool that actually improves performance.&quot;
          </p>
          <p className='text-primary-foreground mt-8 text-lg font-semibold tracking-wide'>
            Sarah Johnson, Head of Learning & Development
          </p>
        </motion.div>
      </div>
    </section>
  );
}
