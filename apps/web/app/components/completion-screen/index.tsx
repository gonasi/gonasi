import Confetti from 'react-confetti';
import { useNavigate } from 'react-router';
import { useWindowSize } from 'react-use';
import { motion } from 'framer-motion';
import { ArrowRight, Award, BookOpen, CheckCircle, ChevronRight, Home } from 'lucide-react';

import { Button } from '~/components/ui/button';
import type { CoursePlayStatusLoaderReturnType } from '~/routes/go/go-lesson-completed';

interface CompletionScreenProps {
  data: CoursePlayStatusLoaderReturnType;
  courseId: string;
}

export default function CompletionScreen({ data, courseId }: CompletionScreenProps) {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  if (!data) return null;

  const { status, currentLesson, courseName, chapterProgress, courseProgress } = data;

  const configs = {
    'next-lesson': {
      emoji: '🎉',
      heading: 'Lesson Complete!',
      subheading: currentLesson ? `You've just finished ${currentLesson.title}` : '',
      gradientFrom: 'from-green-50 dark:from-green-900',
      gradientTo: 'to-emerald-50 dark:to-emerald-900',
      headingColor: 'text-green-700 dark:text-green-300',
      subheadingColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-800',
      primaryBtnColor: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
      checkpoints: [
        "You're making great progress in this chapter.",
        'Keep up the momentum and continue learning.',
      ],
      primaryBtn: {
        text: 'Continue to Next Lesson',
        icon: <ArrowRight />,
        path:
          data.status === 'next-lesson'
            ? `/go/course/${courseId}/${data.currentLesson.chapterId}/${data.nextLesson.id}/play`
            : '',
      },
      secondaryBtn: {
        text: 'Back to Chapter Overview',
        icon: <BookOpen />,
      },
    },
    'next-chapter': {
      emoji: '🏆',
      heading: 'Final Lesson Complete!',
      subheading:
        status === 'next-chapter'
          ? `You've finished the final lesson in chapter ${data.currentChapter.title}`
          : '',
      gradientFrom: 'from-blue-50 dark:from-blue-900',
      gradientTo: 'to-indigo-50 dark:to-indigo-900',
      headingColor: 'text-blue-700 dark:text-blue-300',
      subheadingColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
      primaryBtnColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
      checkpoints: [
        "You've completed all lessons in this chapter.",
        'Ready to start the next chapter?',
      ],
      primaryBtn: {
        text: 'Continue to Next Chapter',
        icon: <ArrowRight />,
        path: `/go/courses/${courseId}`,
      },
      secondaryBtn: {
        text: 'Back to Course Overview',
        icon: <BookOpen />,
      },
    },
    'chapter-complete': {
      emoji: '🌟',
      heading: 'Chapter Complete!',
      subheading:
        status === 'chapter-complete' ? `You've mastered ${data.currentChapter.title}` : '',
      gradientFrom: 'from-purple-50 dark:from-purple-900',
      gradientTo: 'to-violet-50 dark:to-violet-900',
      headingColor: 'text-purple-700 dark:text-purple-300',
      subheadingColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-800',
      primaryBtnColor:
        'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600',
      checkpoints: [
        status === 'chapter-complete'
          ? `You've completed all lessons in ${data.currentChapter.title}.`
          : '',
        'This is a major milestone in your learning journey!',
      ],
      primaryBtn: {
        text: 'Start Next Chapter',
        icon: <ChevronRight />,
        path: `/go/courses/${courseId}`,
      },
      secondaryBtn: {
        text: 'Back to Course Overview',
        icon: <BookOpen />,
      },
    },
    'course-complete': {
      emoji: '🎓',
      heading: 'Course Complete!',
      subheading: courseName ? `Congratulations! You've completed ${courseName}` : '',
      gradientFrom: 'from-amber-50 dark:from-amber-900',
      gradientTo: 'to-orange-50 dark:to-orange-900',
      headingColor: 'text-amber-700 dark:text-amber-300',
      subheadingColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-800',
      primaryBtnColor: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600',
      checkpoints: [
        courseName ? `You've mastered all chapters and lessons in ${courseName}.` : '',
        'You should be proud of this incredible achievement!',
      ],
      primaryBtn: {
        text: 'View Certificate',
        icon: <Award />,
        path: `/go/courses/${courseId}`,
      },
      secondaryBtn: {
        text: 'Back to Dashboard',
        icon: <Home />,
      },
    },
  };

  const config = configs[status];

  return (
    <>
      <Confetti
        width={width}
        height={height}
        numberOfPieces={
          status === 'next-lesson'
            ? 60
            : status === 'next-chapter'
              ? 200
              : status === 'chapter-complete'
                ? 400
                : status === 'course-complete'
                  ? 800
                  : 60
        }
        tweenDuration={
          status === 'next-lesson'
            ? 1200 // quick burst
            : status === 'next-chapter'
              ? 1800 // lingers a bit more
              : status === 'chapter-complete'
                ? 2500 // noticeable and rewarding
                : status === 'course-complete'
                  ? 4000 // grand finish
                  : 1200
        }
        gravity={0.5}
        recycle={false}
      />
      <motion.div
        className='w-full overflow-hidden'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} pt-6 pb-8 text-center`}
        >
          <motion.div
            className={`mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className='text-4xl'>{config.emoji}</span>
          </motion.div>
          <motion.h1
            className={`px-4 text-2xl font-bold ${config.headingColor}`}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {config.heading}
          </motion.h1>
          <motion.p
            className={`text-md mt-2 px-3 ${config.subheadingColor}`}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {config.subheading}
          </motion.p>
        </div>

        <div className='space-y-4 p-6'>
          <motion.div
            className='space-y-3'
            initial='hidden'
            animate='visible'
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.15,
                },
              },
            }}
          >
            {config.checkpoints.map((checkpoint, index) => (
              <motion.div
                key={index}
                className='flex items-start gap-3'
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <CheckCircle
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.headingColor.replace('700', '500')}`}
                />
                <p className='text-foreground font-secondary'>{checkpoint}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className='bg-card/50 mt-4 rounded-lg p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-foreground text-sm font-medium'>
                {status === 'next-lesson' || status === 'chapter-complete'
                  ? 'Chapter Progress'
                  : 'Course Progress'}
              </span>
              <span className='text-foreground text-sm font-medium'>
                {status === 'course-complete' || status === 'chapter-complete'
                  ? '100%'
                  : status === 'next-lesson'
                    ? `${chapterProgress}%`
                    : `${courseProgress}%`}
              </span>
            </div>
            <div className='bg-muted-foreground h-2 w-full overflow-hidden rounded-full'>
              <motion.div
                className={`h-full rounded-full ${config.primaryBtnColor.split(' ')[0]}`}
                initial={{ width: 0 }}
                animate={{
                  width:
                    status === 'course-complete' || status === 'chapter-complete'
                      ? '100%'
                      : status === 'next-lesson'
                        ? `${chapterProgress}%`
                        : `${courseProgress}%`,
                }}
                transition={{ duration: 1.5 }}
              />
            </div>
          </motion.div>
        </div>

        <div className='flex flex-col gap-3 p-6 pt-6'>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              className={`w-full gap-2 ${config.primaryBtnColor}`}
              onClick={() => navigate(config.primaryBtn.path)}
              rightIcon={config.primaryBtn.icon}
            >
              {config.primaryBtn.text}
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              className='w-full gap-2'
              variant='ghost'
              onClick={() => navigate(`/go/courses/${courseId}`)}
              leftIcon={config.secondaryBtn.icon}
            >
              {config.secondaryBtn.text}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
