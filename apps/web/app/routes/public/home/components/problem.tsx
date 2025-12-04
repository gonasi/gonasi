import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Brain } from 'lucide-react';

export function Problem() {
  return (
    <section className='bg-muted/30 py-20 md:py-32'>
      <div className='container mx-auto px-6'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className='mx-auto max-w-4xl space-y-10 text-center'
        >
          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground text-4xl font-bold leading-tight text-balance lg:text-5xl'
          >
            Online Learning Is Broken and Everyone Feels It!
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground/70 font-secondary text-lg leading-relaxed text-balance md:text-xl'
          >
            Most online courses turn into passive video watching. Learners don&apos;t practice, they
            don&apos;t stay engaged, and they rarely finish. Knowledge fades fast and real outcomes
            never happen.
          </motion.p>

          {/* Cards */}
          <motion.div
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.12 },
              },
            }}
            className='grid gap-6 pt-12 md:grid-cols-3'
          >
            {/* Completion Rate */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className='shadow-lg bg-card border-border/50 group relative overflow-hidden rounded-2xl border p-8'
            >
              <motion.div
                className='bg-primary/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                initial={false}
              />
              <div className='relative'>
                <BarChart3 className='text-primary mb-6 h-14 w-14' />
                <h3 className='text-foreground mb-3 text-3xl font-bold'>5–10%</h3>
                <p className='text-foreground/70 font-secondary text-base leading-relaxed'>
                  Typical course completion rate
                </p>
              </div>
            </motion.div>

            {/* Forgetting Curve */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className='shadow-lg bg-card border-border/50 group relative overflow-hidden rounded-2xl border p-8'
            >
              <motion.div
                className='bg-primary/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                initial={false}
              />
              <div className='relative'>
                <Brain className='text-primary mb-6 h-14 w-14' />
                <h3 className='text-foreground mb-3 text-3xl font-bold'>90%</h3>
                <p className='text-foreground/70 font-secondary text-base leading-relaxed'>
                  Learners forget within a month without practice
                </p>
              </div>
            </motion.div>

            {/* No Application */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className='shadow-lg bg-card border-border/50 group relative overflow-hidden rounded-2xl border p-8'
            >
              <motion.div
                className='bg-primary/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                initial={false}
              />
              <div className='relative'>
                <AlertTriangle className='text-primary mb-6 h-14 w-14' />
                <h3 className='text-foreground mb-3 text-3xl font-bold'>Low Impact</h3>
                <p className='text-foreground/70 font-secondary text-base leading-relaxed'>
                  Training rarely leads to real-world performance
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
