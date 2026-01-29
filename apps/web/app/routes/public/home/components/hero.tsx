import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Sparkles, Users } from 'lucide-react';
import Typewriter from 'typewriter-effect';

export function Hero() {
  return (
    <section className='from-card to-muted/30 bg-background-to-b relative overflow-hidden'>
      {/* Ambient background accents */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='bg-primary/10 absolute -top-24 left-1/3 h-72 w-72 rounded-full blur-3xl' />
        <div className='bg-primary/5 absolute top-1/2 -right-24 h-96 w-96 rounded-full blur-3xl' />
      </div>

      <div className='relative container mx-auto px-4 py-20 md:px-0 md:py-28'>
        <motion.div
          initial='hidden'
          animate='visible'
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.12 },
            },
          }}
          className='max-w-6xl space-y-8'
        >
          {/* Badge */}

          <motion.div
            initial='hidden'
            animate='visible'
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.08 },
              },
            }}
            className='bg-muted/60 font-secondary text-foreground/80 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur'
          >
            {/* Intro */}
            <motion.span
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className='flex items-center gap-1'
            >
              <CheckCircle className='h-4 w-4 text-emerald-500' />
              <span>Built for</span>
            </motion.span>

            {/* Educators */}
            <motion.span
              variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
              className='flex items-center gap-1'
            >
              <Users className='h-4 w-4 text-blue-500' />
              <span>educators</span>
            </motion.span>

            {/* Schools */}
            <motion.span
              variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
              className='flex items-center gap-1'
            >
              <BookOpen className='h-4 w-4 text-violet-500' />
              <span>schools</span>
            </motion.span>

            {/* Course creators */}
            <motion.span
              variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
              className='flex items-center gap-1'
            >
              <Sparkles className='h-4 w-4 text-amber-500' />
              <span>course creators</span>
            </motion.span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
            className='text-4xl font-bold tracking-tight text-balance md:text-6xl'
          >
            The #1 Interactive Course Builder
            <span className='text-primary block'>for real learning outcomes</span>
          </motion.h1>

          {/* Typewriter subline */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            className='text-foreground/80 text-lg md:text-xl'
          >
            <Typewriter
              options={{
                delay: 40,
                deleteSpeed: 20,
                loop: true,
              }}
              onInit={(typewriter) => {
                typewriter
                  .typeString('Build interactive courses.')
                  .pauseFor(1200)
                  .deleteAll()
                  .typeString('Engage learners with gamified lessons.')
                  .pauseFor(1200)
                  .deleteAll()
                  .typeString('Turn learning into real mastery.')
                  .pauseFor(1600)
                  .start();
              }}
            />
          </motion.div>

          {/* Supporting copy */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            className='text-foreground/75 font-secondary max-w-2xl text-lg leading-relaxed md:text-xl'
          >
            Gonasi lets you build structured courses with interactive lessons, quizzes, and progress
            tracking, all in one place. Designed for clarity, not content overload.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            className='flex flex-col gap-4 sm:flex-row'
          >
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <div className='pt-4'>
                <div
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    border: '1px solid rgb(224, 224, 224)',
                    borderRadius: '12px',
                    padding: '20px',
                    maxWidth: '500px',
                    background: 'rgb(255, 255, 255)',
                    boxShadow: 'rgba(0, 0, 0, 0.05) 0px 2px 8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <img
                      alt='Gonasi'
                      src='https://ph-files.imgix.net/c163ae63-bc48-4de7-8afe-ba38a04512d7.jpeg?auto=format&fit=crop&w=80&h=80'
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: 600,
                          color: 'rgb(26, 26, 26)',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Gonasi
                      </h3>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '14px',
                          color: 'rgb(102, 102, 102)',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        Build interactive courses learners love, like Brilliant.org
                      </p>
                    </div>
                  </div>
                  <a
                    href='https://www.producthunt.com/products/gonasi?embed=true&utm_source=embed&utm_medium=post_embed'
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: 'rgb(255, 97, 84)',
                      color: 'rgb(255, 255, 255)',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Check it out on Product Hunt →
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Value props */}
          <motion.div
            className='text-foreground/65 flex flex-wrap gap-x-6 gap-y-3 pt-4 text-sm'
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {[
              'Interactive lessons & quizzes',
              'Learner progress tracking',
              'Free forever for creators',
            ].map((item) => (
              <motion.span
                key={item}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {item}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
