import { motion } from 'framer-motion';
import {
  Blocks,
  Coins,
  Gamepad2,
  Lightbulb,
  LineChart,
  PenTool,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: PenTool,
      title: 'Intuitive Course Builder',
      description: `Create engaging courses with our drag-and-drop builder. No technical skills required.`,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Gamepad2,
      title: 'Gamification Built-In',
      description:
        'Points, badges, leaderboards, and achievements keep learners motivated and coming back.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Blocks,
      title: 'Interactive Content Blocks',
      description:
        'Quizzes, drag-and-drop activities, 3D models, and more. Make learning hands-on.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Lightbulb,
      title: 'Smart Learning Paths',
      description: `Adaptive content that adjusts to each learner's pace and comprehension level.`,
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: LineChart,
      title: 'Analytics & Insights',
      description: 'Track progress, identify bottlenecks, and measure real skill development.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Coins,
      title: 'Monetization Ready',
      description:
        'Sell courses with built-in payment processing. Create subscriptions or one-time purchases.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Invite co-authors, reviewers, and administrators. Build courses together seamlessly.',
      color: 'from-teal-500 to-green-500',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Built with modern tech for instant loading and smooth interactions on any device.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Sparkles,
      title: 'Custom Branding',
      description: 'White-label your learning platform with custom domains, colors, and branding.',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <section className='bg-background py-20 md:py-32'>
      <div className='container mx-auto px-6'>
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
            Everything You Need to Create
            <span className='text-primary block'> Amazing Courses</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground/70 font-secondary mx-auto max-w-2xl text-lg md:text-xl'
          >
            Powerful tools designed for educators, trainers, and content creators who want to make a
            real impact.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className='bg-card border-border/50 group relative overflow-hidden rounded-2xl border p-8 shadow-lg transition-shadow hover:shadow-xl'
              >
                {/* Gradient accent on hover */}
                <motion.div
                  className={`bg-gradient-to-br ${feature.color} absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-15`}
                  initial={false}
                />

                <div className='relative space-y-5'>
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`bg-gradient-to-br ${feature.color} flex h-16 w-16 items-center justify-center rounded-xl shadow-lg`}
                  >
                    <Icon className='h-8 w-8 text-white' />
                  </motion.div>

                  {/* Content */}
                  <div className='space-y-3'>
                    <h3 className='text-foreground text-xl font-bold'>{feature.title}</h3>
                    <p className='text-foreground/70 font-secondary text-base leading-relaxed'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
