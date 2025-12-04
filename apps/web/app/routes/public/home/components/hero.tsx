import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { NavLinkButton } from '~/components/ui/button';
import { useStore } from '~/store';

export function Hero() {
  const { isActiveUserProfileLoading, activeUserProfile } = useStore();
  const isLoggedOut = !isActiveUserProfileLoading && !activeUserProfile;

  return (
    <section className='from-background via-background to-muted/20 relative overflow-hidden bg-gradient-to-b'>
      {/* Background */}
      <div className='bg-grid-pattern absolute inset-0 opacity-[0.03]' />
      <div className='bg-primary/5 pointer-events-none absolute -top-20 left-1/2 h-[600px] w-full -translate-x-1/2 rounded-full blur-[200px]' />

      <div className='relative container mx-auto px-6 py-16 lg:py-32'>
        <div className='grid items-center gap-16 lg:grid-cols-2'>
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='space-y-8'
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              className='bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-sm'
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className='h-4 w-4' />
              </motion.div>
              <span>The Future of Skill Learning</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className='text-foreground text-5xl leading-[1.1] font-extrabold tracking-tight text-balance lg:text-7xl'
            >
              Build Courses That
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className='text-primary block'
              >
                {' '}
                Truly Engage.
              </motion.span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className='text-foreground/80 font-secondary max-w-2xl text-lg leading-relaxed lg:text-xl'
            >
              Gonasi empowers you to create interactive, gamified learning experiences turning every
              lesson into lasting understanding.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className='flex flex-col gap-4 sm:flex-row'
            >
              {isLoggedOut ? (
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <NavLinkButton
                    size='lg'
                    className='shadow-primary/25 hover:shadow-primary/30 text-lg shadow-lg transition-shadow hover:shadow-xl'
                    to='/login'
                    rightIcon={<ArrowRight />}
                  >
                    Start Free
                  </NavLinkButton>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <NavLinkButton
                    size='lg'
                    variant='secondary'
                    className='text-lg shadow-md transition-shadow hover:shadow-lg'
                    to='/go/explore'
                    rightIcon={<ArrowRight />}
                  >
                    Continue Learning
                  </NavLinkButton>
                </motion.div>
              )}
            </motion.div>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className='text-foreground/70 flex flex-wrap items-center gap-6 text-sm font-medium'
            >
              {['No credit card required', 'Free forever plan', 'Made for educators & teams'].map(
                (label, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                    className='flex items-center gap-2'
                  >
                    <div className='bg-primary h-1.5 w-1.5 rounded-full' />
                    <span>{label}</span>
                  </motion.div>
                ),
              )}
            </motion.div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className='relative hidden lg:block'
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className='bg-primary absolute -inset-6 rounded-full blur-3xl'
            />
            <motion.img
              src='assets/images/hero-learning.jpg'
              alt='Interactive and gamified learning experience'
              className='ring-border/50 relative w-full rounded-2xl shadow-2xl ring-1'
              whileHover={{ scale: 1.02, rotate: 0.5 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
