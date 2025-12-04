import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

import { NavLinkButton } from '~/components/ui/button';
import { useStore } from '~/store';

export function FinalCTA() {
  const { isActiveUserProfileLoading, activeUserProfile } = useStore();
  const isLoggedOut = !isActiveUserProfileLoading && !activeUserProfile;

  const benefits = [
    'No credit card required',
    'Free forever plan available',
    'Cancel anytime',
    'Full access to all features',
  ];

  return (
    <section className='bg-primary relative overflow-hidden py-28 md:py-40'>
      {/* Background effects */}
      <div className='bg-grid-pattern absolute inset-0 opacity-[0.05]' />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className='pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[200px]'
      />

      <div className='relative container mx-auto px-6'>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className='mx-auto max-w-4xl space-y-12 text-center'
        >
          {/* Heading */}
          <div className='space-y-6'>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className='text-primary-foreground text-5xl font-extrabold leading-[1.1] tracking-tight text-balance lg:text-6xl'
            >
              Ready to Transform
              <br />
              Your Learning Experience?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className='text-primary-foreground/90 font-secondary mx-auto max-w-2xl text-lg leading-relaxed md:text-xl'
            >
              Join thousands of educators already creating courses that truly engage and deliver
              measurable results. Start free today.
            </motion.p>
          </div>

          {/* Benefits */}
          <motion.div
            initial='hidden'
            whileInView='show'
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
            className='mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6'
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className='flex items-center gap-2.5'
              >
                <div className='bg-primary-foreground/20 ring-primary-foreground/30 flex h-7 w-7 items-center justify-center rounded-full ring-1'>
                  <Check className='h-4 w-4 text-white' />
                </div>
                <span className='text-primary-foreground text-sm font-medium'>{benefit}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className='flex flex-col items-center justify-center gap-4 sm:flex-row'
          >
            {isLoggedOut ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <NavLinkButton
                    size='lg'
                    variant='secondary'
                    className='bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-2xl shadow-black/25 text-lg font-bold'
                    to='/login'
                    rightIcon={<ArrowRight />}
                  >
                    Get Started Free
                  </NavLinkButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <NavLinkButton
                    size='lg'
                    variant='ghost'
                    className='border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg backdrop-blur-sm'
                    to='/explore'
                  >
                    Explore Courses
                  </NavLinkButton>
                </motion.div>
              </>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <NavLinkButton
                  size='lg'
                  variant='secondary'
                  className='bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-2xl shadow-black/25 text-lg font-bold'
                  to='/go/explore'
                  rightIcon={<ArrowRight />}
                >
                  Continue Learning
                </NavLinkButton>
              </motion.div>
            )}
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className='text-primary-foreground/70 text-sm'
          >
            Trusted by 500+ organizations worldwide • 50,000+ active learners
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
