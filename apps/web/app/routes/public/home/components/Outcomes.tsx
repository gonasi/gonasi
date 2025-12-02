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
    <section className='bg-primary-dark relative py-24'>
      {/* Subtle grid background */}
      <div className='bg-grid-pattern absolute inset-0 opacity-5' />

      {/* Optional soft radial accent behind center */}
      <div className='bg-primary/20 absolute -top-40 left-1/2 -z-10 h-[500px] w-full -translate-x-1/2 rounded-full blur-[180px]' />

      <div className='relative container mx-auto px-6'>s
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className='mb-20 space-y-4 text-center'
        >
          <h2 className='text-4xl font-bold text-balance lg:text-5xl'>
            Real Outcomes Not Just Clicks
          </h2>
          <p className='font-secondary mx-auto max-w-2xl text-xl opacity-90'>
            Gonasi helps learners do more than watch lessons. They practice, progress, and build
            skills you can measure.
          </p>
        </motion.div>

        {/* Outcomes Grid */}
        <motion.div
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
          className='mx-auto grid max-w-5xl gap-10 md:grid-cols-3'
        >
          {outcomes.map((outcome, index) => {
            const Icon = outcome.icon;
            return (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className='space-y-4 text-center'
              >
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm'>
                  <Icon className='h-8 w-8' />
                </div>
                <div className='space-y-1'>
                  <div className='text-4xl font-bold'>{outcome.metric}</div>
                  <div className='text-xl font-semibold'>{outcome.label}</div>
                  <div className='text-sm opacity-90'>{outcome.description}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='mx-auto mt-20 max-w-3xl rounded-2xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur-sm'
        >
          <p className='text-lg leading-relaxed italic opacity-95'>
            “Gonasi transformed how we onboard new hires. Completion rates soared and our team now
            learns through practice instead of passively watching videos. It’s the first training
            tool that actually improves performance.”
          </p>
          <p className='mt-6 font-semibold tracking-wide'>
            Sarah Johnson, Head of Learning & Development
          </p>
        </motion.div>
      </div>
    </section>
  );
}
