import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';

import type { PublishOverviewChapter } from '@gonasi/schemas/publish/course-overview-with-progress';

import { NotFoundCard } from '../cards';
import { LessonHoverCard } from '../cards/lesson-hover-card';
import { LessonViewCard } from '../cards/lesson-view-card';
import { DisplayMode } from '../search-params/display-mode';
import { StickyChapterHeader } from './sticky-chapter-header';

import { cn } from '~/lib/utils';

interface Props {
  publishedCourseId: string;
  chapters: PublishOverviewChapter[];
  activeChapterId?: string | null;
  activeLessonId?: string | null;
  userHasAccess: boolean;
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

export function ChapterLessonTree({
  publishedCourseId,
  chapters,
  activeChapterId,
  activeLessonId,
  userHasAccess,
}: Props) {
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
    } else if (activeLessonId) {
      lessonRefs.current[activeLessonId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeLessonId, scrollToChapter]);

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
              className='mb-8 scroll-mt-18'
            >
              <StickyChapterHeader name={chapter.name} isActive={chapter.id === activeChapterId} />
              <div>
                <p className='text-muted-foreground font-secondary line-clamp-3 text-sm'>
                  {chapter.description}
                </p>
              </div>
              {chapter.lessons?.length ? (
                <motion.div
                  className={cn(
                    { 'md:bg-card/20 bg-card/10 py-2': isPath },
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
                            lessonTypes={lesson.lesson_type}
                            name={lesson.name}
                            to={`/c/${publishedCourseId}/${chapter.id}/${lesson.id}/play`}
                            progressPercentage={lesson.progress?.progress_percentage}
                            isActiveLesson={lesson.id === activeLessonId}
                            userHasAccess={userHasAccess}
                          />
                        ) : (
                          <LessonViewCard
                            lessonTypes={lesson.lesson_type}
                            name={lesson.name}
                            to={`/c/${publishedCourseId}/${chapter.id}/${lesson.id}/play`}
                            progressPercentage={lesson.progress?.progress_percentage}
                            isActiveLesson={lesson.id === activeLessonId}
                            userHasAccess={userHasAccess}
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
