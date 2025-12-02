import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { NavLinkButton } from '~/components/ui/button';
import { useStore } from '~/store';

export function Hero() {
  const { isActiveUserProfileLoading, activeUserProfile } = useStore();
  const isLoggedOut = !isActiveUserProfileLoading && !activeUserProfile;

  return (
    <section className='relative overflow-hidden'>
      {/* Background */}
      <div className='bg-grid-pattern absolute inset-0 opacity-5' />
      <div className='bg-primary/10 pointer-events-none absolute -top-20 left-1/2 h-[600px] w-full -translate-x-1/2 rounded-full blur-[180px]' />

      <div className='relative container mx-auto px-6 py-24 lg:py-32'>
        <div className='grid items-center gap-16 lg:grid-cols-2'>
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className='space-y-8'
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className='bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium'
            >
              <Sparkles className='h-4 w-4' />
              <span>The Future of Skill Learning</span>
            </motion.div>

            {/* Heading */}
            <h1 className='text-5xl leading-tight font-bold text-balance lg:text-7xl'>
              Build Courses That
              <span className='text-primary'> Truly Engage.</span>
            </h1>

            {/* Subtext */}
            <p className='font-secondary text-muted-foreground max-w-2xl text-xl lg:text-2xl'>
              Gonasi empowers you to create interactive, gamified learning experiences turning every
              lesson into lasting understanding.
            </p>

            {/* CTA */}
            <div className='flex flex-col gap-4 sm:flex-row'>
              {isLoggedOut ? (
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <NavLinkButton
                    size='lg'
                    className='text-lg'
                    to='/login'
                    rightIcon={<ArrowRight />}
                  >
                    Start Free
                  </NavLinkButton>
                </motion.div>
              ) : (
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <NavLinkButton
                    size='lg'
                    variant='secondary'
                    className='text-lg'
                    to='/go/explore'
                    rightIcon={<ArrowRight />}
                  >
                    Continue Learning
                  </NavLinkButton>
                </motion.div>
              )}
            </div>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className='text-muted-foreground flex items-center gap-8 text-sm'
            >
              {['No credit card required', 'Free forever plan', 'Made for educators & teams'].map(
                (label, i) => (
                  <div key={i} className='gap flex items-center gap-2'>
                    <div className='bg-primary h-8 w-2 rounded-full md:h-2' />
                    <span>{label}</span>
                  </div>
                ),
              )}
            </motion.div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className='relative hidden lg:block'
          >
            <div className='bg-gradient-primary absolute -inset-6 rounded-full opacity-20 blur-3xl' />
            <motion.img
              src='assets/images/hero-learning.jpg'
              alt='Interactive and gamified learning experience'
              className='shadow-card relative w-full rounded-2xl'
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
