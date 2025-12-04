import { motion } from 'framer-motion';
import { Building2, GraduationCap, Star, TrendingUp, Users } from 'lucide-react';

export function SocialProof() {
  const stats = [
    {
      icon: Users,
      value: '50K+',
      label: 'Active Learners',
    },
    {
      icon: GraduationCap,
      value: '10K+',
      label: 'Courses Created',
    },
    {
      icon: Building2,
      value: '500+',
      label: 'Organizations',
    },
    {
      icon: TrendingUp,
      value: '95%',
      label: 'Completion Rate',
    },
  ];

  const testimonials = [
    {
      quote:
        'Gonasi completely transformed our employee training. Engagement is up 300% and our teams are actually retaining what they learn.',
      author: 'Michael Chen',
      role: 'VP of Learning, TechCorp',
      avatar: 'MC',
    },
    {
      quote:
        'I went from struggling to sell courses to building a thriving online business. The platform makes it so easy to create and monetize engaging content.',
      author: 'Lisa Rodriguez',
      role: 'Independent Course Creator',
      avatar: 'LR',
    },
    {
      quote: `Our students love the interactive elements. Gonasi helped us increase course completion rates from 12% to 87%. Absolutely game-changing.`,
      author: 'Dr. James Wilson',
      role: 'Professor, State University',
      avatar: 'JW',
    },
  ];

  return (
    <section className='bg-background py-20 md:py-32'>
      <div className='container mx-auto px-6'>
        {/* Stats */}
        <motion.div
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className='mb-24 grid gap-10 sm:grid-cols-2 lg:grid-cols-4'
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className='text-center'
              >
                <div className='bg-primary/10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full'>
                  <Icon className='text-primary h-10 w-10' />
                </div>
                <div className='text-foreground text-5xl font-bold'>{stat.value}</div>
                <div className='text-foreground/70 font-secondary mt-3 text-base'>{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

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
            Loved by Educators
            <span className='text-primary block'> Worldwide</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground/70 font-secondary mx-auto max-w-2xl text-lg md:text-xl'
          >
            Join thousands of instructors, trainers, and organizations creating better learning
            experiences.
          </motion.p>
        </motion.div>

        {/* Testimonials */}
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
          className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className='bg-card border-border/50 relative overflow-hidden rounded-2xl border p-8 shadow-lg transition-shadow hover:shadow-xl'
            >
              {/* Stars */}
              <div className='mb-6 flex gap-1'>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + i * 0.05, duration: 0.3 }}
                  >
                    <Star className='text-primary h-5 w-5 fill-current' />
                  </motion.div>
                ))}
              </div>

              {/* Quote */}
              <p className='text-foreground/80 font-secondary mb-8 text-base leading-relaxed'>
                &quot;{testimonial.quote}&quot;
              </p>

              {/* Author */}
              <div className='flex items-center gap-4'>
                <div className='bg-primary text-primary-foreground flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold'>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className='text-foreground font-bold'>{testimonial.author}</div>
                  <div className='text-foreground/60 text-sm'>{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
