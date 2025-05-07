import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { BookLock, LockOpen } from 'lucide-react';

import { NotFoundCard } from '../cards';
import { LessonHoverCard } from '../cards/lesson-hover-card';
import { LessonViewCard } from '../cards/lesson-view-card';
import { DisplayMode } from '../search-params/display-mode';

import { cn } from '~/lib/utils';
import type {
  UserActiveChapterAndLessonLoaderReturnType,
  UserCourseChaptersLoaderReturnType,
} from '~/routes/go/go-course-details';

interface Props {
  courseId: string;
  chapters: UserCourseChaptersLoaderReturnType;
  activeChapterAndLesson: UserActiveChapterAndLessonLoaderReturnType;
}
export interface ColorClass {
  bg: string;
  border: string;
}

const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

export function ChapterLessonTree({ courseId, chapters, activeChapterAndLesson }: Props) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const lessonRefs = useRef<Record<string, HTMLElement | null>>({});

  const [searchParams] = useSearchParams();

  const displayMode = searchParams.get('display') || 'path';
  const scrollToChapter = searchParams.get('next-chapter-id');
  const isPath = displayMode === 'path';

  useEffect(() => {
    if (scrollToChapter) {
      sectionRefs.current[scrollToChapter]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else if (activeChapterAndLesson?.lessonId) {
      lessonRefs.current[activeChapterAndLesson.lessonId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeChapterAndLesson?.lessonId, scrollToChapter]);

  return (
    <div className='relative pb-[500px]'>
      <div>
        <DisplayMode />
      </div>
      <div>
        {chapters && chapters.length ? (
          chapters.map((chapter) => (
            <section
              key={chapter.id}
              ref={(el) => {
                sectionRefs.current[chapter.id] = el;
              }}
              id={chapter.id}
              className='mb-8 scroll-mt-16'
            >
              <div className='bg-background/90 sticky top-14 z-5 pt-2 pb-4'>
                <div className='flex items-center space-x-1'>
                  <div className='flex-shrink-0'>
                    {chapter.requires_payment ? <BookLock size={16} /> : <LockOpen size={16} />}
                  </div>
                  <h1 className={cn('line-clamp-1 text-xl font-bold md:text-2xl')}>
                    {chapter.name}
                  </h1>
                </div>
              </div>
              <div>
                <p className='text-muted-foreground font-secondary line-clamp-3 text-sm'>
                  {chapter.description}
                </p>
              </div>
              {chapter.lessons?.length ? (
                <motion.div
                  className={cn(
                    { 'bg-card/30 rounded-2xl py-2': isPath },
                    { 'flex flex-col space-y-4': !isPath },
                  )}
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                >
                  {chapter.lessons.map((lesson) => {
                    const randomMarginLeft = isPath
                      ? `${Math.floor(Math.random() * 21) + 10}%`
                      : undefined;

                    return (
                      <motion.div
                        key={lesson.id}
                        layout
                        variants={itemVariants}
                        ref={(el) => {
                          lessonRefs.current[lesson.id] = el;
                        }}
                        className={cn(
                          {
                            'fl flex items-start py-4': isPath,
                          },
                          {
                            flex: !isPath,
                          },
                          'scroll-mt-34',
                        )}
                        style={isPath ? { marginLeft: randomMarginLeft } : {}}
                      >
                        {isPath ? (
                          <LessonHoverCard
                            lessonTypes={lesson.lesson_types}
                            name={lesson.name}
                            to={`/go/course/${courseId}/${chapter.id}/${lesson.id}/play`}
                            isCompleted={lesson.isCompleted}
                            isActiveLesson={lesson.id === activeChapterAndLesson?.lessonId}
                          />
                        ) : (
                          <LessonViewCard
                            lessonTypes={lesson.lesson_types}
                            name={lesson.name}
                            to={`/go/course/${courseId}/${chapter.id}/${lesson.id}/play`}
                            isCompleted={lesson.isCompleted}
                            isActiveLesson={lesson.id === activeChapterAndLesson?.lessonId}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <NotFoundCard message='No lessons found' />
              )}
            </section>
          ))
        ) : (
          <NotFoundCard message='No chapters found' />
        )}
      </div>
    </div>
  );
}
