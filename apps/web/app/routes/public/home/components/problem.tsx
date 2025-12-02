import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Brain } from 'lucide-react';

export function Problem() {
  return (
    <section className='py-16 md:py-24'>
      <div className='container mx-auto px-6'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className='mx-auto max-w-4xl space-y-8 text-center'
        >
          {/* Heading */}
          <h2 className='text-4xl font-bold text-balance lg:text-5xl'>
            Online Learning Is Broken and Everyone Feels It!
          </h2>

          {/* Description */}
          <p className='text-muted-foreground font-secondary text-xl text-balance'>
            Most online courses turn into passive video watching. Learners don’t practice, they
            don’t stay engaged, and they rarely finish. Knowledge fades fast and real outcomes never
            happen.
          </p>

          {/* Cards */}
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
            className='grid gap-6 pt-10 md:grid-cols-3'
          >
            {/* Completion Rate */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className='shadow-card bg-card/50 rounded-xl p-6'
            >
              <BarChart3 className='text-primary/80 mb-4 h-12 w-12' />
              <h3 className='mb-2 text-2xl font-bold'>5–10%</h3>
              <p className='text-muted-foreground font-secondary'>Typical course completion rate</p>
            </motion.div>

            {/* Forgetting Curve */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className='shadow-card bg-card/50 rounded-xl p-6'
            >
              <Brain className='text-primary/80 mb-4 h-12 w-12' />
              <h3 className='mb-2 text-2xl font-bold'>90%</h3>
              <p className='text-muted-foreground font-secondary'>
                Learners forget within a month without practice
              </p>
            </motion.div>

            {/* No Application */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className='shadow-card bg-card/50 rounded-xl p-6'
            >
              <AlertTriangle className='text-primary/80 mb-4 h-12 w-12' />
              <h3 className='mb-2 text-2xl font-bold'>Low Impact</h3>
              <p className='text-muted-foreground font-secondary'>
                Training rarely leads to real-world performance
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
