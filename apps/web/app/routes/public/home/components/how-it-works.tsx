import { motion } from 'framer-motion';
import { Boxes, Rocket, Upload, Users } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Create Your Content',
      description:
        'Use our intuitive editor to build lessons with text, images, videos, quizzes, and interactive elements.',
    },
    {
      number: '02',
      icon: Boxes,
      title: 'Add Interactive Elements',
      description:
        'Drop in gamified activities, assessments, and practice exercises that keep learners engaged.',
    },
    {
      number: '03',
      icon: Users,
      title: 'Invite Your Learners',
      description: `Share your course with students, employees, or sell it to the world. You control access.`,
    },
    {
      number: '04',
      icon: Rocket,
      title: 'Watch Them Succeed',
      description:
        'Track progress, measure outcomes, and watch your learners achieve real skill mastery.',
    },
  ];

  return (
    <section className='bg-muted/30 relative py-20 md:py-32'>
      {/* Background decoration */}
      <div className='bg-grid-pattern absolute inset-0 opacity-[0.03]' />

      <div className='relative container mx-auto px-4'>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className='mb-20 space-y-6 text-center'
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground text-4xl leading-tight font-bold text-balance lg:text-5xl'
          >
            <span className='text-primary block'> Four Simple Steps</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground/70 font-secondary mx-auto max-w-2xl text-lg md:text-xl'
          >
            Creating world-class learning experiences has never been this easy.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className='space-y-20'>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-150px' }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`grid items-center gap-12 lg:grid-cols-2 ${isEven ? '' : 'lg:grid-flow-dense'}`}
              >
                {/* Content */}
                <div className={`space-y-6 ${isEven ? '' : 'lg:col-start-2'}`}>
                  {/* Step Number */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className='text-primary/80 text-8xl leading-none font-black'
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon and Title */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className='flex items-center gap-4'
                  >
                    <div className='bg-primary/10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl'>
                      <Icon className='text-primary h-8 w-8' />
                    </div>
                    <h3 className='text-foreground text-3xl font-bold'>{step.title}</h3>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className='text-foreground/70 font-secondary text-lg leading-relaxed'
                  >
                    {step.description}
                  </motion.p>
                </div>

                {/* Visual */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`bg-card border-border/50 group relative overflow-hidden rounded-2xl border p-12 ${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}
                >
                  <div className='bg-primary/5 group-hover:bg-primary/10 relative flex aspect-video items-center justify-center rounded-xl transition-colors duration-300'>
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Icon className='text-primary/30 h-32 w-32' />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
