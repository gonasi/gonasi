import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Do I need any technical skills to create courses?',
      answer: `Not at all! Gonasi is designed for non-technical users. Our drag-and-drop builder, intuitive interface, and pre-built templates make course creation simple. If you can use a word processor, you can build engaging courses on Gonasi.`,
    },
    {
      question: 'How is Gonasi different from other LMS platforms?',
      answer: `Traditional LMS platforms focus on content delivery. Gonasi focuses on active learning through interactive elements, gamification, and hands-on practice. Our courses aren't just watched—they're experienced. This leads to higher engagement, better retention, and measurable skill development.`,
    },
    {
      question: 'Can I monetize my courses?',
      answer:
        'Absolutely! Gonasi includes built-in payment processing so you can sell courses directly. Create one-time purchases, subscriptions, or bundles. You set the price and keep the majority of revenue. We handle all the payment infrastructure.',
    },
    {
      question: 'What kind of content can I include?',
      answer:
        'Almost anything! Text, images, videos, audio, PDFs, 3D models, quizzes, drag-and-drop activities, code editors, simulations, and more. Our rich content library supports diverse learning styles and subjects.',
    },
    {
      question: 'Is there a free plan?',
      answer: `Yes! Our free forever plan lets you create unlimited courses with up to 50 learners. It's perfect for getting started, testing the platform, or teaching small groups. Upgrade anytime as you grow.`,
    },
    {
      question: 'Can I use Gonasi for corporate training?',
      answer:
        'Definitely! Many organizations use Gonasi for employee onboarding, compliance training, skill development, and professional education. Our team plans include advanced analytics, SSO integration, custom branding, and dedicated support.',
    },
    {
      question: 'How does analytics and tracking work?',
      answer: `Gonasi provides detailed insights into learner progress, engagement metrics, quiz scores, time spent, and skill mastery. You'll see exactly where learners struggle and excel, allowing you to continuously improve your content and measure ROI.`,
    },
    {
      question: 'Can I migrate my existing courses?',
      answer: `Yes! We support importing content from various formats and can help migrate courses from other platforms. Our team provides migration assistance for team and enterprise plans. Contact us to discuss your specific needs.`,
    },
  ];

  return (
    <section className='bg-muted/30 py-20 md:py-32'>
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
            Frequently Asked
            <span className='text-primary block'> Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className='text-foreground/70 font-secondary mx-auto max-w-2xl text-lg md:text-xl'
          >
            Everything you need to know about Gonasi. Can&apos;t find what you&apos;re looking for?
            Reach out to our support team.
          </motion.p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.06 },
            },
          }}
          className='mx-auto max-w-3xl space-y-4'
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className='bg-card border-border/50 overflow-hidden rounded-xl border shadow-md transition-shadow hover:shadow-lg'
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className='hover:bg-muted/50 flex w-full items-start justify-between gap-6 p-6 text-left transition-colors'
                >
                  <span className='text-foreground text-lg leading-snug font-semibold'>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className='text-foreground/60 flex-shrink-0 pt-1'
                  >
                    <ChevronDown className='h-5 w-5' />
                  </motion.div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className='overflow-hidden'
                >
                  <div className='text-foreground/70 font-secondary border-border/50 border-t px-6 pt-4 pb-6 leading-relaxed'>
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
